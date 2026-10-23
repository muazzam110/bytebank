import { asyncHandler } from "../utils/asyncHandler.js";
import { parseRupeesToPaise } from "../utils/money.js";
import * as adminService from "../services/admin.service.js";

// Plain facts about the request for the audit log. Services never see req/res themselves.
const ctx = (req) => ({ ip: req.ip, requestId: req.id });

export const overview = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.getOverview() });
});

export const users = asyncHandler(async (req, res) => {
  const { users, meta } = await adminService.listUsers(req.query);
  res.json({ success: true, data: { users }, meta });
});

export const userDetail = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await adminService.getUserDetail(req.params.id) });
});

export const setStatus = asyncHandler(async (req, res) => {
  const { user } = await adminService.setUserStatus(
    req.user.id,
    req.params.id,
    req.body.status,
    req.body.note || undefined,
    ctx(req)
  );
  res.json({ success: true, data: { user } });
});

export const transactions = asyncHandler(async (req, res) => {
  const { transactions, meta } = await adminService.listAdminTransactions(req.query);
  res.json({ success: true, data: { transactions }, meta });
});

export const deposits = asyncHandler(async (req, res) => {
  const { deposits, meta } = await adminService.listDeposits(req.query);
  res.json({ success: true, data: { deposits }, meta });
});

export const createDeposit = asyncHandler(async (req, res) => {
  const { deposit } = await adminService.createDeposit(
    req.user.id, // the acting admin comes from the cookie
    { userId: req.body.userId, amountPaise: parseRupeesToPaise(req.body.amount), reason: req.body.reason },
    ctx(req)
  );
  res.status(201).json({ success: true, data: { deposit } });
});
