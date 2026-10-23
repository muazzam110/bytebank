import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, makeAdmin, cookieFor, balanceOf } from "../setup/factories.js";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.model.js";
import { Account } from "../../src/models/account.model.js";
import { Transaction } from "../../src/models/transaction.model.js";
import { LedgerEntry } from "../../src/models/ledgerEntry.model.js";
import { AuditLog } from "../../src/models/auditLog.model.js";
import { runReconciliation } from "../../src/services/reconcile.service.js";
import { sendPaymentReceived } from "../../src/services/email.service.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

let admin, A, B;
beforeAll(startTestDB, 120_000);
afterAll(stopTestDB);
beforeEach(async () => {
  await clearDB();
  vi.clearAllMocks();
  admin = await makeAdmin();
  A = await makeCustomer("Riya Sharma", "riya@example.com");
  B = await makeCustomer("Aarav Mehta", "aarav@example.com");
});
afterEach(() => vi.restoreAllMocks());

const asAdmin = (method, path, body) => {
  const req = request(app)[method](`/api/v1/admin${path}`).set("Cookie", cookieFor(admin));
  return body ? req.send(body) : req;
};
const deposit = (extra = {}) =>
  asAdmin("post", "/deposits", { userId: String(A.user._id), amount: "2500.00", reason: "Welcome bonus", ...extra });

describe("POST /admin/deposits", () => {
  it("credits exactly once and leaves a full paper trail", async () => {
    const res = await deposit();
    expect(res.status).toBe(201);
    const { deposit: d } = res.body.data;
    expect(d).toMatchObject({
      amountPaise: 250000,
      reason: "Welcome bonus",
      target: { name: "Riya Sharma" },
      admin: { name: "Admin" },
    });
    expect(d.paymentId).toMatch(/^PAY-[0-9A-HJKMNP-TV-Z]{10}$/);

    expect(await balanceOf(A.account._id)).toBe(1250000);
    expect(await balanceOf(B.account._id)).toBe(1000000); // nobody else changed

    const tx = await Transaction.findOne({ paymentId: d.paymentId });
    expect(tx).toMatchObject({ type: "ADMIN_DEPOSIT", reason: "Welcome bonus", fromAccountId: null, amount: 250000 });
    expect(String(tx.createdByAdminId)).toBe(String(admin._id));

    const lines = await LedgerEntry.find({ paymentId: d.paymentId });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ direction: "CREDIT", balanceAfter: 1250000, type: "ADMIN_DEPOSIT" });

    const audit = await AuditLog.find({ action: "ADMIN_DEPOSIT" });
    expect(audit).toHaveLength(1);
    expect(String(audit[0].targetUserId)).toBe(String(A.user._id));
    expect(audit[0].requestId).toBeTruthy();
    expect(audit[0].metadata).toMatchObject({ paymentId: d.paymentId, amountPaise: 250000, reason: "Welcome bonus" });

    expect(sendPaymentReceived).toHaveBeenCalledTimes(1);
    const [toUser, info] = sendPaymentReceived.mock.calls[0];
    expect(toUser.email).toBe("riya@example.com");
    expect(info).toMatchObject({ amountPaise: 250000, fromName: "Bytebank", paymentId: d.paymentId });
  });

  it("reconcile still passes (the deposit is counted on BOTH sides of the equation)", async () => {
    await deposit();
    const report = await runReconciliation();
    expect(report.ok).toBe(true);
    expect(report.stats.totalBalancePaise).toBe(2250000);
  });

  it("validation: reason required, strict body, bad and out-of-range amounts", async () => {
    const bad400 = [{ reason: undefined }, { reason: "ab" }, { amount: "abc" }, { amount: 2500 }, { extra: "x" }, { userId: "nope" }];
    for (const patch of bad400) {
      const res = await deposit(patch);
      expect(res.status, JSON.stringify(patch)).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
    for (const amount of ["0", "0.50", "100000.01"]) {
      // 0 / below ₹1 / above the ₹1,00,000 max
      const res = await deposit({ amount });
      expect(res.status, amount).toBe(422);
      expect(res.body.error.code).toBe("INVALID_AMOUNT");
    }
    expect(await balanceOf(A.account._id)).toBe(1000000); // nothing moved
    expect((await deposit({ amount: "100000.00" })).status).toBe(201); // exactly the maximum is allowed
  });

  it("targets: suspended / no account / frozen → RECIPIENT_INELIGIBLE, admin → INVALID_TARGET, unknown → 404", async () => {
    await User.updateOne({ _id: A.user._id }, { status: "SUSPENDED" });
    expect((await deposit()).body.error.code).toBe("RECIPIENT_INELIGIBLE");
    await User.updateOne({ _id: A.user._id }, { status: "ACTIVE" });

    await Account.updateOne({ _id: A.account._id }, { status: "FROZEN" });
    expect((await deposit()).body.error.code).toBe("RECIPIENT_INELIGIBLE");
    await Account.updateOne({ _id: A.account._id }, { status: "ACTIVE" });

    const ghost = await User.create({ name: "Ghost User", email: "ghost@example.com", passwordHash: "x" }); // no account
    const noAccount = await deposit({ userId: String(ghost._id) });
    expect(noAccount.status).toBe(422);
    expect(noAccount.body.error.code).toBe("RECIPIENT_INELIGIBLE");

    const toAdmin = await deposit({ userId: String(admin._id) });
    expect(toAdmin.status).toBe(422);
    expect(toAdmin.body.error.code).toBe("INVALID_TARGET");

    const unknown = await deposit({ userId: String(new mongoose.Types.ObjectId()) });
    expect(unknown.status).toBe(404);
    expect(await Transaction.countDocuments({ type: "ADMIN_DEPOSIT" })).toBe(0);
  });

  it("ROLLBACK: if the audit row can't be written, the money does not move", async () => {
    vi.spyOn(AuditLog, "create").mockRejectedValueOnce(new Error("injected failure"));
    const res = await deposit();
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(await balanceOf(A.account._id)).toBe(1000000);
    expect(await Transaction.countDocuments({ type: "ADMIN_DEPOSIT" })).toBe(0);
    expect(await LedgerEntry.countDocuments()).toBe(2); // only the two welcome deposits
    expect(await AuditLog.countDocuments()).toBe(0);
    expect(sendPaymentReceived).not.toHaveBeenCalled();
  });

  it("a customer cannot create money", async () => {
    const res = await request(app)
      .post("/api/v1/admin/deposits")
      .set("Cookie", cookieFor(B.user))
      .send({ userId: String(B.user._id), amount: "99999.00", reason: "self-service" });
    expect(res.status).toBe(403);
    expect(await balanceOf(B.account._id)).toBe(1000000);
  });
});

describe("PATCH /admin/users/:id/status", () => {
  const setStatus = (id, body) => asAdmin("patch", `/users/${id}/status`, body);

  it("suspend: user + account change together, old session dies, transfers in/out are blocked, then reactivate", async () => {
    const oldCookie = cookieFor(A.user); // a session that exists BEFORE the suspension
    expect((await request(app).get("/api/v1/auth/me").set("Cookie", oldCookie)).status).toBe(200);

    const res = await setStatus(A.user._id, { status: "SUSPENDED", note: "Test" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe("SUSPENDED");
    expect((await User.findById(A.user._id)).status).toBe("SUSPENDED");
    expect((await Account.findById(A.account._id)).status).toBe("FROZEN");
    const audit = await AuditLog.findOne({ action: "USER_SUSPENDED" });
    expect(audit.metadata).toMatchObject({ note: "Test", previousStatus: "ACTIVE" });

    // the SAME cookie now fails, with no waiting for expiry
    const me = await request(app).get("/api/v1/auth/me").set("Cookie", oldCookie);
    expect(me.status).toBe(403);
    expect(me.body.error.code).toBe("ACCOUNT_SUSPENDED");

    // B → A is refused; A → B is refused
    const pay = (cookie, toAccount) =>
      request(app)
        .post("/api/v1/transfers")
        .set("Cookie", cookie)
        .set("Idempotency-Key", crypto.randomUUID())
        .send({ recipient: { accountId: String(toAccount) }, amount: "10" });
    const toSuspended = await pay(cookieFor(B.user), A.account._id);
    expect(toSuspended.status).toBe(422);
    expect(toSuspended.body.error.code).toBe("RECIPIENT_INELIGIBLE");
    expect((await pay(oldCookie, B.account._id)).status).toBe(403);
    expect((await deposit()).status).toBe(422);

    // reactivate → the SAME old cookie works again (tokenVersion never changed)
    expect((await setStatus(A.user._id, { status: "ACTIVE" })).status).toBe(200);
    expect((await Account.findById(A.account._id)).status).toBe("ACTIVE");
    expect((await request(app).get("/api/v1/auth/me").set("Cookie", oldCookie)).status).toBe(200);
    expect(await AuditLog.countDocuments({ action: "USER_ACTIVATED" })).toBe(1);
  });

  it("same status again is a harmless no-op (no extra audit row)", async () => {
    expect((await setStatus(A.user._id, { status: "ACTIVE" })).status).toBe(200);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it("admins (incl. yourself) → INVALID_TARGET; unknown → 404; bad id / extra field → 400", async () => {
    const self = await setStatus(admin._id, { status: "SUSPENDED" });
    expect(self.status).toBe(422);
    expect(self.body.error.code).toBe("INVALID_TARGET");
    const other = await makeAdmin("admin2@example.com");
    expect((await setStatus(other._id, { status: "SUSPENDED" })).body.error.code).toBe("INVALID_TARGET");
    expect((await setStatus(new mongoose.Types.ObjectId(), { status: "SUSPENDED" })).status).toBe(404);
    expect((await setStatus("not-an-id", { status: "SUSPENDED" })).status).toBe(400);
    expect((await setStatus(A.user._id, { status: "SUSPENDED", role: "ADMIN" })).status).toBe(400);
    expect((await User.findById(admin._id)).status).toBe("ACTIVE");
  });
});

describe("admin reads", () => {
  it("users, deposits, transactions and overview", async () => {
    await deposit();

    const users = await asAdmin("get", "/users?q=riy");
    expect(users.status).toBe(200);
    expect(users.body.data.users).toHaveLength(1);
    expect(users.body.data.users[0]).toMatchObject({
      name: "Riya Sharma",
      accountNumberMasked: expect.stringMatching(/^•••• \d{4}$/),
    });
    expect(JSON.stringify(users.body)).not.toContain("passwordHash");
    expect((await asAdmin("get", "/users?q=admin")).body.data.users).toHaveLength(0); // admins aren't listed

    const list = await asAdmin("get", "/deposits");
    expect(list.body.data.deposits[0]).toMatchObject({
      amountPaise: 250000,
      reason: "Welcome bonus",
      customer: { name: "Riya Sharma" },
      admin: { name: "Admin" },
    });
    expect(list.body.meta.total).toBe(1);

    const filtered = await asAdmin("get", `/transactions?type=ADMIN_DEPOSIT&userId=${A.user._id}`);
    expect(filtered.body.meta.total).toBe(1);
    expect(filtered.body.data.transactions[0]).toMatchObject({
      sender: null,
      recipient: { name: "Riya Sharma" },
      reason: "Welcome bonus",
    });
    expect((await asAdmin("get", `/transactions?userId=${B.user._id}&type=ADMIN_DEPOSIT`)).body.meta.total).toBe(0);

    const overview = await asAdmin("get", "/overview");
    expect(overview.body.data).toEqual({
      customers: 2,
      active: 2,
      suspended: 0,
      totalBalancePaise: 2250000,
      transactions24h: 3,
      totalAdminDepositsPaise: 250000,
    });

    const detail = await asAdmin("get", `/users/${A.user._id}`);
    expect(detail.body.data.account).toMatchObject({ balancePaise: 1250000, status: "ACTIVE" });
    expect(detail.body.data.recentTransactions).toHaveLength(2);
    expect((await asAdmin("get", `/users/${admin._id}`)).status).toBe(404);
  });
});
