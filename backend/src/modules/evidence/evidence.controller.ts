import type { Request, Response, NextFunction } from "express";
import { evidenceService } from "./evidence.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const evidenceController = {
  // ─── Citizen routes ───────────────────────────────────────────────
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { filename, mimeType, file } = req.body;
      if (!filename || !mimeType || !file) {
        sendError(res, "filename, mimeType, and file (base64) are required", 400, "VALIDATION_ERROR");
        return;
      }
      const result = await evidenceService.upload({ userId: user.id, filename, mimeType, fileBase64: file });
      sendSuccess(res, result, result.cached ? 200 : 201);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await evidenceService.list(user.id, page, limit);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await evidenceService.getById(req.params.id as string, user.id);
      if (!data) { sendError(res, "Evidence not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await evidenceService.remove(req.params.id as string, user.id);
      if (!result) { sendError(res, "Evidence not found", 404); return; }
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  // ─── Police routes ────────────────────────────────────────────────
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, riskLevel, page, limit } = req.query;
      const data = await evidenceService.listAllPolice({
        status: status as string,
        riskLevel: riskLevel as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async policeGetById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await evidenceService.policeGetById(req.params.id as string);
      if (!data) { sendError(res, "Evidence not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async policeStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await evidenceService.policeStats();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { status } = req.body;
      if (!status) { sendError(res, "status is required", 400); return; }
      const result = await evidenceService.updateStatus(req.params.id as string, status, user.id);
      if (!result) { sendError(res, "Evidence not found", 404); return; }
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { message, status } = req.body;
      if (!message) { sendError(res, "message is required", 400); return; }
      const result = await evidenceService.acknowledge(req.params.id as string, message, status || "under_review", user.id);
      if (!result) { sendError(res, "Evidence not found", 404); return; }
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { note } = req.body;
      if (!note) { sendError(res, "note is required", 400); return; }
      const result = await evidenceService.addNote(req.params.id as string, note, user.id);
      if (!result) { sendError(res, "Evidence not found", 404); return; }
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },
};
