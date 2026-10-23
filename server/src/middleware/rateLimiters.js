import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const handler = (req, res, next) =>
  next(new AppError("RATE_LIMITED", 429, "Too many requests. Please wait a bit and try again."));

const base = { standardHeaders: true, legacyHeaders: false, handler };
const ipEmailKey = (req) =>
  `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? "").toLowerCase()}`;

// Spec says 100/15min; that's too tight while developing, so relax outside production
export const generalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === "production" ? 100 : 1000,
});

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_RATE_MAX,
  keyGenerator: ipEmailKey,
  skipSuccessfulRequests: true, // only failed logins count
});

export const emailLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: ipEmailKey,
});

// Per USER (not per IP): these routes always run after `authenticate`
const userKey = (req) => req.user?.id ?? ipKeyGenerator(req.ip);
const perUser = (limit) =>
  rateLimit({
    ...base,
    windowMs: 60 * 1000,
    limit: env.NODE_ENV === "production" ? limit : 1000, // relaxed while developing/testing (like generalLimiter)
    keyGenerator: userKey,
  });

export const transferLimiter = perUser(30); // 30 transfers / min
export const recipientSearchLimiter = perUser(60); // slows user-base scraping
export const lookupLimiter = perUser(60); // 60 lookups/min per user: slows payment-ID guessing
export const adminWriteLimiter = perUser(30); // 30 admin writes / min (relaxed outside production)
