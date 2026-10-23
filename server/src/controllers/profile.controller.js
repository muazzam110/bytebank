import { asyncHandler } from "../utils/asyncHandler.js";
import * as profileService from "../services/profile.service.js";

export const get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: await profileService.getProfile(req.user.id) } });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: await profileService.updateProfile(req.user.id, req.body) } });
});
