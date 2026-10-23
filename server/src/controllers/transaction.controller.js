import { asyncHandler } from "../utils/asyncHandler.js";
import * as transactionService from "../services/transaction.service.js";

// req.query / req.params are the PARSED values (validate replaced them)
export const list = asyncHandler(async (req, res) => {
  const { transactions, meta } = await transactionService.listMyTransactions(req.user.id, req.query);
  res.json({ success: true, data: { transactions }, meta });
});

export const getOne = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getMyTransaction(req.user.id, req.params.paymentId);
  res.json({ success: true, data: { transaction } });
});

export const getReceipt = asyncHandler(async (req, res) => {
  const receipt = await transactionService.getReceipt(req.user.id, req.params.paymentId);
  res.json({ success: true, data: { receipt } });
});
