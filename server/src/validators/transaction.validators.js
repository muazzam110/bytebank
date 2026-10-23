import { z } from "zod";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SPAN_DAYS = 366;

// "2026-10-10" must be a REAL calendar day ("2026-02-31" is rejected)
export const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Not a real calendar date");

// shared with admin.validators.js
export function checkDateRange(q, ctx) {
  if (q.from && q.to) {
    if (q.from > q.to) {
      ctx.addIssue({ code: "custom", path: ["from"], message: "'from' must not be after 'to'" });
    } else {
      const span = (Date.parse(`${q.to}T00:00:00Z`) - Date.parse(`${q.from}T00:00:00Z`)) / DAY_MS;
      if (span > MAX_SPAN_DAYS) {
        ctx.addIssue({ code: "custom", path: ["to"], message: `Date range can be at most ${MAX_SPAN_DAYS} days` });
      }
    }
  }
}

export const listQuerySchema = z.object({
  query: z
    .object({
      q: z.string().trim().max(40).optional(),
      direction: z.enum(["all", "sent", "received"]).default("all"),
      type: z.enum(["INITIAL_DEPOSIT", "TRANSFER", "ADMIN_DEPOSIT"]).optional(),
      status: z.enum(["COMPLETED", "FAILED"]).optional(),
      from: isoDay.optional(),
      to: isoDay.optional(),
      // query strings are always text → coerce to numbers. A missing value uses the default.
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      // whitelist: the client can never choose an arbitrary field to sort by
      sort: z.enum(["createdAt", "-createdAt", "amount", "-amount"]).default("-createdAt"),
    })
    .strict() // unknown query params → 400
    .superRefine(checkDateRange),
});

export const paymentIdParamSchema = z.object({
  params: z
    .object({
      // upper-cased first, so a pasted "pay-8f3k…" still works.
      // Lenient on purpose: well-formed-but-unknown IDs get a 404, malformed ones a 400.
      paymentId: z.string().trim().toUpperCase().regex(/^PAY-[0-9A-Z]{10}$/, "Invalid payment ID"),
    })
    .strict(),
});
