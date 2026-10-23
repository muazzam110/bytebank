import { Account } from "../models/account.model.js";
import { Transaction } from "../models/transaction.model.js";
import { LedgerEntry } from "../models/ledgerEntry.model.js";
import { AppError } from "../utils/AppError.js";
import { generateAccountNumber, generatePaymentId } from "../utils/ids.js";
import { INITIAL_BALANCE_PAISE, addPaise } from "../utils/money.js";

// ───────────────────────── provisioning (called inside the signup transaction) ─────────────────────────

// ⚠️ We CHECK before inserting instead of "insert, catch duplicate, retry".
// Inside a Mongo transaction, a duplicate-key error ABORTS the whole transaction,
// so you can't catch it and try again. With 10^12 possible numbers a clash is
// practically impossible; if it ever happens the transaction rolls back and the user retries.
async function uniqueAccountNumber(session) {
  for (let i = 0; i < 5; i++) {
    const candidate = generateAccountNumber();
    const taken = await Account.exists({ accountNumber: candidate }).session(session);
    if (!taken) return candidate;
  }
  throw new AppError("INTERNAL_ERROR", 500, "Could not allocate an account number.");
}

/**
 * Creates the Account, the one INITIAL_DEPOSIT Transaction and its CREDIT LedgerEntry.
 * MUST run inside an existing transaction: pass the session.
 */
export async function provisionAccount(user, session) {
  if (!session) throw new Error("provisionAccount must run inside a transaction (pass a session)");

  const accountNumber = await uniqueAccountNumber(session);

  // create([doc], {session}) → the ARRAY form is required when passing options
  const [account] = await Account.create(
    [{ userId: user._id, accountNumber, balance: INITIAL_BALANCE_PAISE }],
    { session }
  );

  const paymentId = generatePaymentId();
  const [tx] = await Transaction.create(
    [
      {
        paymentId,
        type: "INITIAL_DEPOSIT",
        amount: INITIAL_BALANCE_PAISE,
        toAccountId: account._id,
        toUserId: user._id,
        fromNameSnapshot: "Bytebank",
        toNameSnapshot: user.name,
        receiverBalanceAfter: INITIAL_BALANCE_PAISE,
        description: "Welcome deposit",
      },
    ],
    { session }
  );

  await LedgerEntry.create(
    [
      {
        transactionId: tx._id,
        paymentId,
        accountId: account._id,
        type: "INITIAL_DEPOSIT",
        direction: "CREDIT",
        amount: INITIAL_BALANCE_PAISE,
        balanceAfter: INITIAL_BALANCE_PAISE,
      },
    ],
    { session }
  );

  return account;
}

// ───────────────────────── reads ─────────────────────────

async function findAccountOrThrow(userId) {
  const account = await Account.findOne({ userId });
  if (!account) throw new AppError("NOT_FOUND", 404, "No account found for this user.");
  return account;
}

export async function getAccountByUserId(userId) {
  const a = await findAccountOrThrow(userId);
  return {
    accountNumber: a.accountNumber,
    balancePaise: a.balance,
    currency: a.currency,
    status: a.status,
    createdAt: a.createdAt,
  };
}

// Shape shared with Phase 4's history list (Phase 4 will import this)
export function toTransactionListItem(tx, accountId) {
  const received = String(tx.toAccountId) === String(accountId);
  return {
    paymentId: tx.paymentId,
    type: tx.type,
    direction: received ? "received" : "sent",
    amountPaise: tx.amount,
    counterparty:
      tx.type === "TRANSFER" ? { name: received ? tx.fromNameSnapshot : tx.toNameSnapshot } : null,
    status: tx.status,
    description: tx.description ?? null,
    createdAt: tx.createdAt,
  };
}

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000; // India has no daylight saving, so a fixed offset is safe
const istDayKey = (date) => new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export async function getSummary(userId, range = "30d") {
  const days = RANGE_DAYS[range];
  const account = await findAccountOrThrow(userId);

  // Calendar days (IST) in the window, oldest → newest, e.g. ["2026-09-11", …, "2026-10-10"]
  const now = Date.now();
  const dayKeys = Array.from({ length: days }, (_, i) =>
    istDayKey(new Date(now - (days - 1 - i) * DAY_MS))
  );
  const since = new Date(`${dayKeys[0]}T00:00:00+05:30`);
  const inRange = { accountId: account._id, createdAt: { $gte: since } }; // aggregate() does NOT auto-cast ids, so use account._id

  const [totalsRows, trajectoryRows, before, recent] = await Promise.all([
    // 1) totals grouped by direction + type
    LedgerEntry.aggregate([
      { $match: inRange },
      { $group: { _id: { direction: "$direction", type: "$type" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    // 2) last balanceAfter of each IST day
    LedgerEntry.aggregate([
      { $match: inRange },
      { $sort: { createdAt: 1, _id: 1 } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          balancePaise: { $last: "$balanceAfter" },
        },
      },
    ]),
    // 3) balance just BEFORE the window (starting point of the line)
    LedgerEntry.findOne({ accountId: account._id, createdAt: { $lt: since } })
      .sort({ createdAt: -1, _id: -1 })
      .select("balanceAfter")
      .lean(),
    // 4) five most recent transactions (any direction)
    Transaction.find({ $or: [{ fromAccountId: account._id }, { toAccountId: account._id }] })
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .lean(),
  ]);

  let totalReceivedPaise = 0;
  let totalSentPaise = 0;
  let transactionCount = 0;
  const byType = {};
  for (const row of totalsRows) {
    if (row._id.direction === "CREDIT") totalReceivedPaise = addPaise(totalReceivedPaise, row.total);
    else totalSentPaise = addPaise(totalSentPaise, row.total);
    byType[row._id.type] = addPaise(byType[row._id.type] ?? 0, row.total);
    transactionCount += row.count;
  }

  // Fill days that had no activity by carrying the previous balance forward → a continuous line
  const lastOfDay = new Map(trajectoryRows.map((r) => [r._id, r.balancePaise]));
  let running = before?.balanceAfter ?? 0;
  const trajectory = dayKeys.map((date) => {
    if (lastOfDay.has(date)) running = lastOfDay.get(date);
    return { date, balancePaise: running };
  });

  return {
    range,
    totalReceivedPaise,
    totalSentPaise,
    transactionCount,
    byType,
    trajectory,
    recentTransactions: recent.map((tx) => toTransactionListItem(tx, account._id)),
  };
}
