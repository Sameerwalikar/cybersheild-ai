import type { Request, Response, NextFunction } from "express";
import { incidentService } from "./incident.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const incidentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, assignedTo, page, limit } = req.query;
      const data = await incidentService.list({ status: status as string, priority: priority as string, assignedTo: assignedTo as string, page: parseInt(page as string) || 1, limit: parseInt(limit as string) || 20 });
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await incidentService.getById(req.params.id as string);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { title, description, priority, severity, relatedReportIds, relatedScanIds, relatedNodeIds } = req.body;
      if (!title) { sendError(res, "Title is required", 400); return; }
      const data = await incidentService.create({ title, description, priority, severity, createdBy: user.id, relatedReportIds, relatedScanIds, relatedNodeIds });
      sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await incidentService.update(req.params.id as string, req.body, user.id);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { status } = req.body;
      if (!status) { sendError(res, "Status is required", 400); return; }
      const data = await incidentService.updateStatus(req.params.id as string, status, user.id);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err: any) {
      if (err.message?.includes("Invalid status")) { sendError(res, err.message, 400); return; }
      next(err);
    }
  },

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { officerId } = req.body;
      if (!officerId) { sendError(res, "officerId is required", 400); return; }
      const data = await incidentService.assign(req.params.id as string, officerId, user.id);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { content } = req.body;
      if (!content) { sendError(res, "content is required", 400); return; }
      const result = await incidentService.addNote(req.params.id as string, content, user.id);
      if (!result) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async linkReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { reportId } = req.body;
      if (!reportId) { sendError(res, "reportId is required", 400); return; }
      const data = await incidentService.linkReport(req.params.id as string, reportId, user.id);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async unlinkReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { reportId } = req.body;
      if (!reportId) { sendError(res, "reportId is required", 400); return; }
      const data = await incidentService.unlinkReport(req.params.id as string, reportId, user.id);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async linkEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { nodeIds } = req.body;
      if (!nodeIds || !Array.isArray(nodeIds)) { sendError(res, "nodeIds array is required", 400); return; }
      const data = await incidentService.linkEvidence(req.params.id as string, nodeIds, user.id);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async merge(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { sourceId } = req.body;
      if (!sourceId) { sendError(res, "sourceId is required", 400); return; }
      const data = await incidentService.merge(req.params.id as string, sourceId, user.id);
      sendSuccess(res, data);
    } catch (err: any) {
      if (err.message === "Investigation not found") { sendError(res, err.message, 404); return; }
      next(err);
    }
  },

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { resolutionSummary } = req.body;
      if (!resolutionSummary) { sendError(res, "resolutionSummary is required", 400); return; }
      const data = await incidentService.close(req.params.id as string, resolutionSummary, user.id);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async timeline(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await incidentService.getTimeline(req.params.id as string);
      sendSuccess(res, events.map((e) => ({ id: e.id, type: e.eventType, description: e.description, actorId: e.actorId, timestamp: e.createdAt.toISOString() })));
    } catch (err) { next(err); }
  },

  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await incidentService.getStats();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
