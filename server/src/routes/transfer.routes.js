import { Router } from "express";
import * as c from "../controllers/transfer.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { transferLimiter } from "../middleware/rateLimiters.js";
import { transferSchema } from "../validators/transfer.validators.js";

const router = Router();
// Admins are NOT customers: requireRole("CUSTOMER") keeps them out
router.use(authenticate, requireRole("CUSTOMER"));
router.post("/", transferLimiter, validate(transferSchema), c.create);
export default router;
