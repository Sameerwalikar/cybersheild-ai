import { Router } from "express";
import { scannerController } from "./scanner.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { analyzeMessageSchema, analyzeUrlSchema, analyzeQrSchema, analyzeUpiSchema, analyzeVoiceSchema, analyzeImageSchema } from "./scanner.validator.js";

const router = Router();

router.use(authenticate);

router.post("/message", validate(analyzeMessageSchema), scannerController.analyzeMessage);
router.post("/url", validate(analyzeUrlSchema), scannerController.analyzeUrl);
router.post("/qr", validate(analyzeQrSchema), scannerController.analyzeQr);
router.post("/upi", validate(analyzeUpiSchema), scannerController.analyzeUpi);
router.post("/voice", validate(analyzeVoiceSchema), scannerController.analyzeVoice);
router.post("/image", validate(analyzeImageSchema), scannerController.analyzeImage);
router.get("/history", scannerController.getHistory);

export const scannerRouter = router;
