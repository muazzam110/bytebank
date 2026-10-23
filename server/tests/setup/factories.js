import mongoose from "mongoose";
import { User } from "../../src/models/user.model.js";
import { Account } from "../../src/models/account.model.js";
import { provisionAccount } from "../../src/services/account.service.js";
import { signSession } from "../../src/utils/jwt.js";
import { env } from "../../src/config/env.js";

// Customer with a real account holding ₹10,000, built exactly like production does it
export async function makeCustomer(name, email) {
  const user = await User.create({ name, email, passwordHash: "x" });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(() => provisionAccount(user, session));
  } finally {
    await session.endSession();
  }
  const account = await Account.findOne({ userId: user._id });
  return { user, account };
}

export const makeAdmin = (email = "admin@example.com") =>
  User.create({ name: "Admin", email, passwordHash: "x", role: "ADMIN" });

// A session cookie without going through login (no bcrypt, no login rate limit)
export const cookieFor = (user) => `${env.COOKIE_NAME}=${signSession(user)}`;

export const balanceOf = async (accountId) => (await Account.findById(accountId)).balance;
