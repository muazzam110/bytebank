import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, balanceOf } from "../setup/factories.js";
import { createTransfer } from "../../src/services/transfer.service.js";
import { Account } from "../../src/models/account.model.js";
import { LedgerEntry } from "../../src/models/ledgerEntry.model.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

beforeAll(startTestDB);
afterAll(stopTestDB);

describe("conservation", () => {
  it(
    "a random transfer storm never creates or destroys money, and ledgers match balances",
    async () => {
      await clearDB();
      const people = [];
      for (const n of ["Asha", "Bhavna", "Chirag", "Dev", "Esha"]) {
        people.push(await makeCustomer(`${n} Test`, `${n.toLowerCase()}@example.com`));
      }

      const jobs = Array.from({ length: 40 }, () => {
        const i = Math.floor(Math.random() * people.length);
        let j;
        do {
          j = Math.floor(Math.random() * people.length);
        } while (j === i);
        return createTransfer({
          senderUserId: people[i].user._id,
          idempotencyKey: crypto.randomUUID(),
          recipientAccountId: people[j].account._id,
          amountPaise: (1 + Math.floor(Math.random() * 4000)) * 100, // ₹1 – ₹4,000
        }).catch((e) => e);
      });
      const outcomes = await Promise.all(jobs);
      // the only acceptable failure in this storm is "not enough money"
      outcomes.filter((o) => o instanceof Error).forEach((e) => expect(e.code).toBe("INSUFFICIENT_FUNDS"));

      // 1) total money unchanged: 1,000,000 × verified customers
      const [{ total }] = await Account.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]);
      expect(total).toBe(1000000 * people.length);

      // 2) per account: balance == Σ credits − Σ debits, and never negative
      for (const p of people) {
        const rows = await LedgerEntry.aggregate([
          { $match: { accountId: p.account._id } },
          { $group: { _id: "$direction", sum: { $sum: "$amount" } } },
        ]);
        const credit = rows.find((r) => r._id === "CREDIT")?.sum ?? 0;
        const debit = rows.find((r) => r._id === "DEBIT")?.sum ?? 0;
        const balance = await balanceOf(p.account._id);
        expect(credit - debit).toBe(balance);
        expect(balance).toBeGreaterThanOrEqual(0);
      }
    },
    120_000
  );
});
