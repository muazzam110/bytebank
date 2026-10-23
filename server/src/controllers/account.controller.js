import { asyncHandler } from "../utils/asyncHandler.js";
import * as accountService from "../services/account.service.js";

// NOTE: both read req.user.id (from the cookie). They NEVER read a user id from the URL or body.
export const getAccount = asyncHandler(async (req, res) => {
  const account = await accountService.getAccountByUserId(req.user.id);
  res.json({ success: true, data: { account } });
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await accountService.getSummary(req.user.id, req.query.range);
  res.json({ success: true, data });
});
