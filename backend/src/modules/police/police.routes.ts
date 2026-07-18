import { Router } from "express";
import { policeController } from "./police.controller.js";
import { ipTracingController } from "./ip-tracing/index.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.use(authorize("POLICE"));

router.get("/dashboard", policeController.dashboard);
router.get("/investigations", policeController.investigations);
router.get("/investigations/:id", policeController.investigation);
router.get("/networks", policeController.networks);
router.get("/analytics", policeController.analytics);

// IP Tracing routes
router.get("/ip-trace/quotas", ipTracingController.getQuotas);
router.get("/ip-trace/:ip", ipTracingController.getRiskProfile);
router.post("/ip-trace/:ip/list", ipTracingController.addToList);

export const policeRouter = router;
