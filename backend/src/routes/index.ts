import { Router } from "express";
import { healthRouter } from "./health.js";
import { authRouter } from "../modules/auth/index.js";
import { scannerRouter } from "../modules/scanner/index.js";
import { dashboardRouter } from "../modules/dashboard/index.js";
import { historyRouter } from "../modules/history/index.js";
import { aegisRouter } from "../modules/aegis/index.js";
import { notificationRouter } from "../modules/notifications/index.js";
import { policeRouter } from "../modules/police/index.js";
import { graphRouter } from "../modules/graph/index.js";
import { evidenceRouter } from "../modules/evidence/index.js";
import { incidentRouter } from "../modules/incidents/index.js";
import { timelineRouter } from "../modules/timeline/index.js";
import { reportRouter } from "../modules/reports/index.js";
import { analyticsRouter } from "../modules/analytics/index.js";
import { searchRouter } from "../modules/search/index.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/analyze", scannerRouter);
router.use("/dashboard", dashboardRouter);
router.use("/history", historyRouter);
router.use("/aegis", aegisRouter);
router.use("/notifications", notificationRouter);
router.use("/police", policeRouter);
router.use("/police/graph", graphRouter);
router.use("/evidence", evidenceRouter);
router.use("/incidents", incidentRouter);
router.use("/timeline", timelineRouter);
router.use("/reports", reportRouter);
router.use("/analytics", analyticsRouter);
router.use("/search", searchRouter);

export const apiRouter = router;
