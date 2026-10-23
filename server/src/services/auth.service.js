import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Token } from "../models/token.model.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { hashToken } from "../utils/tokens.js";
import { issueToken } from "./token.service.js";
import { provisionAccount } from "./account.service.js";
import { sendPasswordResetEmail } from "./email.service.js";

const COST = 12;
// Used so a wrong-email login takes as long as a wrong-password one (no timing leak)
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", COST);

export const hashPassword = (plain) => bcrypt.hash(plain, COST);

export const toPublicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
});

const GENERIC_RESET_MSG = "If that email is registered, we've sent a message.";
const emailTaken = () => new AppError("EMAIL_TAKEN", 409, "An account with this email already exists.");

/**
 * Signup = user + account + ₹10,000 welcome deposit, created TOGETHER in one transaction.
 * (No email verification step: you sign up, then you log in.)
 */
export async function signup({ name, email, password }) {
  if (await User.exists({ email })) throw emailTaken();
  const passwordHash = await hashPassword(password); // slow on purpose, so do it BEFORE the transaction

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const [user] = await User.create([{ name, email, passwordHash }], { session });
      await provisionAccount(user, session);
    });
  } catch (err) {
    // Two signups with the same email raced past the check above: the unique index decides the winner
    if (err?.code === 11000 && (err.keyPattern?.email !== undefined || /email/i.test(err.message ?? ""))) {
      throw emailTaken();
    }
    throw err;
  } finally {
    await session.endSession();
  }
  return { message: "Account created. You can log in now." };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) {
    throw new AppError("UNAUTHENTICATED", 401, "Email or password is incorrect.");
  }
  // Only AFTER the password is right do we reveal that the account is suspended
  if (user.status !== "ACTIVE") {
    throw new AppError("ACCOUNT_SUSPENDED", 403, "This account is suspended.");
  }
  return user;
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (user && user.status === "ACTIVE") {
    const raw = await issueToken(user._id, "PASSWORD_RESET", 30 * 60 * 1000);
    try {
      await sendPasswordResetEmail(user, raw);
    } catch (err) {
      logger.error({ err }, "Failed to send reset email");
    }
  }
  return { message: GENERIC_RESET_MSG }; // identical whether or not the user exists
}

export async function resetPassword({ token, newPassword }) {
  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(newPassword);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const t = await Token.findOneAndUpdate(
        { tokenHash, type: "PASSWORD_RESET", usedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { usedAt: new Date() } },
        { session, new: true }
      );
      if (!t) throw new AppError("INVALID_OR_EXPIRED_TOKEN", 400, "This link is invalid or has expired.");
      await User.updateOne(
        { _id: t.userId },
        { $set: { passwordHash }, $inc: { tokenVersion: 1 } }, // kills all old sessions
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  return { message: "Password updated. Please log in." };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError("UNAUTHENTICATED", 401, "Please log in.");

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  // 400, NOT 401: the frontend logs users out on any 401, and this user IS logged in
  if (!ok) throw new AppError("INVALID_CURRENT_PASSWORD", 400, "Your current password is incorrect.");

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1; // other sessions die; controller re-issues a cookie for this one
  await user.save();
  return user;
}
