import { Router } from "express";
import { healthRouter } from "./health.js";
import { authRouter } from "../modules/auth/index.js";
import { scannerRouter } from "../modules/scanner/index.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/analyze", scannerRouter);

export const apiRouter = router;
