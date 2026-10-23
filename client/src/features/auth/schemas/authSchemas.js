import { z } from "zod";

const email = z.string().trim().toLowerCase().min(1, "Email is required").email("Enter a valid email");
export const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const signupSchema = z.object({ name: z.string().trim().min(2, "Name is too short").max(80), email, password });
export const loginSchema = z.object({ email, password: z.string().min(1, "Password is required") });
export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ newPassword: password });
