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
};
