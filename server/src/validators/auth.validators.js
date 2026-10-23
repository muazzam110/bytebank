import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email").max(254);
const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Use at most 72 characters") // bcrypt only reads 72 bytes
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

// .strict() rejects unknown keys → mass-assignment protection (e.g. "role":"ADMIN")
export const signupSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, "Name is too short").max(80),
      email,
      password,
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1).max(72) }).strict(),
});

export const forgotSchema = z.object({ body: z.object({ email }).strict() });

export const resetSchema = z.object({
  body: z.object({ token: z.string().trim().min(1).max(200), newPassword: password }).strict(),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1).max(72),
      newPassword: password,
    })
    .strict(),
});
