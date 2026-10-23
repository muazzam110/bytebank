import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, balanceOf } from "../setup/factories.js";
import { createTransfer } from "../../src/services/transfer.service.js";
import { Transaction } from "../../src/models/transaction.model.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(clearDB);

describe("concurrency", () => {
  it(
    "50 parallel ₹100 transfers from ₹1,000 → exactly 10 succeed, never overdrawn",
    async () => {
      const A = await makeCustomer("Riya Sharma", "riya@example.com");
      const B = await makeCustomer("Aarav Mehta", "aarav@example.com");

      // Get Riya down to exactly ₹1,000 using the REAL service (keeps the ledger consistent)
      await createTransfer({
        senderUserId: A.user._id,
        idempotencyKey: crypto.randomUUID(),
        recipientAccountId: B.account._id,
        amountPaise: 900000,
      });
      expect(await balanceOf(A.account._id)).toBe(100000);

      const results = await Promise.allSettled(
        Array.from({ length: 50 }, () =>
          createTransfer({
            senderUserId: A.user._id,
            idempotencyKey: crypto.randomUUID(),
            recipientAccountId: B.account._id,
            amountPaise: 10000,
          })
        )
      );

      const ok = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");
      expect(ok).toHaveLength(10);
      expect(failed).toHaveLength(40);
      failed.forEach((f) => expect(f.reason.code).toBe("INSUFFICIENT_FUNDS"));

      expect(await balanceOf(A.account._id)).toBe(0); // never negative
      expect(await balanceOf(B.account._id)).toBe(2000000); // money conserved
      expect(await Transaction.countDocuments({ type: "TRANSFER" })).toBe(11); // 1 setup + 10
    },
    120_000
  );
});
