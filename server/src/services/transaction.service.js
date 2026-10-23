import { Account } from "../models/account.model.js";
import { Transaction } from "../models/transaction.model.js";
import { AppError } from "../utils/AppError.js";
import { maskAccountNumber } from "../utils/ids.js";

// ONE message for "doesn't exist" AND "isn't yours". The two cases must be indistinguishable (D-10).
const paymentNotFound = () => new AppError("NOT_FOUND", 404, "Payment not found.");

const IST = "+05:30"; // India has no daylight saving, so a fixed offset is safe
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // user text must never become regex syntax

// _id is a tie-breaker so rows with the same timestamp keep a stable order across pages
export const SORTS = {
  createdAt: { createdAt: 1, _id: 1 },
  "-createdAt": { createdAt: -1, _id: -1 },
  amount: { amount: 1, createdAt: -1, _id: -1 },
  "-amount": { amount: -1, createdAt: -1, _id: -1 },
};

async function getMyAccount(userId) {
  const account = await Account.findOne({ userId }).select("_id accountNumber").lean();
  if (!account) throw new AppError("NOT_FOUND", 404, "No account found for this user.");
  return account;
}

// ───────────── the filter builder ─────────────
function buildFilter(mine, f) {
  const and = [];

  // 1) scope: ONLY payments I'm part of
  if (f.direction === "sent") and.push({ fromAccountId: mine });
  else if (f.direction === "received") and.push({ toAccountId: mine });
  else and.push({ $or: [{ fromAccountId: mine }, { toAccountId: mine }] });

  if (f.type) and.push({ type: f.type });
  if (f.status) and.push({ status: f.status });

  // 2) dates are IST calendar days, inclusive on both ends
  if (f.from || f.to) {
    const range = {};
    if (f.from) range.$gte = new Date(`${f.from}T00:00:00.000${IST}`);
    if (f.to) range.$lte = new Date(`${f.to}T23:59:59.999${IST}`);
    and.push({ createdAt: range });
  }

  // 3) search: payment-ID prefix OR the COUNTERPARTY's name (never my own name)
  if (f.q) {
    const namePrefix = new RegExp(`(^|\\s)${escapeRegex(f.q)}`, "i"); // start of any word: "sharma" finds "Riya Sharma"
    and.push({
      $or: [
        // IDs are stored upper-case → a case-SENSITIVE prefix can use the paymentId index
        { paymentId: new RegExp(`^${escapeRegex(f.q.toUpperCase())}`) },
        { toAccountId: mine, fromNameSnapshot: namePrefix }, // I received → counterparty = sender
        { fromAccountId: mine, toNameSnapshot: namePrefix }, // I sent     → counterparty = recipient
      ],
    });
  }
  return { $and: and };
}

// ───────────── mapping rows → API shapes ─────────────
const isMine = (id, mine) => id && String(id) === String(mine);

function counterpartyOf(tx, mine, numberById) {
  if (tx.type !== "TRANSFER") return null; // deposits come from "Bytebank"; the UI labels them by type
  const received = isMine(tx.toAccountId, mine);
  const otherAccountId = received ? tx.fromAccountId : tx.toAccountId;
  const number = numberById.get(String(otherAccountId));
  return {
    name: received ? tx.fromNameSnapshot : tx.toNameSnapshot,
    maskedAccountNumber: number ? maskAccountNumber(number) : null,
  };
}

function toListItem(tx, mine, numberById) {
  return {
    paymentId: tx.paymentId,
    type: tx.type,
    direction: isMine(tx.toAccountId, mine) ? "received" : "sent",
    amountPaise: tx.amount,
    counterparty: counterpartyOf(tx, mine, numberById),
    status: tx.status,
    description: tx.description ?? null,
    createdAt: tx.createdAt,
  };
}

async function accountNumbers(ids) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (unique.length === 0) return new Map();
  const accounts = await Account.find({ _id: { $in: unique } }).select("accountNumber").lean();
  return new Map(accounts.map((a) => [String(a._id), a.accountNumber]));
}

// ───────────── public functions ─────────────
export async function listMyTransactions(userId, f) {
  const account = await getMyAccount(userId);
  const filter = buildFilter(account._id, f);

  const [total, rows] = await Promise.all([
    Transaction.countDocuments(filter),
    Transaction.find(filter)
      .sort(SORTS[f.sort])
      .skip((f.page - 1) * f.limit)
      .limit(f.limit)
      .lean(),
  ]);

  // masked numbers of the OTHER side: one extra query per PAGE, not one per row
  const numberById = await accountNumbers(rows.flatMap((tx) => [tx.fromAccountId, tx.toAccountId]));

  return {
    transactions: rows.map((tx) => toListItem(tx, account._id, numberById)),
    meta: { page: f.page, limit: f.limit, total, totalPages: Math.ceil(total / f.limit) },
  };
}

// Shared by detail + receipt: the authorization rule lives in ONE place
async function findMine(userId, paymentId) {
  const account = await getMyAccount(userId);
  const tx = await Transaction.findOne({ paymentId }).lean();
  const participant = tx && (isMine(tx.fromAccountId, account._id) || isMine(tx.toAccountId, account._id));
  if (!participant) throw paymentNotFound(); // missing OR someone else's → identical answer
  return { account, tx };
}

export async function getMyTransaction(userId, paymentId) {
  const { account, tx } = await findMine(userId, paymentId);
  const numberById = await accountNumbers([tx.fromAccountId, tx.toAccountId]);
  const received = isMine(tx.toAccountId, account._id);
  return {
    ...toListItem(tx, account._id, numberById),
    currency: tx.currency,
    reason: tx.reason ?? null,
    // MY balance after this payment only. The other person's balance is never exposed.
    balanceAfterPaise: received ? tx.receiverBalanceAfter : tx.senderBalanceAfter,
  };
}

export async function getReceipt(userId, paymentId) {
  const { tx } = await findMine(userId, paymentId);
  const numberById = await accountNumbers([tx.fromAccountId, tx.toAccountId]);
  const party = (name, accountId) => {
    const number = numberById.get(String(accountId));
    return { name, maskedAccountNumber: number ? maskAccountNumber(number) : null };
  };
  // Deliberately NO user ids, tokens or balances (PRD FR-07)
  return {
    paymentId: tx.paymentId,
    type: tx.type,
    status: tx.status,
    amountPaise: tx.amount,
    currency: tx.currency,
    sender: tx.fromAccountId ? party(tx.fromNameSnapshot, tx.fromAccountId) : null, // null for deposits
    recipient: party(tx.toNameSnapshot, tx.toAccountId),
    description: tx.description ?? null,
    createdAt: tx.createdAt,
    simulated: true,
  };
}
