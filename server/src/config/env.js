import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN: z.string().default("2h"),
  COOKIE_NAME: z.string().default("bb_session"),
  CLIENT_ORIGIN: z.string().url(),
  EMAIL_MODE: z.enum(["console", "smtp"]).default("console"),
  MAIL_FROM: z.string().default("Bytebank <no-reply@bytebank.dev>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  LOGIN_RATE_MAX: z.coerce.number().default(5),
  INITIAL_BALANCE_PAISE: z.coerce.number().int().default(1000000),
  MAX_TRANSFER_PAISE: z.coerce.number().int().default(5000000),
  MAX_ADMIN_DEPOSIT_PAISE: z.coerce.number().int().default(10000000),
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // crash at boot, don't run half-configured
}

export const env = Object.freeze(parsed.data);
