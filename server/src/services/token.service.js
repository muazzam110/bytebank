import { Token } from "../models/token.model.js";
import { generateRawToken, hashToken } from "../utils/tokens.js";

// Creates a one-time token and returns the RAW value (only the hash is stored).
// Currently used only for password-reset links.
export async function issueToken(userId, type, ttlMs) {
  const raw = generateRawToken();
  await Token.deleteMany({ userId, type, usedAt: null }); // newest link wins
  await Token.create({
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return raw; // only returned here, never stored
}
