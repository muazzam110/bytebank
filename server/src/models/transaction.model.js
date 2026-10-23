import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;
const isInt = { validator: Number.isInteger, message: "must be an integer (paise)" };

const transactionSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true }, // public handle: PAY-XXXXXXXXXX
    type: { type: String, enum: ["INITIAL_DEPOSIT", "TRANSFER", "ADMIN_DEPOSIT"], required: true },
    status: { type: String, enum: ["COMPLETED", "FAILED"], default: "COMPLETED" },
    amount: { type: Number, required: true, min: 1, validate: isInt },
    currency: { type: String, default: "INR" },

    fromAccountId: { type: ObjectId, ref: "Account", default: null }, // null for deposits
    fromUserId: { type: ObjectId, ref: "User", default: null },
    toAccountId: { type: ObjectId, ref: "Account", required: true },
    toUserId: { type: ObjectId, ref: "User", required: true },

    // D-16: names frozen at payment time → receipts stay correct and search needs no joins
    fromNameSnapshot: { type: String },
    toNameSnapshot: { type: String },

    description: { type: String, trim: true, maxlength: 140 },
    reason: { type: String, trim: true, maxlength: 200 }, // ADMIN_DEPOSIT (Phase 5)
    createdByAdminId: { type: ObjectId, ref: "User", default: null },

    senderBalanceAfter: { type: Number },
    receiverBalanceAfter: { type: Number },
    idempotencyKey: { type: String }, // transfers (Phase 3)
  },
  // Transactions NEVER change after creation, so there is no updatedAt
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Customer history (Phase 4 uses $or over these two)
transactionSchema.index({ fromAccountId: 1, createdAt: -1 });
transactionSchema.index({ toAccountId: 1, createdAt: -1 });
// Admin views
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });

// ⭐ THE exactly-once guarantee: at most ONE INITIAL_DEPOSIT per receiving account
transactionSchema.index(
  { toAccountId: 1 },
  { unique: true, partialFilterExpression: { type: "INITIAL_DEPOSIT" } }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
