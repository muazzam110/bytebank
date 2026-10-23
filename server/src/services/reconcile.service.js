import { Account } from "../models/account.model.js";
import { Transaction } from "../models/transaction.model.js";
import { LedgerEntry } from "../models/ledgerEntry.model.js";
import { addPaise, formatRupees } from "../utils/money.js";

const MAX_SHOWN = 10;
const totalOf = (rows) => rows[0]?.total ?? 0;
const check = (id, name, problems, summary) => ({
  id,
  name,
  ok: problems.length === 0,
  summary,
  problems: problems.slice(0, MAX_SHOWN),
  problemCount: problems.length,
});

/**
 * Proves the system's promises over ALL data (not one test scenario).
 * Pure read-only. Used by scripts/reconcile.js and by the invariant tests.
 */
export async function runReconciliation() {
  const [accounts, depositRows, ledgerByAccount, ledgerByTx, transactions, initialAccountIds] = await Promise.all([
    Account.find().select("balance").lean(),
    Transaction.aggregate([
      { $match: { type: { $in: ["INITIAL_DEPOSIT", "ADMIN_DEPOSIT"] }, status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    LedgerEntry.aggregate([
      {
        $group: {
          _id: "$accountId",
          credit: { $sum: { $cond: [{ $eq: ["$direction", "CREDIT"] }, "$amount", 0] } },
          debit: { $sum: { $cond: [{ $eq: ["$direction", "DEBIT"] }, "$amount", 0] } },
        },
      },
    ]),
    LedgerEntry.aggregate([
      {
        $group: {
          _id: "$transactionId",
          entries: { $sum: 1 },
          credits: { $sum: { $cond: [{ $eq: ["$direction", "CREDIT"] }, 1, 0] } },
          debits: { $sum: { $cond: [{ $eq: ["$direction", "DEBIT"] }, 1, 0] } },
        },
      },
    ]),
    Transaction.find().select("_id type paymentId").lean(),
    Transaction.distinct("toAccountId", { type: "INITIAL_DEPOSIT" }),
  ]);

  const accountIds = new Set(accounts.map((a) => String(a._id)));
  const safeBalances = accounts.filter((a) => Number.isSafeInteger(a.balance));
  const totalBalance = safeBalances.reduce((sum, a) => addPaise(sum, a.balance), 0);
  const deposited = totalOf(depositRows);

  // (a) money conservation: transfers move money, only deposits create it
  const a = check(
    "A",
    "Conservation: Σ balances = Σ initial + admin deposits",
    totalBalance === deposited ? [] : [`balances ${formatRupees(totalBalance)} ≠ deposits ${formatRupees(deposited)}`],
    `${formatRupees(totalBalance)} = ${formatRupees(deposited)}`
  );

  // (b) every account: balance == Σ credits − Σ debits (and no ledger line points at a missing account)
  const net = new Map(ledgerByAccount.map((r) => [String(r._id), addPaise(r.credit, -r.debit)]));
  const bProblems = [];
  for (const acc of accounts) {
    const expected = net.get(String(acc._id)) ?? 0;
    if (acc.balance !== expected) {
      bProblems.push(`account ${acc._id}: balance ${acc.balance} ≠ ledger net ${expected}`);
    }
  }
  for (const id of net.keys()) if (!accountIds.has(id)) bProblems.push(`ledger rows reference missing account ${id}`);
  const b = check("B", "Ledger agrees with every balance", bProblems, `${accounts.length} account(s) checked`);

  // (c) no negative or non-integer balances
  const cProblems = accounts
    .filter((x) => !Number.isSafeInteger(x.balance) || x.balance < 0)
    .map((x) => `account ${x._id}: invalid balance ${x.balance}`);
  const c = check("C", "No negative / non-integer balances", cProblems, "all balances are integers ≥ 0");

  // (d) every transaction has exactly the ledger lines its type requires
  const lines = new Map(ledgerByTx.map((r) => [String(r._id), r]));
  const dProblems = [];
  for (const tx of transactions) {
    const l = lines.get(String(tx._id)) ?? { entries: 0, credits: 0, debits: 0 };
    const ok =
      tx.type === "TRANSFER"
        ? l.entries === 2 && l.credits === 1 && l.debits === 1
        : l.entries === 1 && l.credits === 1;
    if (!ok) dProblems.push(`${tx.paymentId} (${tx.type}): ${l.entries} ledger line(s), ${l.debits} debit / ${l.credits} credit`);
    lines.delete(String(tx._id));
  }
  for (const id of lines.keys()) dProblems.push(`ledger rows reference missing transaction ${id}`);
  const d = check(
    "D",
    "Every transaction has its ledger lines (TRANSFER=2, deposits=1)",
    dProblems,
    `${transactions.length} transaction(s) checked`
  );

  // (e) every account got its welcome deposit exactly once (the partial unique index guarantees "at most")
  const hasInitial = new Set(initialAccountIds.map(String));
  const eProblems = accounts.filter((x) => !hasInitial.has(String(x._id))).map((x) => `account ${x._id} has no INITIAL_DEPOSIT`);
  const e = check("E", "Every account has its INITIAL_DEPOSIT", eProblems, "welcome deposits present");

  const checks = [a, b, c, d, e];
  return {
    ok: checks.every((x) => x.ok),
    checks,
    stats: {
      accounts: accounts.length,
      transactions: transactions.length,
      ledgerEntries: ledgerByTx.reduce((n, r) => n + r.entries, 0), // a COUNT, not money
      totalBalancePaise: totalBalance,
    },
  };
}
