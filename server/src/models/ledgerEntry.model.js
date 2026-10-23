import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const ledgerEntrySchema = new mongoose.Schema(
  {
    transactionId: { type: ObjectId, ref: "Transaction", required: true },
    paymentId: { type: String, required: true },
    accountId: { type: ObjectId, ref: "Account", required: true },
    type: { type: String, enum: ["INITIAL_DEPOSIT", "TRANSFER", "ADMIN_DEPOSIT"], required: true }, // D-17
    direction: { type: String, enum: ["DEBIT", "CREDIT"], required: true },
    amount: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger } },
    balanceAfter: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger } },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerEntrySchema.index({ accountId: 1, createdAt: -1 });
ledgerEntrySchema.index({ paymentId: 1 });

export const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);
