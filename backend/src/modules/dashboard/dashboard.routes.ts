import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);

// Add a unified endpoint that returns all dashboard data in one request
router.get("/all", dashboardController.all);

// Individual endpoints (kept for backwards compatibility)
router.get("/overview", dashboardController.overview);
router.get("/history", dashboardController.history);
router.get("/timeline", dashboardController.timeline);
router.get("/insights", dashboardController.insights);
router.get("/notifications", dashboardController.notifications);

export const dashboardRouter = router;
