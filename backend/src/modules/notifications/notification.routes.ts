import { Router } from "express";
import { notificationController } from "./notification.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", notificationController.list);
router.get("/activity", notificationController.activity);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.remove);

export const notificationRouter = router;
