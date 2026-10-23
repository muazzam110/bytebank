import crypto from "node:crypto";

// Crockford base32: no I, L, O, U, so IDs are hard to misread
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// "PAY-" + 10 chars, e.g. PAY-8F3K29XQ7A.   256 % 32 === 0, so `byte % 32` is unbiased.
export function generatePaymentId() {
  const bytes = crypto.randomBytes(10);
  let id = "PAY-";
  for (const b of bytes) id += ALPHABET[b % 32];
  return id;
}

// 12 random digits, as a STRING (so a leading zero survives)
export function generateAccountNumber() {
  let n = "";
  for (let i = 0; i < 12; i++) n += crypto.randomInt(0, 10);
  return n;
}

export const maskAccountNumber = (n) => `•••• ${n.slice(-4)}`;
