import crypto from "node:crypto";

export const generateRawToken = () => crypto.randomBytes(32).toString("hex");
export const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");
