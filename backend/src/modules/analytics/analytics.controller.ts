import type { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export const analyticsController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getDashboard();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async trends(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getTrends();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async topIndicators(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getTopIndicators();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async activityFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const data = await analyticsService.getActivityFeed(limit);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async repeatScammers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await analyticsService.getRepeatScammers(page, limit);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async scammerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getScammerById(req.params.id as string);
      if (!data) { sendError(res, "Scammer not found", 404, "NOT_FOUND"); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async scammerTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getScammerTimeline(req.params.id as string);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async scammerSimilar(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getScammerSimilar(req.params.id as string);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async threatMap(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getThreatMap();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
