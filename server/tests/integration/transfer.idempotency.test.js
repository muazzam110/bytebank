import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, balanceOf } from "../setup/factories.js";
import { createTransfer } from "../../src/services/transfer.service.js";
import { Transaction } from "../../src/models/transaction.model.js";
import { sendPaymentReceived } from "../../src/services/email.service.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

let A, B, input;
beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(async () => {
  await clearDB();
  vi.clearAllMocks();
  A = await makeCustomer("Riya Sharma", "riya@example.com");
  B = await makeCustomer("Aarav Mehta", "aarav@example.com");
  input = {
    senderUserId: A.user._id,
    idempotencyKey: crypto.randomUUID(),
    recipientAccountId: B.account._id,
    amountPaise: 50000,
    description: "Lunch",
  };
});

describe("idempotency", () => {
  it("same key twice (sequential) → one payment, same paymentId, replayed flag", async () => {
    const first = await createTransfer(input);
    const second = await createTransfer(input);
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.payment.paymentId).toBe(first.payment.paymentId);
    expect(await balanceOf(A.account._id)).toBe(950000);
    expect(await Transaction.countDocuments({ type: "TRANSFER" })).toBe(1);
    expect(sendPaymentReceived).toHaveBeenCalledTimes(1); // a replay sends NO second email
  });

  it(
    "same key, 5 requests IN PARALLEL → still exactly one payment",
    async () => {
      const results = await Promise.all(Array.from({ length: 5 }, () => createTransfer(input)));
      expect(new Set(results.map((r) => r.payment.paymentId)).size).toBe(1);
      expect(results.filter((r) => !r.replayed)).toHaveLength(1);
      expect(await balanceOf(A.account._id)).toBe(950000);
      expect(await balanceOf(B.account._id)).toBe(1050000);
      expect(await Transaction.countDocuments({ type: "TRANSFER" })).toBe(1);
    },
    60_000
  );

  it("same key with a DIFFERENT amount → IDEMPOTENCY_CONFLICT, nothing extra moves", async () => {
    await createTransfer(input);
    await expect(createTransfer({ ...input, amountPaise: 70000 })).rejects.toMatchObject({
      code: "IDEMPOTENCY_CONFLICT",
      status: 409,
    });
    expect(await balanceOf(A.account._id)).toBe(950000);
  });
});
