import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import request from "supertest";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, makeAdmin, cookieFor, balanceOf } from "../setup/factories.js";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.model.js";
import { Transaction } from "../../src/models/transaction.model.js";
import { LedgerEntry } from "../../src/models/ledgerEntry.model.js";
import { sendPaymentReceived } from "../../src/services/email.service.js";

// Silence real emails and let us assert on them
vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

let A, B;
beforeAll(startTestDB);
afterAll(stopTestDB);
beforeEach(async () => {
  await clearDB();
  vi.clearAllMocks();
  A = await makeCustomer("Riya Sharma", "riya@example.com");
  B = await makeCustomer("Aarav Mehta", "aarav@example.com");
});

const send = (cookie, body, key = crypto.randomUUID()) =>
  request(app).post("/api/v1/transfers").set("Cookie", cookie).set("Idempotency-Key", key).send(body);
const toB = (amount, extra = {}) => ({ recipient: { accountId: String(B.account._id) }, amount, ...extra });

describe("POST /transfers", () => {
  it("moves the exact paise, writes 1 transaction + 2 ledger entries, emails once", async () => {
    const res = await send(cookieFor(A.user), toB("500.00", { description: "Lunch" }));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ replayed: false, newBalancePaise: 950000 });
    expect(res.body.data.payment).toMatchObject({
      type: "TRANSFER",
      amountPaise: 50000,
      description: "Lunch",
      recipient: { name: "Aarav Mehta" },
    });
    const { paymentId } = res.body.data.payment;
    expect(paymentId).toMatch(/^PAY-[0-9A-HJKMNP-TV-Z]{10}$/);

    expect(await balanceOf(A.account._id)).toBe(950000);
    expect(await balanceOf(B.account._id)).toBe(1050000);
    expect(await Transaction.countDocuments({ type: "TRANSFER" })).toBe(1);
    const entries = await LedgerEntry.find({ paymentId }).sort({ _id: 1 });
    expect(entries.map((e) => e.direction)).toEqual(["DEBIT", "CREDIT"]);
    expect(sendPaymentReceived).toHaveBeenCalledTimes(1);
  });

  it("insufficient funds → 422 and NOTHING changes", async () => {
    const res = await send(cookieFor(A.user), toB("20000.00")); // she has ₹10,000
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("INSUFFICIENT_FUNDS");
    expect(res.body.error.message).toBe("You have ₹10,000.00 available.");
    expect(await balanceOf(A.account._id)).toBe(1000000);
    expect(await balanceOf(B.account._id)).toBe(1000000);
    expect(await Transaction.countDocuments({ type: "TRANSFER" })).toBe(0);
    expect(await LedgerEntry.countDocuments()).toBe(2); // only the two welcome deposits
  });

  it("rejects paying yourself", async () => {
    const res = await send(cookieFor(A.user), { recipient: { accountId: String(A.account._id) }, amount: "10" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("SELF_TRANSFER");
  });

  it("rejects a suspended recipient", async () => {
    await User.updateOne({ _id: B.user._id }, { status: "SUSPENDED" });
    const res = await send(cookieFor(A.user), toB("10"));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("RECIPIENT_INELIGIBLE");
    expect(await balanceOf(A.account._id)).toBe(1000000);
  });

  it.each(["-5", "1.234", "1e3", "abc"])("rejects amount %j with 400", async (amount) => {
    const res = await send(cookieFor(A.user), toB(amount));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a NUMBER amount, zero, below the minimum and above the maximum", async () => {
    expect((await send(cookieFor(A.user), toB(500))).status).toBe(400);
    for (const amount of ["0", "0.00", "0.50", "60000.00"]) {
      const res = await send(cookieFor(A.user), toB(amount));
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INVALID_AMOUNT");
    }
  });

  it("requires an Idempotency-Key header", async () => {
    const res = await request(app).post("/api/v1/transfers").set("Cookie", cookieFor(A.user)).send(toB("10"));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("401 without a cookie, 403 for an admin", async () => {
    expect((await send("", toB("10"))).status).toBe(401);
    const admin = await makeAdmin();
    const res = await send(cookieFor(admin), toB("10"));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /recipients/search", () => {
  const search = (q) => request(app).get("/api/v1/recipients/search").query({ q }).set("Cookie", cookieFor(A.user));

  it("returns only masked data, never yourself, never an email", async () => {
    const res = await search("aar");
    expect(res.status).toBe(200);
    expect(res.body.data.recipients).toEqual([
      { accountId: String(B.account._id), name: "Aarav Mehta", maskedAccountNumber: expect.stringMatching(/^•••• \d{4}$/) },
    ]);
    expect(JSON.stringify(res.body)).not.toContain("example.com");
    expect((await search("riy")).body.data.recipients).toEqual([]); // she is excluded
  });

  it("needs at least 3 characters", async () => {
    expect((await search("aa")).status).toBe(400);
  });
});
