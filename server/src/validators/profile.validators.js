import { z } from "zod";

// .strict() is the whole security story here: email, role, status, balance → "Unrecognized key" → 400
export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string({ required_error: "Name is required" }).trim().min(2, "Name is too short").max(80),
    })
    .strict(),
});
