import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // one account per user
    accountNumber: { type: String, required: true, unique: true, match: /^\d{12}$/ },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // never negative
      validate: { validator: Number.isInteger, message: "balance must be an integer (paise)" },
    },
    currency: { type: String, enum: ["INR"], default: "INR" },
    status: { type: String, enum: ["ACTIVE", "FROZEN"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export const Account = mongoose.model("Account", accountSchema);
