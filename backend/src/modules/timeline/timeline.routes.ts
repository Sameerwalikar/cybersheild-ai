import { Router } from "express";
import { timelineController } from "./timeline.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", timelineController.list);
router.get("/stats", timelineController.stats);

export const timelineRouter = router;
