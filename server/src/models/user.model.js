import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true, select: false }, // never returned by default
    role: { type: String, enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER" },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" },
    tokenVersion: { type: Number, default: 0 }, // bump to kill every old JWT
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ name: 1 });

export const User = mongoose.model("User", userSchema);
