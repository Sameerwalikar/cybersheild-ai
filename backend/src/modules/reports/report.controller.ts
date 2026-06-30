import type { Request, Response, NextFunction } from "express";
import { reportService } from "./report.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const reportController = {
  // ─── Citizen Routes ───────────────────────────────────────────────

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const report = await reportService.create(user.id, req.body);
      sendSuccess(res, report, 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { status, page, limit } = req.query;
      const data = await reportService.listByUser(user.id, {
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const report = await reportService.getById(req.params.id as string, user.id);
      if (!report) {
        sendError(res, "Report not found", 404, "NOT_FOUND");
        return;
      }
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  // ─── Police Routes ────────────────────────────────────────────────

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, page, limit } = req.query;
      const data = await reportService.listAll({
        status: status as string,
        priority: priority as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getAnyById(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getDetailedById(req.params.id as string);
      if (!report) {
        sendError(res, "Report not found", 404, "NOT_FOUND");
        return;
      }
      sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { status } = req.body;
      if (!status) {
        sendError(res, "Status is required", 400, "VALIDATION_ERROR");
        return;
      }
      const report = await reportService.updateStatus(req.params.id as string, status, user.id);
      sendSuccess(res, report);
    } catch (err: any) {
      if (err.message?.startsWith("Invalid status")) {
        sendError(res, err.message, 400, "VALIDATION_ERROR");
        return;
      }
      next(err);
    }
  },

  async assignOfficer(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { officerId } = req.body;
      if (!officerId) {
        sendError(res, "officerId is required", 400, "VALIDATION_ERROR");
        return;
      }
      await reportService.assignOfficer(req.params.id as string, officerId, user.id);
      sendSuccess(res, { success: true });
    } catch (err: any) {
      if (err.message === "Report not found") {
        sendError(res, err.message, 404, "NOT_FOUND");
        return;
      }
      next(err);
    }
  },

  async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { message } = req.body;
      if (!message) {
        sendError(res, "message is required", 400, "VALIDATION_ERROR");
        return;
      }
      const result = await reportService.acknowledge(req.params.id as string, message, user.id);
      sendSuccess(res, result);
    } catch (err: any) {
      if (err.message === "Report not found") {
        sendError(res, err.message, 404, "NOT_FOUND");
        return;
      }
      next(err);
    }
  },

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { note } = req.body;
      if (!note) {
        sendError(res, "note is required", 400, "VALIDATION_ERROR");
        return;
      }
      const result = await reportService.addNote(req.params.id as string, note, user.id);
      sendSuccess(res, result);
    } catch (err: any) {
      if (err.message === "Report not found") {
        sendError(res, err.message, 404, "NOT_FOUND");
        return;
      }
      next(err);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getStats();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getScammerProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const data = await reportService.getScammerProfiles(
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getTopReportedEntities(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getTopReportedEntities();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
