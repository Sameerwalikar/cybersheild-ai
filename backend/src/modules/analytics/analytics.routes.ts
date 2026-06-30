import { Router } from "express";
import { analyticsController } from "./analytics.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.use(authorize("POLICE"));

router.get("/dashboard", analyticsController.dashboard);
router.get("/trends", analyticsController.trends);
router.get("/top-indicators", analyticsController.topIndicators);
router.get("/activity-feed", analyticsController.activityFeed);
router.get("/repeat-scammers", analyticsController.repeatScammers);
router.get("/scammers/:id", analyticsController.scammerProfile);
router.get("/scammers/:id/timeline", analyticsController.scammerTimeline);
router.get("/scammers/:id/similar", analyticsController.scammerSimilar);
router.get("/threat-map", analyticsController.threatMap);

export const analyticsRouter = router;
