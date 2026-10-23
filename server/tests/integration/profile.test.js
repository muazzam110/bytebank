import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import request from "supertest";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, makeAdmin, cookieFor, balanceOf } from "../setup/factories.js";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.model.js";
import { createTransfer } from "../../src/services/transfer.service.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

let A, B;
beforeAll(startTestDB, 120_000);
afterAll(stopTestDB);
beforeEach(async () => {
  await clearDB();
  A = await makeCustomer("Riya Sharma", "riya@example.com");
  B = await makeCustomer("Aarav Mehta", "aarav@example.com");
});

const patch = (cookie, body) => request(app).patch("/api/v1/profile").set("Cookie", cookie).send(body);

describe("/profile", () => {
  it("GET returns my profile and never the password hash", async () => {
    const res = await request(app).get("/api/v1/profile").set("Cookie", cookieFor(A.user));
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: "Riya Sharma", email: "riya@example.com", role: "CUSTOMER" });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("PATCH updates (and trims) the name", async () => {
    const res = await patch(cookieFor(A.user), { name: "  Riya S.  " });
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe("Riya S.");
    expect((await User.findById(A.user._id)).name).toBe("Riya S.");
  });

  it("forbidden or invalid fields → 400 and NOTHING changes", async () => {
    const bodies = [
      { role: "ADMIN" },
      { email: "x@y.com" },
      { balance: 999999 },
      { status: "SUSPENDED" },
      { name: "Ok Name", role: "ADMIN" },
      {},
      { name: "R" },
    ];
    for (const body of bodies) {
      const res = await patch(cookieFor(A.user), body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
    const fresh = await User.findById(A.user._id);
    expect(fresh).toMatchObject({ name: "Riya Sharma", role: "CUSTOMER", email: "riya@example.com" });
    expect(await balanceOf(A.account._id)).toBe(1000000);
  });

  it("401 anonymous; an admin may read their own profile", async () => {
    expect((await request(app).get("/api/v1/profile")).status).toBe(401);
    const admin = await makeAdmin();
    expect((await request(app).get("/api/v1/profile").set("Cookie", cookieFor(admin))).status).toBe(200);
  });

  it("renaming does NOT rewrite history: old payments keep the name they were made with (D-16)", async () => {
    const { payment } = await createTransfer({
      senderUserId: A.user._id,
      idempotencyKey: crypto.randomUUID(),
      recipientAccountId: B.account._id,
      amountPaise: 10000,
    });
    await patch(cookieFor(B.user), { name: "Aarav M. Renamed" });
    const res = await request(app).get(`/api/v1/transactions/${payment.paymentId}`).set("Cookie", cookieFor(A.user));
    expect(res.body.data.transaction.counterparty.name).toBe("Aarav Mehta");
  });
});
