import { Router } from "express";
import * as c from "../controllers/transaction.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { lookupLimiter } from "../middleware/rateLimiters.js";
import { listQuerySchema, paymentIdParamSchema } from "../validators/transaction.validators.js";

const router = Router();
router.use(authenticate, requireRole("CUSTOMER")); // admins use /admin/transactions (Phase 5)

router.get("/", validate(listQuerySchema), c.list);
router.get("/:paymentId", lookupLimiter, validate(paymentIdParamSchema), c.getOne);
router.get("/:paymentId/receipt", lookupLimiter, validate(paymentIdParamSchema), c.getReceipt);

export default router;
