import mongoose from "mongoose";
import { Account } from "../models/account.model.js";
import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import { LedgerEntry } from "../models/ledgerEntry.model.js";
import { IdempotencyKey } from "../models/idempotencyKey.model.js";
import { AppError } from "../utils/AppError.js";
import { generatePaymentId, maskAccountNumber } from "../utils/ids.js";
import { MIN_TRANSFER_PAISE, MAX_TRANSFER_PAISE, formatRupees } from "../utils/money.js";
import { hashToken as sha256 } from "../utils/tokens.js"; // it's just sha256-hex of any string
import { logger } from "../utils/logger.js";
import { sendPaymentReceived } from "./email.service.js";

const ineligible = () =>
  new AppError("RECIPIENT_INELIGIBLE", 422, "This person can't receive money right now.");

function assertAmountAllowed(amountPaise) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < MIN_TRANSFER_PAISE || amountPaise > MAX_TRANSFER_PAISE) {
    throw new AppError(
      "INVALID_AMOUNT",
      422,
      `Amount must be between ${formatRupees(MIN_TRANSFER_PAISE)} and ${formatRupees(MAX_TRANSFER_PAISE)}.`,
      [{ field: "amount", issue: "out_of_range" }]
    );
  }
}

// One response shape for BOTH a fresh payment and a replay
function toResult(tx, recipientAccountNumber, replayed) {
  return {
    replayed,
    newBalancePaise: tx.senderBalanceAfter,
    payment: {
      paymentId: tx.paymentId,
      type: tx.type,
      amountPaise: tx.amount,
      currency: tx.currency,
      description: tx.description ?? null,
      createdAt: tx.createdAt,
      recipient: { name: tx.toNameSnapshot, maskedAccountNumber: maskAccountNumber(recipientAccountNumber) },
    },
  };
}

// "I've seen this key before": same payload → return the ORIGINAL payment; different → conflict
async function replayFrom(existing, requestHash) {
  if (existing.requestHash !== requestHash) {
    throw new AppError("IDEMPOTENCY_CONFLICT", 409, "This Idempotency-Key was already used for a different payment.");
  }
  const tx = await Transaction.findOne({ paymentId: existing.paymentId }).lean();
  const acc = await Account.findById(tx.toAccountId).select("accountNumber").lean();
  return toResult(tx, acc.accountNumber, true);
}

export async function createTransfer({ senderUserId, idempotencyKey, recipientAccountId, amountPaise, description }) {
  assertAmountAllowed(amountPaise);

  // ── 1. Idempotency fast path (outside the transaction) ──
  const requestHash = sha256(
    JSON.stringify({
      recipientAccountId: String(recipientAccountId),
      amountPaise,
      description: description ?? "",
    })
  );
  const existing = await IdempotencyKey.findOne({ userId: senderUserId, key: idempotencyKey }).lean();
  if (existing) return replayFrom(existing, requestHash);

  // Generated OUTSIDE the callback: Mongo may re-run the callback on a transient conflict,
  // and a retried attempt must keep the SAME payment id.
  const paymentId = generatePaymentId();

  const session = await mongoose.startSession();
  let outcome;
  try {
    // ── 2. ONE transaction: everything below commits together or not at all ──
    await session.withTransaction(async () => {
      // Defense in depth: don't trust that middleware ran a millisecond ago
      const sender = await User.findById(senderUserId).select("name status").session(session);
      if (!sender) throw new AppError("UNAUTHENTICATED", 401, "Please log in.");
      if (sender.status !== "ACTIVE") throw new AppError("ACCOUNT_SUSPENDED", 403, "This account is suspended.");

      const senderAcc = await Account.findOne({ userId: sender._id }).session(session);
      if (!senderAcc) throw new AppError("NOT_FOUND", 404, "No account found for this user.");

      // a. recipient must exist, be an ACTIVE customer with an ACTIVE account
      const recipientAcc = await Account.findById(recipientAccountId).session(session);
      if (!recipientAcc) throw ineligible();
      // b. no paying yourself
      if (String(recipientAcc.userId) === String(sender._id)) {
        throw new AppError("SELF_TRANSFER", 422, "You can't send money to yourself.");
      }
      const recipientUser = await User.findById(recipientAcc.userId)
        .select("name email role status")
        .session(session);
      if (
        !recipientUser ||
        recipientUser.role !== "CUSTOMER" ||
        recipientUser.status !== "ACTIVE" ||
        recipientAcc.status !== "ACTIVE"
      ) {
        throw ineligible();
      }

      // c. ⭐ atomic check-and-debit: if balance < amount NOTHING matches → null
      const debited = await Account.findOneAndUpdate(
        { _id: senderAcc._id, status: "ACTIVE", balance: { $gte: amountPaise } },
        { $inc: { balance: -amountPaise } },
        { new: true, session }
      );
      if (!debited) {
        const fresh = await Account.findById(senderAcc._id).session(session);
        if (fresh.status !== "ACTIVE") throw new AppError("ACCOUNT_SUSPENDED", 403, "This account is suspended.");
        throw new AppError(
          "INSUFFICIENT_FUNDS",
          422,
          `You have ${formatRupees(fresh.balance)} available.`,
          [{ field: "amount", issue: "exceeds_balance" }]
        );
      }

      // d. credit. A null here throws → the transaction aborts → the debit is undone too
      const credited = await Account.findOneAndUpdate(
        { _id: recipientAcc._id, status: "ACTIVE" },
        { $inc: { balance: amountPaise } },
        { new: true, session }
      );
      if (!credited) throw ineligible();

      // e. the payment record (one document = one logical payment)
      const [tx] = await Transaction.create(
        [
          {
            paymentId,
            type: "TRANSFER",
            amount: amountPaise,
            fromAccountId: senderAcc._id,
            fromUserId: sender._id,
            toAccountId: recipientAcc._id,
            toUserId: recipientUser._id,
            fromNameSnapshot: sender.name,
            toNameSnapshot: recipientUser.name, // D-16
            description,
            senderBalanceAfter: debited.balance,
            receiverBalanceAfter: credited.balance,
            idempotencyKey,
          },
        ],
        { session }
      );

      // f. the ledger: one DEBIT + one CREDIT (`ordered` keeps them in sequence inside a transaction)
      await LedgerEntry.create(
        [
          {
            transactionId: tx._id,
            paymentId,
            accountId: senderAcc._id,
            type: "TRANSFER",
            direction: "DEBIT",
            amount: amountPaise,
            balanceAfter: debited.balance,
          },
          {
            transactionId: tx._id,
            paymentId,
            accountId: recipientAcc._id,
            type: "TRANSFER",
            direction: "CREDIT",
            amount: amountPaise,
            balanceAfter: credited.balance,
          },
        ],
        { session, ordered: true }
      );

      // g. remember the key. The UNIQUE index makes a second commit with this key impossible.
      await IdempotencyKey.create([{ userId: sender._id, key: idempotencyKey, requestHash, paymentId }], { session });

      outcome = { tx, recipientAccountNumber: recipientAcc.accountNumber, recipientUser, senderName: sender.name };
    });
  } catch (err) {
    // Two requests with the SAME key raced past step 1. Whoever commits second hits the
    // unique index (E11000), its transaction rolls back, and we answer with the winner's payment.
    if (err?.code === 11000) {
      const winner = await IdempotencyKey.findOne({ userId: senderUserId, key: idempotencyKey }).lean();
      if (winner) return replayFrom(winner, requestHash);
    }
    throw err;
  } finally {
    await session.endSession();
  }

  // ── 3. AFTER commit: email. Fire-and-forget; a mail failure must never fail a committed payment ──
  void (async () => {
    try {
      await sendPaymentReceived(outcome.recipientUser, {
        amountPaise,
        fromName: outcome.senderName,
        paymentId,
      });
    } catch (err) {
      logger.error({ err, paymentId }, "Failed to send payment-received email");
    }
  })();

  return toResult(outcome.tx, outcome.recipientAccountNumber, false);
}
