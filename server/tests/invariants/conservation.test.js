import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, makeAdmin } from "../setup/factories.js";
import { createTransfer } from "../../src/services/transfer.service.js";
import { createDeposit } from "../../src/services/admin.service.js";
import { runReconciliation } from "../../src/services/reconcile.service.js";
import { Account } from "../../src/models/account.model.js";
import { LedgerEntry } from "../../src/models/ledgerEntry.model.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

beforeAll(startTestDB, 120_000);
afterAll(stopTestDB);

describe("conservation invariants", () => {
  it(
    "a storm of transfers AND admin deposits → reconcile PASSES",
    async () => {
      await clearDB();
      const admin = await makeAdmin();
      const people = [];
      for (const n of ["Asha", "Bhavna", "Chirag", "Dev", "Esha"]) {
        people.push(await makeCustomer(`${n} Test`, `${n.toLowerCase()}@example.com`));
      }

      const transfers = Array.from({ length: 40 }, () => {
        const i = Math.floor(Math.random() * people.length);
        let j;
        do {
          j = Math.floor(Math.random() * people.length);
        } while (j === i);
        return createTransfer({
          senderUserId: people[i].user._id,
          idempotencyKey: crypto.randomUUID(),
          recipientAccountId: people[j].account._id,
          amountPaise: (1 + Math.floor(Math.random() * 4000)) * 100,
        }).catch((e) => e);
      });
      const amounts = [50000, 100000, 150000, 200000, 250000, 300000]; // Σ = ₹10,500
      const deposits = amounts.map((amountPaise, k) =>
        createDeposit(
          admin._id,
          { userId: people[k % people.length].user._id, amountPaise, reason: "storm" },
          { ip: "127.0.0.1", requestId: `r${k}` }
        )
      );

      const outcomes = await Promise.all([...transfers, ...deposits]);
      outcomes.filter((o) => o instanceof Error).forEach((e) => expect(e.code).toBe("INSUFFICIENT_FUNDS"));

      const report = await runReconciliation();
      expect(report.checks.filter((c) => !c.ok)).toEqual([]);
      expect(report.ok).toBe(true);
      expect(report.stats.totalBalancePaise).toBe(5 * 1000000 + 1050000);
    },
    120_000
  );

  it("DETECTS tampering: a balance edited without a ledger entry makes reconcile FAIL", async () => {
    await clearDB();
    const A = await makeCustomer("Riya Sharma", "riya@example.com");
    await Account.updateOne({ _id: A.account._id }, { $inc: { balance: 100 } }); // ₹1 from nowhere
    const report = await runReconciliation();
    expect(report.ok).toBe(false);
    expect(report.checks.filter((c) => !c.ok).map((c) => c.id).sort()).toEqual(["A", "B"]);
  });

  it("DETECTS a missing ledger line", async () => {
    await clearDB();
    const A = await makeCustomer("Riya Sharma", "riya@example.com");
    await LedgerEntry.deleteOne({ accountId: A.account._id });
    const report = await runReconciliation();
    expect(report.ok).toBe(false);
    expect(report.checks.filter((c) => !c.ok).map((c) => c.id).sort()).toEqual(["B", "D"]);
  });
});
