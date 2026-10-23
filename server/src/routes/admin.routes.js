import { Router } from "express";
import * as c from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { adminWriteLimiter } from "../middleware/rateLimiters.js";
import {
  usersQuerySchema,
  userIdParamSchema,
  statusSchema,
  depositSchema,
  adminTransactionsQuerySchema,
  depositsQuerySchema,
} from "../validators/admin.validators.js";

const router = Router();

// ⭐ FIRST LINE: every route registered below is protected by default. You cannot forget it.
router.use(authenticate, requireRole("ADMIN"));

router.get("/overview", c.overview);
router.get("/users", validate(usersQuerySchema), c.users);
router.get("/users/:id", validate(userIdParamSchema), c.userDetail);
router.patch("/users/:id/status", adminWriteLimiter, validate(statusSchema), c.setStatus);
router.get("/transactions", validate(adminTransactionsQuerySchema), c.transactions);
router.get("/deposits", validate(depositsQuerySchema), c.deposits);
router.post("/deposits", adminWriteLimiter, validate(depositSchema), c.createDeposit);

export default router;
