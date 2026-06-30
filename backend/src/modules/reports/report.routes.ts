import { Router } from "express";
import { reportController } from "./report.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { createReportSchema } from "./report.validator.js";

const router = Router();

// ─── Citizen routes (authenticated) ─────────────────────────────────
router.post("/", authenticate, validate(createReportSchema), reportController.create);
router.get("/", authenticate, reportController.list);
router.get("/:id", authenticate, reportController.getById);

// ─── Police routes ──────────────────────────────────────────────────
router.get("/police/all", authenticate, authorize("POLICE"), reportController.listAll);
router.get("/police/stats", authenticate, authorize("POLICE"), reportController.getStats);
router.get("/police/scammers", authenticate, authorize("POLICE"), reportController.getScammerProfiles);
router.get("/police/top-entities", authenticate, authorize("POLICE"), reportController.getTopReportedEntities);
router.get("/police/:id", authenticate, authorize("POLICE"), reportController.getAnyById);
router.patch("/police/:id/status", authenticate, authorize("POLICE"), reportController.updateStatus);
router.patch("/police/:id/assign", authenticate, authorize("POLICE"), reportController.assignOfficer);
router.post("/police/:id/acknowledge", authenticate, authorize("POLICE"), reportController.acknowledge);
router.post("/police/:id/note", authenticate, authorize("POLICE"), reportController.addNote);

export const reportRouter = router;
