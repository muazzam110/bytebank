import { Router } from "express";
import * as c from "../controllers/account.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { summaryQuerySchema } from "../validators/account.validators.js";

const router = Router();

router.use(authenticate); // everything below needs a logged-in user

router.get("/", c.getAccount);
router.get("/summary", validate(summaryQuerySchema), c.getSummary);

export default router;
