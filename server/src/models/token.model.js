import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["PASSWORD_RESET"], required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
});

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Mongo auto-deletes expired rows

export const Token = mongoose.model("Token", tokenSchema);
