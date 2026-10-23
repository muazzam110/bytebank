import { asyncHandler } from "../utils/asyncHandler.js";
import { signSession, setSessionCookie, clearSessionCookie } from "../utils/jwt.js";
import * as authService from "../services/auth.service.js";

export const signup = asyncHandler(async (req, res) => {
  const data = await authService.signup(req.body);
  res.status(201).json({ success: true, data });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  setSessionCookie(res, signSession(user)); // token goes ONLY in the cookie
  res.json({ success: true, data: { user: authService.toPublicUser(user) } });
});

export const logout = asyncHandler(async (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, data: { message: "Logged out." } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.requestPasswordReset(req.body.email);
  res.json({ success: true, data });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  res.json({ success: true, data });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user.id, req.body);
  setSessionCookie(res, signSession(user)); // new tokenVersion → fresh cookie for THIS session
  res.json({ success: true, data: { message: "Password updated." } });
});
