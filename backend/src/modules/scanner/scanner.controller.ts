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
        return res.status(400).json({ success: false, error: "UNSUPPORTED_FORMAT", message: "No image file uploaded." });
      }

      const mimeType = req.file.mimetype;
      if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mimeType)) {
        return res.status(400).json({ success: false, error: "UNSUPPORTED_FORMAT", message: "Only PNG, JPEG, JPG, and WEBP images are supported." });
      }

      const { preprocessImage } = await import("../../utils/imagePreprocess.util.js");
      const { data, width, height } = await preprocessImage(req.file.buffer);

      const { decodeQrImage } = await import("../../services/qrDecoder.service.js");
      const result = await decodeQrImage(data, width, height);

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error || "UNREADABLE", message: "We couldn't find a QR code in this image." });
      }

      sendSuccess(res, { decodedContent: result.decodedContent });
    } catch (err: any) {
      next(err);
    }
  },

  async classifyQr(req: Request, res: Response, next: NextFunction) {
    try {
      const { decodedContent } = req.body;
      if (!decodedContent) {
        return res.status(400).json({ success: false, error: "BAD_REQUEST", message: "decodedContent is required." });
      }

      const { classifyQrContent } = await import("../../services/qrClassifier.service.js");
      const classification = classifyQrContent(decodedContent);
      sendSuccess(res, classification);
    } catch (err) { next(err); }
  },

  async analyzeQrParsed(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { decodedContent } = req.body;
      if (!decodedContent) {
        return res.status(400).json({ success: false, error: "BAD_REQUEST", message: "decodedContent is required." });
      }

      const { routeAndAnalyzeQr } = await import("../../services/qrRouter.service.js");
      const report = await routeAndAnalyzeQr(user.id, decodedContent);
      sendSuccess(res, report);
    } catch (err) { next(err); }
  },
};
