import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: ObjectId, ref: "User", required: true }, // the admin
    action: { type: String, enum: ["ADMIN_DEPOSIT", "USER_SUSPENDED", "USER_ACTIVATED"], required: true },
    targetUserId: { type: ObjectId, ref: "User", required: true }, // the customer acted upon
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // paymentId, amount, reason, note…
    ip: { type: String },
    requestId: { type: String }, // ties the row to the server log line
  },
  // append-only: nothing ever edits an audit row, so there is no updatedAt
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetUserId: 1, createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
