import { Router } from "express";
import { aegisController } from "./aegis.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/conversations", aegisController.listConversations);
router.get("/conversations/:id", aegisController.getConversation);
router.post("/chat", aegisController.chat);
router.delete("/conversations/:id", aegisController.deleteConversation);
router.patch("/conversations/:id", aegisController.renameConversation);

export const aegisRouter = router;
