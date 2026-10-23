import { Router } from "express";
import { csrfGuard } from "../middleware/csrfGuard.js";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import accountRoutes from "./account.routes.js";
import recipientRoutes from "./recipient.routes.js";
import transferRoutes from "./transfer.routes.js";
import transactionRoutes from "./transaction.routes.js";
import adminRoutes from "./admin.routes.js";
import profileRoutes from "./profile.routes.js";

const router = Router();
router.use(csrfGuard);
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/account", accountRoutes);
router.use("/recipients", recipientRoutes);
router.use("/transfers", transferRoutes);
router.use("/transactions", transactionRoutes);
router.use("/admin", adminRoutes);
router.use("/profile", profileRoutes);

export default router;
