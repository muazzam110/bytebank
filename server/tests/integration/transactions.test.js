import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import request from "supertest";
import { startTestDB, clearDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, makeAdmin, cookieFor } from "../setup/factories.js";
import { app } from "../../src/app.js";
import { createTransfer } from "../../src/services/transfer.service.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

let A, B, C, firstId;
const get = (cookie, path) => request(app).get(`/api/v1${path}`).set("Cookie", cookie);
const mine = () => cookieFor(A.user);
const total = async (qs) => (await get(mine(), `/transactions?${qs}`)).body.meta.total;
const stripRequestId = ({ body }) => {
  const { requestId, ...rest } = body.error;
  return rest;
};
const todayIST = () => new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);

beforeAll(async () => {
  await startTestDB();
  await clearDB();
  A = await makeCustomer("Riya Sharma", "riya@example.com");
  B = await makeCustomer("Aarav Mehta", "aarav@example.com");
  C = await makeCustomer("Kabir Rao", "kabir@example.com"); // unrelated to A↔B

  const pay = (from, to, rupees, description) =>
    createTransfer({
      senderUserId: from.user._id,
      idempotencyKey: crypto.randomUUID(),
      recipientAccountId: to.account._id,
      amountPaise: rupees * 100,
      description,
    });
  firstId = (await pay(A, B, 1, "Lunch")).payment.paymentId;
  for (let i = 2; i <= 25; i++) await pay(A, B, i);
  await pay(B, A, 7);
  // Riya now has 27 rows: 1 welcome deposit + 25 sent + 1 received
}, 180_000);
afterAll(stopTestDB);

describe("GET /transactions", () => {
  it("lists newest first with pagination meta", async () => {
    const res = await get(mine(), "/transactions");
    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 27, totalPages: 2 });
    const dates = res.body.data.transactions.map((t) => t.createdAt);
    expect(dates).toHaveLength(20);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("page 2 holds the remaining 7 with no overlap", async () => {
    const ids = async (p) => (await get(mine(), `/transactions?page=${p}`)).body.data.transactions.map((t) => t.paymentId);
    const [p1, p2] = [await ids(1), await ids(2)];
    expect(p2).toHaveLength(7);
    expect(p1.filter((id) => p2.includes(id))).toEqual([]);
  });

  it("rejects limit > 100, unknown params, bad enums", async () => {
    for (const qs of ["limit=500", "foo=1", "type=BANANA", "direction=", "page=0"]) {
      const res = await get(mine(), `/transactions?${qs}`);
      expect(res.status, qs).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("direction + type filters", async () => {
    expect(await total("direction=sent")).toBe(25);
    expect(await total("direction=received")).toBe(2); // welcome deposit + 1 from Aarav
    expect(await total("type=INITIAL_DEPOSIT")).toBe(1);
    expect(await total("type=TRANSFER")).toBe(26);
  });

  it("search: payment-ID prefix, counterparty name, regex characters are literal", async () => {
    expect(await total("q=PAY-")).toBe(27);
    expect(await total(`q=${firstId.slice(0, 6).toLowerCase()}`)).toBeGreaterThanOrEqual(1);
    expect(await total("q=aar")).toBe(26); // 25 sent to Aarav + 1 received; the welcome deposit doesn't match
    expect(await total("q=bytebank")).toBe(1); // the welcome deposit's counterparty
    expect(await total("q=sharma")).toBe(0); // your OWN name never matches
    expect(await total("q=.*")).toBe(0); // literal, not a wildcard
  });

  it("sort is a whitelist", async () => {
    const asc = await get(mine(), "/transactions?sort=amount&limit=1");
    expect(asc.body.data.transactions[0].amountPaise).toBe(100);
    const desc = await get(mine(), "/transactions?sort=-amount&limit=1");
    expect(desc.body.data.transactions[0].amountPaise).toBe(1000000); // the welcome deposit
    expect((await get(mine(), "/transactions?sort=passwordHash")).status).toBe(400);
  });

  it("date range: inclusive IST days, validated", async () => {
    const today = todayIST();
    expect(await total(`from=${today}&to=${today}`)).toBe(27);
    expect(await total("from=2020-01-01&to=2020-12-31")).toBe(0);
    for (const qs of [`from=${today}&to=2020-01-01`, `from=2020-01-01&to=${today}`, "from=2026-02-31"]) {
      expect((await get(mine(), `/transactions?${qs}`)).status, qs).toBe(400);
    }
  });
});

describe("GET /transactions/:paymentId", () => {
  it("returns my payment, with only MY balance snapshot", async () => {
    const res = await get(mine(), `/transactions/${firstId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.transaction).toMatchObject({
      paymentId: firstId,
      direction: "sent",
      amountPaise: 100,
      description: "Lunch",
      counterparty: { name: "Aarav Mehta" },
      balanceAfterPaise: 999900,
    });
  });

  it("accepts a lower-case ID", async () => {
    expect((await get(mine(), `/transactions/${firstId.toLowerCase()}`)).status).toBe(200);
  });

  it("someone else's payment and a non-existent one are IDENTICAL 404s", async () => {
    const foreign = await get(cookieFor(C.user), `/transactions/${firstId}`);
    const missing = await get(mine(), "/transactions/PAY-DOESNOTEXI");
    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(stripRequestId(foreign)).toEqual(stripRequestId(missing));
  });

  it("malformed id → 400", async () => {
    expect((await get(mine(), "/transactions/not-an-id")).status).toBe(400);
  });
});

describe("receipt", () => {
  it("has exactly the safe fields: no ids, tokens or balances", async () => {
    const res = await get(mine(), `/transactions/${firstId}/receipt`);
    expect(res.status).toBe(200);
    const { receipt } = res.body.data;
    expect(Object.keys(receipt).sort()).toEqual([
      "amountPaise",
      "createdAt",
      "currency",
      "description",
      "paymentId",
      "recipient",
      "sender",
      "simulated",
      "status",
      "type",
    ]);
    expect(receipt.sender.name).toBe("Riya Sharma");
    expect(receipt.recipient.name).toBe("Aarav Mehta");
    expect(receipt.simulated).toBe(true);
  });

  it("is 404 for a non-participant", async () => {
    expect((await get(cookieFor(C.user), `/transactions/${firstId}/receipt`)).status).toBe(404);
  });
});

describe("access control", () => {
  it("401 without a cookie, 403 for an admin", async () => {
    expect((await get("", "/transactions")).status).toBe(401);
    const admin = await makeAdmin();
    const res = await get(cookieFor(admin), "/transactions");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
