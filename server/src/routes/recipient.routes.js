import { Router } from "express";
import * as c from "../controllers/recipient.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { recipientSearchLimiter } from "../middleware/rateLimiters.js";
import { recipientSearchSchema } from "../validators/transfer.validators.js";

const router = Router();
router.use(authenticate, requireRole("CUSTOMER"));
router.get("/search", recipientSearchLimiter, validate(recipientSearchSchema), c.search);
export default router;
