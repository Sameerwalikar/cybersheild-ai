import { Router } from "express";
import { incidentController } from "./incident.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.use(authorize("POLICE"));

router.get("/", incidentController.list);
router.get("/stats", incidentController.stats);
router.get("/:id", incidentController.getById);
router.post("/", incidentController.create);
router.patch("/:id", incidentController.update);
router.patch("/:id/status", incidentController.updateStatus);
router.post("/:id/assign", incidentController.assign);
router.post("/:id/note", incidentController.addNote);
router.post("/:id/link-report", incidentController.linkReport);
router.post("/:id/unlink-report", incidentController.unlinkReport);
router.post("/:id/link-evidence", incidentController.linkEvidence);
router.post("/:id/merge", incidentController.merge);
router.post("/:id/close", incidentController.close);
router.get("/:id/timeline", incidentController.timeline);

export const incidentRouter = router;
