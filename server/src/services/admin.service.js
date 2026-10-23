import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Account } from "../models/account.model.js";
import { Transaction } from "../models/transaction.model.js";
import { LedgerEntry } from "../models/ledgerEntry.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { AppError } from "../utils/AppError.js";
import { generatePaymentId, maskAccountNumber } from "../utils/ids.js";
import { MIN_ADMIN_DEPOSIT_PAISE, MAX_ADMIN_DEPOSIT_PAISE, formatRupees } from "../utils/money.js";
import { logger } from "../utils/logger.js";
import { sendPaymentReceived } from "./email.service.js";
import { toTransactionListItem } from "./account.service.js";
import { escapeRegex, SORTS } from "./transaction.service.js";

const IST = "+05:30";
const userNotFound = () => new AppError("NOT_FOUND", 404, "User not found.");
const invalidTarget = (message) => new AppError("INVALID_TARGET", 422, message);
const ineligible = () =>
  new AppError(
    "RECIPIENT_INELIGIBLE",
    422,
    "This customer can't receive a deposit right now (suspended or no active account)."
  );

const meta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });
const toAdminUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  status: u.status,
  createdAt: u.createdAt,
});
const istRange = (from, to) => {
  const range = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000${IST}`);
  if (to) range.$lte = new Date(`${to}T23:59:59.999${IST}`);
  return range;
};

// ───────────────────────── users ─────────────────────────
export async function listUsers({ q, status, page, limit }) {
  const filter = { role: "CUSTOMER" }; // this screen manages customers; admins aren't listed
  if (status) filter.status = status;
  if (q) {
    const namePrefix = new RegExp(`(^|\\s)${escapeRegex(q)}`, "i"); // start of any word in the name
    // emails are stored lower-case → a case-SENSITIVE anchored prefix can use the email index
    filter.$or = [{ name: namePrefix }, { email: new RegExp(`^${escapeRegex(q.toLowerCase())}`) }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name email status createdAt")
      .lean(),
  ]);

  const accounts = await Account.find({ userId: { $in: users.map((u) => u._id) } })
    .select("userId accountNumber")
    .lean();
  const numberByUser = new Map(accounts.map((a) => [String(a.userId), a.accountNumber]));

  return {
    users: users.map((u) => ({
      ...toAdminUser(u),
      accountNumberMasked: numberByUser.has(String(u._id)) ? maskAccountNumber(numberByUser.get(String(u._id))) : null,
    })),
    meta: meta(page, limit, total),
  };
}

export async function getUserDetail(id) {
  const user = await User.findOne({ _id: id, role: "CUSTOMER" })
    .select("name email status createdAt")
    .lean();
  if (!user) throw userNotFound();

  const account = await Account.findOne({ userId: user._id }).lean();
  const recent = account
    ? await Transaction.find({ $or: [{ fromAccountId: account._id }, { toAccountId: account._id }] })
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean()
    : [];

  return {
    user: toAdminUser(user),
    account: account && {
      accountNumberMasked: maskAccountNumber(account.accountNumber),
      balancePaise: account.balance,
      currency: account.currency,
      status: account.status,
      createdAt: account.createdAt,
    },
    // same shape as the customer's own list (Phase 2/4), seen from THIS customer's side
    recentTransactions: recent.map((tx) => toTransactionListItem(tx, account._id)),
  };
}

// user.status and account.status change TOGETHER, and the audit row is written in the same transaction
export async function setUserStatus(adminId, targetId, status, note, ctx = {}) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const target = await User.findById(targetId)
        .select("name email status role createdAt")
        .session(session)
        .lean();
      if (!target) throw userNotFound();
      // admins (including yourself) can't be suspended; this one rule covers both cases
      if (target.role !== "CUSTOMER") throw invalidTarget("Only customer accounts can be suspended or activated.");

      if (target.status === status) {
        // already there → harmless no-op, no audit row
        result = { user: toAdminUser(target), changed: false };
        return;
      }
      await User.updateOne({ _id: target._id }, { $set: { status } }, { session });
      // a customer without an account (legacy data) → this simply matches nothing
      await Account.updateOne(
        { userId: target._id },
        { $set: { status: status === "ACTIVE" ? "ACTIVE" : "FROZEN" } },
        { session }
      );
      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED",
            targetUserId: target._id,
            metadata: { note: note ?? null, previousStatus: target.status },
            ip: ctx.ip,
            requestId: ctx.requestId,
          },
        ],
        { session }
      );
      result = { user: toAdminUser({ ...target, status }), changed: true };
    });
  } finally {
    await session.endSession();
  }
  return result;
}

// ───────────────────────── deposits ─────────────────────────
export async function createDeposit(adminId, { userId, amountPaise, reason }, ctx = {}) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < MIN_ADMIN_DEPOSIT_PAISE || amountPaise > MAX_ADMIN_DEPOSIT_PAISE) {
    throw new AppError(
      "INVALID_AMOUNT",
      422,
      `A deposit must be between ${formatRupees(MIN_ADMIN_DEPOSIT_PAISE)} and ${formatRupees(MAX_ADMIN_DEPOSIT_PAISE)}.`,
      [{ field: "amount", issue: "out_of_range" }]
    );
  }

  const paymentId = generatePaymentId(); // OUTSIDE the callback: a retried attempt keeps the same id
  const session = await mongoose.startSession();
  let outcome;
  try {
    await session.withTransaction(async () => {
      // defense in depth: the middleware already checked, but money code never trusts "someone else did it"
      const admin = await User.findById(adminId).select("name role status").session(session).lean();
      if (!admin || admin.role !== "ADMIN" || admin.status !== "ACTIVE") {
        throw new AppError("FORBIDDEN", 403, "You don't have access to this resource.");
      }

      const target = await User.findById(userId)
        .select("name email role status")
        .session(session)
        .lean();
      if (!target) throw userNotFound();
      if (target.role !== "CUSTOMER") throw invalidTarget("Deposits can only go to customer accounts.");
      if (target.status !== "ACTIVE") throw ineligible();

      const account = await Account.findOne({ userId: target._id }).select("_id status").session(session).lean();
      if (!account || account.status !== "ACTIVE") throw ineligible();

      // atomic credit; matches only while the account is still ACTIVE
      const credited = await Account.findOneAndUpdate(
        { _id: account._id, status: "ACTIVE" },
        { $inc: { balance: amountPaise } },
        { new: true, session }
      );
      if (!credited) throw ineligible();

      const [tx] = await Transaction.create(
        [
          {
            paymentId,
            type: "ADMIN_DEPOSIT",
            amount: amountPaise,
            fromAccountId: null,
            fromUserId: null, // new money: nobody is debited
            toAccountId: account._id,
            toUserId: target._id,
            fromNameSnapshot: "Bytebank",
            toNameSnapshot: target.name,
            reason,
            createdByAdminId: admin._id,
            receiverBalanceAfter: credited.balance,
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
            type: "ADMIN_DEPOSIT",
            direction: "CREDIT",
            amount: amountPaise,
            balanceAfter: credited.balance,
          },
        ],
        { session }
      );

      // If THIS fails, the whole deposit rolls back: no audit trail → no money
      await AuditLog.create(
        [
          {
            actorId: admin._id,
            action: "ADMIN_DEPOSIT",
            targetUserId: target._id,
            metadata: { paymentId, amountPaise, reason },
            ip: ctx.ip,
            requestId: ctx.requestId,
          },
        ],
        { session }
      );

      outcome = { tx, target, admin };
    });
  } finally {
    await session.endSession();
  }

  // AFTER commit, fire-and-forget (same rule as transfers)
  void (async () => {
    try {
      await sendPaymentReceived(outcome.target, { amountPaise, fromName: "Bytebank", paymentId });
    } catch (err) {
      logger.error({ err, paymentId }, "Failed to send deposit email");
    }
  })();

  return {
    deposit: {
      paymentId,
      amountPaise,
      reason,
      target: { id: String(outcome.target._id), name: outcome.target.name },
      admin: { name: outcome.admin.name },
      createdAt: outcome.tx.createdAt,
    },
  };
}

export async function listDeposits({ userId, page, limit }) {
  const filter = { type: "ADMIN_DEPOSIT" };
  if (userId) filter.toUserId = userId;

  const [total, rows] = await Promise.all([
    Transaction.countDocuments(filter),
    Transaction.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const adminIds = [...new Set(rows.map((r) => String(r.createdByAdminId)).filter((id) => id !== "null"))];
  const admins = await User.find({ _id: { $in: adminIds } }).select("name").lean();
  const adminName = new Map(admins.map((a) => [String(a._id), a.name]));

  return {
    deposits: rows.map((tx) => ({
      paymentId: tx.paymentId,
      amountPaise: tx.amount,
      reason: tx.reason ?? null,
      customer: { id: String(tx.toUserId), name: tx.toNameSnapshot },
      admin: { name: adminName.get(String(tx.createdByAdminId)) ?? "Unknown" },
      createdAt: tx.createdAt,
    })),
    meta: meta(page, limit, total),
  };
}

// ───────────────────────── all transactions ─────────────────────────
export async function listAdminTransactions(f) {
  const and = [];
  if (f.type) and.push({ type: f.type });
  if (f.status) and.push({ status: f.status });
  if (f.from || f.to) and.push({ createdAt: istRange(f.from, f.to) });

  if (f.userId) {
    // Resolve the user to their ACCOUNT first, so the query uses the account+date indexes from Phase 2.
    // (There is no index on fromUserId/toUserId, and we don't need to add one.)
    const account = await Account.findOne({ userId: f.userId }).select("_id").lean();
    if (!account) return { transactions: [], meta: meta(f.page, f.limit, 0) };
    and.push({ $or: [{ fromAccountId: account._id }, { toAccountId: account._id }] });
  }
  if (f.q) {
    const namePrefix = new RegExp(`(^|\\s)${escapeRegex(f.q)}`, "i");
    and.push({
      $or: [
        { paymentId: new RegExp(`^${escapeRegex(f.q.toUpperCase())}`) }, // upper-cased → index-friendly
        { fromNameSnapshot: namePrefix },
        { toNameSnapshot: namePrefix },
      ],
    });
  }
  const filter = and.length ? { $and: and } : {};

  const [total, rows] = await Promise.all([
    Transaction.countDocuments(filter),
    Transaction.find(filter)
      .sort(SORTS[f.sort])
      .skip((f.page - 1) * f.limit)
      .limit(f.limit)
      .lean(),
  ]);

  return {
    transactions: rows.map((tx) => ({
      paymentId: tx.paymentId,
      type: tx.type,
      status: tx.status,
      amountPaise: tx.amount,
      currency: tx.currency,
      sender: tx.fromAccountId ? { name: tx.fromNameSnapshot } : null, // null → money came from the bank itself
      recipient: { name: tx.toNameSnapshot },
      description: tx.description ?? null,
      reason: tx.reason ?? null,
      createdAt: tx.createdAt,
    })),
    meta: meta(f.page, f.limit, total),
  };
}

// ───────────────────────── overview ─────────────────────────
export async function getOverview() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [customers, active, suspended, balanceRows, transactions24h, depositRows] = await Promise.all([
    User.countDocuments({ role: "CUSTOMER" }),
    User.countDocuments({ role: "CUSTOMER", status: "ACTIVE" }),
    User.countDocuments({ role: "CUSTOMER", status: "SUSPENDED" }),
    Account.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
    Transaction.countDocuments({ createdAt: { $gte: since } }),
    Transaction.aggregate([{ $match: { type: "ADMIN_DEPOSIT" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);
  return {
    customers,
    active,
    suspended,
    totalBalancePaise: balanceRows[0]?.total ?? 0,
    transactions24h,
    totalAdminDepositsPaise: depositRows[0]?.total ?? 0,
  };
}
