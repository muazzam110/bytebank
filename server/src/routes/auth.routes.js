import { Router } from "express";
import * as c from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter, emailLimiter } from "../middleware/rateLimiters.js";
import {
  signupSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  changePasswordSchema,
} from "../validators/auth.validators.js";

const router = Router();

// reads left→right: limiter → validate → controller
router.post("/signup", validate(signupSchema), c.signup);
router.post("/login", authLimiter, validate(loginSchema), c.login);
router.post("/logout", authenticate, c.logout);
router.get("/me", authenticate, c.me);
router.post("/forgot-password", emailLimiter, validate(forgotSchema), c.forgotPassword);
router.post("/reset-password", validate(resetSchema), c.resetPassword);
router.post("/change-password", authenticate, validate(changePasswordSchema), c.changePassword);

export default router;
