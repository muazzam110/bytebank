import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const cookieBase = {
  httpOnly: true, // JS can't read it → XSS can't steal it
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
};

export function signSession(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, tv: user.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export const verifySession = (token) => jwt.verify(token, env.JWT_SECRET); // throws if bad

export function setSessionCookie(res, token) {
  res.cookie(env.COOKIE_NAME, token, { ...cookieBase, maxAge: TWO_HOURS_MS });
}

export function clearSessionCookie(res) {
  res.clearCookie(env.COOKIE_NAME, cookieBase);
}
