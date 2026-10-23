import { Router } from "express";
import * as c from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../validators/profile.validators.js";

const router = Router();
router.use(authenticate);
router.get("/", c.get);
router.patch("/", validate(updateProfileSchema), c.update);
export default router;
