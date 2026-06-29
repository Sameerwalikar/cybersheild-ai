import { Router } from "express";
import { healthRouter } from "./health.js";
import { authRouter } from "../modules/auth/index.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);

export const apiRouter = router;
