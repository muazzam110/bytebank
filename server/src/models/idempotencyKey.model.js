import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true },
  requestHash: { type: String, required: true }, // sha256 of the payload → detects "same key, different body"
  paymentId: { type: String, required: true }, // the payment this key produced
  createdAt: { type: Date, default: Date.now },
});

// A key is unique PER USER. This index is the real "exactly once" guard.
idempotencyKeySchema.index({ userId: 1, key: 1 }, { unique: true });
// Keys expire after 24 h
idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencyKeySchema);
