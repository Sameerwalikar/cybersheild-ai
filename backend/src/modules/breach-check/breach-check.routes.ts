import { Router } from "express";
import { breachCheckController } from "./breach-check.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { breachCheckSchema } from "./breach-check.validator.js";


const router = Router();

router.use(authenticate);

router.post("/", validate(breachCheckSchema), breachCheckController.checkEmail);

export const breachCheckRouter = router;
