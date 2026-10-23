import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { startTestDB, stopTestDB } from "../setup/replset.js";
import { makeCustomer, makeAdmin, cookieFor } from "../setup/factories.js";
import { app } from "../../src/app.js";
import adminRouter from "../../src/routes/admin.routes.js";

vi.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPaymentReceived: vi.fn(),
}));

// Every route that actually exists on the admin router, read from Express itself
const routes = adminRouter.stack
  .filter((layer) => layer.route)
  .flatMap((layer) =>
    Object.keys(layer.route.methods)
      .filter((m) => layer.route.methods[m])
      .map((m) => ({ method: m.toUpperCase(), path: layer.route.path }))
  );

// A valid example call per route. A NEW route fails the first test until you add its sample here.
const SAMPLES = {
  "GET /overview": () => ({}),
  "GET /users": () => ({}),
  "GET /users/:id": (c) => ({ id: c.customerId }),
  "PATCH /users/:id/status": (c) => ({ id: c.customerId, body: { status: "ACTIVE" } }), // already ACTIVE → harmless no-op
  "GET /transactions": () => ({}),
  "GET /deposits": () => ({}),
  "POST /deposits": (c) => ({ body: { userId: c.customerId, amount: "10.00", reason: "rbac matrix" } }),
};

let admin, customer, ctx;
beforeAll(async () => {
  await startTestDB();
  admin = await makeAdmin();
  customer = await makeCustomer("Riya Sharma", "riya@example.com");
  ctx = { customerId: String(customer.user._id) };
}, 120_000);
afterAll(stopTestDB);

const call = ({ method, path }, cookie) => {
  const sample = SAMPLES[`${method} ${path}`](ctx);
  let req = request(app)[method.toLowerCase()](`/api/v1/admin${path.replace(":id", sample.id ?? "")}`);
  if (cookie) req = req.set("Cookie", cookie);
  return sample.body ? req.send(sample.body) : req;
};

describe("admin router structure", () => {
  it("every admin route has a matrix sample (a new route can't be forgotten)", () => {
    const missing = routes.map((r) => `${r.method} ${r.path}`).filter((key) => !SAMPLES[key]);
    expect(missing).toEqual([]);
    expect(routes.length).toBeGreaterThanOrEqual(7);
  });

  it("the guard (authenticate + requireRole) is registered BEFORE every route", () => {
    const firstRoute = adminRouter.stack.findIndex((layer) => layer.route);
    expect(firstRoute).toBe(2);
    expect(adminRouter.stack.slice(0, 2).every((layer) => !layer.route)).toBe(true);
  });
});

describe.each(routes.map((r) => [`${r.method} /admin${r.path}`, r]))("%s", (_name, route) => {
  it("anonymous → 401 UNAUTHENTICATED", async () => {
    const res = await call(route, null);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("customer → 403 FORBIDDEN (acceptance criterion #11)", async () => {
    const res = await call(route, cookieFor(customer.user));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("admin → 2xx", async () => {
    const res = await call(route, cookieFor(admin));
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });
});
