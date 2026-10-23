import { z } from "zod";
import { isoDay, checkDateRange } from "./transaction.validators.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const usersQuerySchema = z.object({
  query: z
    .object({
      q: z.string().trim().max(40).optional(),
      status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
      page,
      limit,
    })
    .strict(),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: objectId }).strict(),
});

export const statusSchema = z.object({
  params: z.object({ id: objectId }).strict(),
  body: z
    .object({
      status: z.enum(["ACTIVE", "SUSPENDED"]),
      note: z.string().trim().max(200).optional(),
    })
    .strict(),
});

export const depositSchema = z.object({
  body: z
    .object({
      userId: objectId,
      // STRING only, same rule as transfers: no float ever crosses the boundary
      amount: z
        .string({ required_error: "amount is required", invalid_type_error: 'amount must be a string like "2500.00"' })
        .regex(/^\d{1,9}(\.\d{1,2})?$/, "Use up to 2 decimal places, e.g. 2500.00"),
      // REQUIRED (PRD 4.3): every deposit records why
      reason: z
        .string({ required_error: "A reason is required" })
        .trim()
        .min(3, "Give a reason (at least 3 characters)")
        .max(200, "Keep the reason under 200 characters"),
    })
    .strict(),
});

export const adminTransactionsQuerySchema = z.object({
  query: z
    .object({
      q: z.string().trim().max(40).optional(),
      type: z.enum(["INITIAL_DEPOSIT", "TRANSFER", "ADMIN_DEPOSIT"]).optional(),
      status: z.enum(["COMPLETED", "FAILED"]).optional(),
      from: isoDay.optional(),
      to: isoDay.optional(),
      userId: objectId.optional(),
      page,
      limit,
      sort: z.enum(["createdAt", "-createdAt", "amount", "-amount"]).default("-createdAt"),
    })
    .strict()
    .superRefine(checkDateRange),
});

export const depositsQuerySchema = z.object({
  query: z.object({ userId: objectId.optional(), page, limit }).strict(),
});
