import { Router } from "express";
import { searchController } from "./search.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.use(authorize("POLICE"));

router.get("/", searchController.globalSearch);

export const searchRouter = router;
