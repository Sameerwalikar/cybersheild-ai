import type { Request, Response, NextFunction } from "express";
import { scannerService } from "./scanner.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const scannerController = {
  async analyzeMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await scannerService.analyzeScan({
        userId: user.id,
        scanType: "MESSAGE",
        content: req.body.content,
        metadata: req.body.metadata,
      });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async analyzeUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await scannerService.analyzeScan({
        userId: user.id,
        scanType: "URL",
        content: req.body.url,
        metadata: req.body.options,
      });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async analyzeQr(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await scannerService.analyzeScan({
        userId: user.id,
        scanType: "QR",
        content: req.body.content,
        metadata: { originalType: req.body.originalType },
      });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async analyzeUpi(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await scannerService.analyzeScan({
        userId: user.id,
        scanType: "UPI",
        content: req.body.upiId,
      });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async analyzeVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await scannerService.analyzeScan({
        userId: user.id,
        scanType: "VOICE",
        content: req.body.transcript,
        metadata: { duration: req.body.duration },
      });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const history = await scannerService.getHistory(user.id);
      sendSuccess(res, history);
    } catch (err) { next(err); }
  },

  async analyzeImage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await scannerService.analyzeImageScan({
        userId: user.id,
        imageBase64: req.body.image,
        mimeType: req.body.mimeType,
        description: req.body.description,
      });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async uploadAndDecodeQr(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        console.warn("[QR Upload] req.file is undefined");
        return res.status(400).json({ success: false, stage: "decode", error: "UNSUPPORTED_FORMAT", message: "No image file uploaded." });
      }

      const mimeType = req.file.mimetype;
      console.log("[QR Upload] Received file:", {
        originalname: req.file.originalname,
        fieldname: req.file.fieldname,
        size: req.file.size,
        mimetype: mimeType,
        bufferLength: req.file.buffer?.length
      });

      if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mimeType)) {
        console.warn("[QR Upload] Unsupported mimetype:", mimeType);
        return res.status(400).json({ success: false, stage: "decode", error: "UNSUPPORTED_FORMAT", message: "Only PNG, JPEG, JPG, and WEBP images are supported." });
      }

      const { preprocessImage } = await import("../../utils/imagePreprocess.util.js");
      const { data, width, height } = await preprocessImage(req.file.buffer);
      console.log("[QR Upload] Preprocessing complete:", { width, height, rawDataLength: data.length });

      const { decodeQrImage } = await import("../../services/qrDecoder.service.js");
      const result = await decodeQrImage(data, width, height);
      console.log("[QR Upload] Decoding result:", result);

      if (!result.success) {
        return res.status(400).json({ success: false, stage: "decode", error: result.error || "UNREADABLE", message: "Please upload an image containing a valid QR code." });
      }

      const user = (req as AuthenticatedRequest).user!;
      const { routeAndAnalyzeQr } = await import("../../services/qrRouter.service.js");
      const report = await routeAndAnalyzeQr(user.id, result.decodedContent!);
      sendSuccess(res, report);
    } catch (err: any) {
      console.error("[QR Upload] Error in uploadAndDecodeQr:", err);
      res.status(400).json({ success: false, stage: "decode", error: "UNREADABLE", message: "Please upload an image containing a valid QR code." });
    }
  },

  async classifyQr(req: Request, res: Response, next: NextFunction) {
    try {
      const { decodedContent } = req.body;
      if (!decodedContent) {
        return res.status(400).json({ success: false, stage: "classify", error: "BAD_REQUEST", message: "decodedContent is required." });
      }

      const { classifyQrContent } = await import("../../services/qrClassifier.service.js");
      const classification = classifyQrContent(decodedContent);
      sendSuccess(res, classification);
    } catch (err: any) {
      res.status(500).json({ success: false, stage: "classify", error: "INTERNAL_ERROR", message: err.message || "Classification failed." });
    }
  },

  async analyzeQrParsed(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { decodedContent } = req.body;
      if (!decodedContent) {
        return res.status(400).json({ success: false, stage: "analyze", error: "BAD_REQUEST", message: "decodedContent is required." });
      }

      const { routeAndAnalyzeQr } = await import("../../services/qrRouter.service.js");
      const report = await routeAndAnalyzeQr(user.id, decodedContent);
      sendSuccess(res, report);
    } catch (err: any) {
      res.status(500).json({ success: false, stage: "analyze", error: "INTERNAL_ERROR", message: err.message || "Analysis failed." });
    }
  },
};
