import { Router } from "express";
import { healthRouter } from "./health.js";
import { authRouter } from "../modules/auth/index.js";
import { scannerRouter } from "../modules/scanner/index.js";
import { dashboardRouter } from "../modules/dashboard/index.js";
import { historyRouter } from "../modules/history/index.js";
import { aegisRouter } from "../modules/aegis/index.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/analyze", scannerRouter);
router.use("/dashboard", dashboardRouter);
router.use("/history", historyRouter);
router.use("/aegis", aegisRouter);

export const apiRouter = router;
