import { z } from "zod";
import { formatINR, rupeesStringToPaise } from "@/lib/money";

// Duplicated from the server on purpose ("shared constants duplicated in both apps")
export const MIN_TRANSFER_PAISE = 100; // ₹1
export const MAX_TRANSFER_PAISE = 5_000_000; // ₹50,000
export const LARGE_TRANSFER_PAISE = 500_000; // ₹5,000 → gentle extra confirmation line

const amountFormat = z.string().regex(/^\d{1,9}(\.\d{1,2})?$/, "Use numbers only, with up to 2 decimals.");

// Keep the box clean while typing: digits + one dot, max 2 decimals, max 9 whole digits
export function sanitizeAmountInput(raw) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const w = whole.slice(0, 9);
  return rest.length ? `${w}.${rest.join("").slice(0, 2)}` : w;
}

// UX feedback only. The server re-validates everything.
export function validateAmount(input, availablePaise) {
  const value = input.trim().replace(/\.$/, ""); // "12." is just "still typing"
  if (!value) return { paise: null, error: null };
  const format = amountFormat.safeParse(value);
  if (!format.success) return { paise: null, error: format.error.issues[0].message };

  const paise = rupeesStringToPaise(value);
  if (paise < MIN_TRANSFER_PAISE) return { paise: null, error: `Minimum is ${formatINR(MIN_TRANSFER_PAISE)}.` };
  if (paise > MAX_TRANSFER_PAISE) return { paise: null, error: `Maximum per transfer is ${formatINR(MAX_TRANSFER_PAISE)}.` };
  if (availablePaise !== undefined && paise > availablePaise) {
    return { paise: null, error: `You have ${formatINR(availablePaise)} available. Try a smaller amount.` };
  }
  return { paise, error: null };
}
