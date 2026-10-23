import { asyncHandler } from "../utils/asyncHandler.js";
import * as recipientService from "../services/recipient.service.js";

export const search = asyncHandler(async (req, res) => {
  const recipients = await recipientService.searchRecipients(req.user.id, req.query.q);
  res.json({ success: true, data: { recipients } });
});
