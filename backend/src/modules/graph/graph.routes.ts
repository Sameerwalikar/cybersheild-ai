import { Router } from "express";
import { graphController } from "./graph.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.use(authorize("POLICE"));

router.get("/search", graphController.search);
router.get("/stats", graphController.stats);
router.get("/top", graphController.topEntities);
router.get("/:id", graphController.getNetwork);

export const graphRouter = router;
