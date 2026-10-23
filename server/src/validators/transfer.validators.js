import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const transferSchema = z.object({
  // headers are lower-cased by Node. Our `validate` middleware passes them in (Phase 1).
  headers: z.object({
    "idempotency-key": z
      .string({ required_error: "Idempotency-Key header is required" })
      .uuid("Idempotency-Key must be a UUID"),
  }),
  body: z
    .object({
      recipient: z.object({ accountId: objectId }).strict(),
      // STRING only: no float ever crosses the API boundary
      amount: z
        .string({ invalid_type_error: 'amount must be a string like "500.00"', required_error: "amount is required" })
        .regex(/^\d{1,9}(\.\d{1,2})?$/, "Use up to 2 decimal places, e.g. 500.00"),
      description: z.string().trim().max(140, "Keep the note under 140 characters").optional(),
    })
    .strict(),
});

export const recipientSearchSchema = z.object({
  query: z
    .object({
      q: z.string().trim().min(3, "Type at least 3 characters").max(40),
    })
    .strict(),
});
