import { z } from "zod";
import { formatINR, rupeesStringToPaise } from "@/lib/money";

// duplicated from the server on purpose (shared constants live in both apps)
export const MIN_ADMIN_DEPOSIT_PAISE = 100; // ₹1
export const MAX_ADMIN_DEPOSIT_PAISE = 10_000_000; // ₹1,00,000

export const depositSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Enter an amount")
    .regex(/^\d{1,9}(\.\d{1,2})?$/, "Use numbers only, with up to 2 decimals")
    .superRefine((value, ctx) => {
      const paise = rupeesStringToPaise(value);
      if (paise === null) return; // the regex message already covers it
      if (paise < MIN_ADMIN_DEPOSIT_PAISE) ctx.addIssue({ code: "custom", message: `Minimum is ${formatINR(MIN_ADMIN_DEPOSIT_PAISE)}` });
      else if (paise > MAX_ADMIN_DEPOSIT_PAISE) ctx.addIssue({ code: "custom", message: `Maximum is ${formatINR(MAX_ADMIN_DEPOSIT_PAISE)}` });
    }),
  reason: z.string().trim().min(3, "Give a reason (at least 3 characters)").max(200, "Keep the reason under 200 characters"),
});
