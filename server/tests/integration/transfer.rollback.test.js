import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, balanceOf } from "../setup/factories.js";
import { createTransfer } from "../../src/services/transfer.service.js";
import { Account } from "../../src/models/account.model.js";
import { Transaction } from "../../src/models/transaction.model.js";
import { LedgerEntry } from "../../src/models/ledgerEntry.model.js";
import { IdempotencyKey } from "../../src/models/idempotencyKey.model.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(clearDB);
afterEach(() => vi.restoreAllMocks());

describe("rollback", () => {
  it("a crash AFTER the debit and BEFORE the credit undoes everything", async () => {
    const A = await makeCustomer("Riya Sharma", "riya@example.com");
    const B = await makeCustomer("Aarav Mehta", "aarav@example.com");
    const ledgerBefore = await LedgerEntry.countDocuments();

    // Let the 1st findOneAndUpdate (the debit) run for real; blow up on the 2nd (the credit)
    const real = Account.findOneAndUpdate.bind(Account);
    let calls = 0;
    vi.spyOn(Account, "findOneAndUpdate").mockImplementation((...args) => {
      calls += 1;
      if (calls === 2) throw new Error("injected failure between debit and credit");
      return real(...args);
    });

    await expect(
      createTransfer({
        senderUserId: A.user._id,
        idempotencyKey: crypto.randomUUID(),
        recipientAccountId: B.account._id,
        amountPaise: 50000,
      })
    ).rejects.toThrow("injected failure");

    expect(calls).toBe(2); // proves the debit really ran before the crash
    expect(await balanceOf(A.account._id)).toBe(1000000); // debit was rolled back
    expect(await balanceOf(B.account._id)).toBe(1000000);
    expect(await Transaction.countDocuments({ type: "TRANSFER" })).toBe(0);
    expect(await LedgerEntry.countDocuments()).toBe(ledgerBefore);
    expect(await IdempotencyKey.countDocuments()).toBe(0);
  });
});
