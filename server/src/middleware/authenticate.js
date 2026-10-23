import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifySession } from "../utils/jwt.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) throw new AppError("UNAUTHENTICATED", 401, "Please log in.");

  let payload;
  try {
    payload = verifySession(token);
  } catch {
    throw new AppError("UNAUTHENTICATED", 401, "Your session has expired. Please log in again.");
  }

  // DB read on EVERY request: suspension & password changes take effect immediately
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tv) {
    throw new AppError("UNAUTHENTICATED", 401, "Your session is no longer valid. Please log in again.");
  }
  if (user.status !== "ACTIVE") {
    throw new AppError("ACCOUNT_SUSPENDED", 403, "This account is suspended.");
  }

  req.user = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
  next();
});
