import { Router } from "express";
import { historyController } from "./history.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", historyController.list);
router.get("/trends", historyController.trends);
router.get("/export", historyController.exportData);
router.get("/:id", historyController.detail);

export const historyRouter = router;
