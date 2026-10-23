import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => res.json({ success: true, data: { status: "ok" } }));

router.get("/ready", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ success: true, data: { status: "ready" } });
  } catch {
    res.status(503).json({ success: false, error: { code: "NOT_READY", message: "Database unavailable." } });
  }
});

export default router;
