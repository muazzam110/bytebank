import { asyncHandler } from "../utils/asyncHandler.js";
import { parseRupeesToPaise } from "../utils/money.js";
import * as transferService from "../services/transfer.service.js";

export const create = asyncHandler(async (req, res) => {
  const result = await transferService.createTransfer({
    senderUserId: req.user.id, // from the cookie, NEVER from the body
    idempotencyKey: req.get("Idempotency-Key").toLowerCase(), // same UUID in another case = same key
    recipientAccountId: req.body.recipient.accountId,
    amountPaise: parseRupeesToPaise(req.body.amount), // the ONLY place the string becomes paise
    description: req.body.description || undefined, // "" → undefined, so hashes are stable
  });
  // 201 = a new payment was created, 200 = a replay of an earlier one
  res.status(result.replayed ? 200 : 201).json({ success: true, data: result });
});
