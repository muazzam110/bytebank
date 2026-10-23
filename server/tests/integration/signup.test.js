import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.model.js";
import { Account } from "../../src/models/account.model.js";
import { Transaction } from "../../src/models/transaction.model.js";
import { LedgerEntry } from "../../src/models/ledgerEntry.model.js";
import { generatePaymentId } from "../../src/utils/ids.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

beforeAll(startTestDB, 120_000);
afterAll(stopTestDB);
beforeEach(clearDB);

const signup = (body) => request(app).post("/api/v1/auth/signup").send(body);
const valid = { name: "Riya Sharma", email: "riya@example.com", password: "Str0ngPass123" };

describe("signup → login (no email verification)", () => {
  it("signup creates the user, the account, ONE welcome deposit and ONE ledger line", async () => {
    const res = await signup(valid);
    expect(res.status).toBe(201);
    expect(res.headers["set-cookie"]).toBeUndefined(); // signing up does not log you in

    const user = await User.findOne({ email: valid.email });
    expect(user).toMatchObject({ name: "Riya Sharma", role: "CUSTOMER", status: "ACTIVE" });
    const account = await Account.findOne({ userId: user._id });
    expect(account.balance).toBe(1000000); // ₹10,000.00 in paise
    expect(account.accountNumber).toMatch(/^\d{12}$/);
    expect(await Transaction.countDocuments({ type: "INITIAL_DEPOSIT" })).toBe(1);
    expect(await LedgerEntry.countDocuments()).toBe(1);
  });

  it("you can log in right away with the same email and password", async () => {
    await signup(valid);
    const res = await request(app).post("/api/v1/auth/login").send({ email: valid.email, password: valid.password });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: "Riya Sharma", email: valid.email, role: "CUSTOMER" });
    expect(res.headers["set-cookie"].join(";")).toMatch(/HttpOnly/i);

    const cookie = res.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ");
    const account = await request(app).get("/api/v1/account").set("Cookie", cookie);
    expect(account.status).toBe(200);
    expect(account.body.data.account.balancePaise).toBe(1000000);
  });

  it("wrong password → 401 with the same message as an unknown email", async () => {
    await signup(valid);
    const wrong = await request(app).post("/api/v1/auth/login").send({ email: valid.email, password: "WrongPass123" });
    const unknown = await request(app).post("/api/v1/auth/login").send({ email: "nobody@example.com", password: "WrongPass123" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it("the same email twice → 409 EMAIL_TAKEN and still only one account", async () => {
    expect((await signup(valid)).status).toBe(201);
    const again = await signup(valid);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("EMAIL_TAKEN");
    expect(await User.countDocuments()).toBe(1);
    expect(await Account.countDocuments()).toBe(1);
  });

  it("5 PARALLEL signups with one email → exactly one winner, one account, one deposit", async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => signup(valid)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    results.filter((r) => r.status !== 201).forEach((r) => expect(r.status).toBe(409));
    expect(await User.countDocuments()).toBe(1);
    expect(await Account.countDocuments()).toBe(1);
    expect(await Transaction.countDocuments({ type: "INITIAL_DEPOSIT" })).toBe(1);
    expect((await Account.findOne()).balance).toBe(1000000);
  }, 60_000);

  it("validation: bad email / short password / extra fields (e.g. role) → 400 and nothing is created", async () => {
    for (const body of [
      { ...valid, email: "nope" },
      { ...valid, password: "short1" },
      { ...valid, name: "R" },
      { ...valid, role: "ADMIN" },
    ]) {
      const res = await signup(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
    expect(await User.countDocuments()).toBe(0);
  });

  it("the old verification endpoints no longer exist", async () => {
    expect((await request(app).post("/api/v1/auth/verify-email").send({ token: "x" })).status).toBe(404);
    expect((await request(app).post("/api/v1/auth/resend-verification").send({ email: valid.email })).status).toBe(404);
  });

  it("the database itself blocks a 2nd INITIAL_DEPOSIT for one account (partial unique index)", async () => {
    const base = {
      type: "INITIAL_DEPOSIT",
      amount: 1000000,
      toAccountId: new mongoose.Types.ObjectId(),
      toUserId: new mongoose.Types.ObjectId(),
    };
    await Transaction.create({ ...base, paymentId: generatePaymentId() });
    await expect(Transaction.create({ ...base, paymentId: generatePaymentId() })).rejects.toMatchObject({ code: 11000 });
    // …but other types to the same account are allowed: the index is PARTIAL
    await expect(Transaction.create({ ...base, type: "ADMIN_DEPOSIT", paymentId: generatePaymentId() })).resolves.toBeDefined();
  });
});
