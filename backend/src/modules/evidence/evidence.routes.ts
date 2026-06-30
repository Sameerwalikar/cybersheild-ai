import { Router } from "express";
import { evidenceController } from "./evidence.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);

// Citizen routes
router.post("/upload", evidenceController.upload);
router.get("/", evidenceController.list);
router.get("/:id", evidenceController.getById);
router.delete("/:id", evidenceController.remove);

// Police routes
router.get("/police/all", authorize("POLICE"), evidenceController.listAll);
router.get("/police/stats", authorize("POLICE"), evidenceController.policeStats);
router.get("/police/:id", authorize("POLICE"), evidenceController.policeGetById);
router.patch("/police/:id/status", authorize("POLICE"), evidenceController.updateStatus);
router.post("/police/:id/acknowledge", authorize("POLICE"), evidenceController.acknowledge);
router.post("/police/:id/note", authorize("POLICE"), evidenceController.addNote);

export const evidenceRouter = router;
