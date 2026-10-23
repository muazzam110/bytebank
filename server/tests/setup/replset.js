import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { User } from "../../src/models/user.model.js";
import { Token } from "../../src/models/token.model.js";
import { Account } from "../../src/models/account.model.js";
import { Transaction } from "../../src/models/transaction.model.js";
import { LedgerEntry } from "../../src/models/ledgerEntry.model.js";
import { IdempotencyKey } from "../../src/models/idempotencyKey.model.js";
import { AuditLog } from "../../src/models/auditLog.model.js";

let replSet;

export async function startTestDB() {
  // Transactions need a replica set, so a plain in-memory mongod would not work
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri("bytebank-test"));
  // Build indexes NOW, otherwise the partial unique index might not exist yet when tests run
  await Promise.all([User, Token, Account, Transaction, LedgerEntry, IdempotencyKey, AuditLog].map((m) => m.init()));
}

export async function clearDB() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({}))); // keeps the indexes
}

export async function stopTestDB() {
  await mongoose.disconnect();
  await replSet.stop();
}
