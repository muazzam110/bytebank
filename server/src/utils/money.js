import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

export const INITIAL_BALANCE_PAISE = env.INITIAL_BALANCE_PAISE;
export const MAX_TRANSFER_PAISE = env.MAX_TRANSFER_PAISE;
export const MAX_ADMIN_DEPOSIT_PAISE = env.MAX_ADMIN_DEPOSIT_PAISE;

// ₹1.00. ARCHITECTURE §6 says "min ₹1.00". A constant, not an env var.
export const MIN_TRANSFER_PAISE = 100;
export const MIN_ADMIN_DEPOSIT_PAISE = 100; // ₹1.00 (the max comes from env: MAX_ADMIN_DEPOSIT_PAISE)

// 1–9 whole digits, optional "." plus 1–2 decimals. No signs, no exponents, no spaces.
const AMOUNT_RE = /^\d{1,9}(\.\d{1,2})?$/;

// "500.00" → 50000.   Input must be a STRING so no float ever crosses the API boundary.
export function parseRupeesToPaise(input) {
  if (typeof input !== "string" || !AMOUNT_RE.test(input)) {
    throw new AppError("INVALID_AMOUNT", 422, "Enter an amount like 500 or 500.50.");
  }
  const [whole, fraction = ""] = input.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0")); // "5" → "50"
  if (paise <= 0) throw new AppError("INVALID_AMOUNT", 422, "Amount must be greater than zero.");
  return paise;
}

// 50000 → "500.00"  (pure integer math, no floats)
export function paiseToRupeesString(paise) {
  if (!Number.isSafeInteger(paise)) throw new TypeError("paise must be an integer");
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

// Even adding goes through here, so we can assert we never leave integer-land
export function addPaise(a, b) {
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) throw new TypeError("paise overflow or non-integer");
  return sum;
}

// 950000 → "₹9,500.00"  (Indian grouping; integer math only, for messages and emails)
export function formatRupees(paise) {
  if (!Number.isSafeInteger(paise)) throw new TypeError("paise must be an integer");
  const whole = new Intl.NumberFormat("en-IN").format(Math.floor(Math.abs(paise) / 100));
  return `${paise < 0 ? "-" : ""}₹${whole}.${String(Math.abs(paise) % 100).padStart(2, "0")}`;
}
