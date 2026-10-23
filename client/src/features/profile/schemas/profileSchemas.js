import { z } from "zod";
import { password } from "@/features/auth/schemas/authSchemas";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: password,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });
