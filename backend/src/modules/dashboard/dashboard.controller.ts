import type { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const dashboardController = {
  // NEW: single endpoint that returns everything in one round trip
  async all(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      // Run all 4 fast queries in parallel — insights returns rule-based instantly
      const [overview, history, timeline, insights, notifications] = await Promise.all([
        dashboardService.getOverview(user.id),
        dashboardService.getHistory(user.id),
        dashboardService.getTimeline(user.id, 7),
        dashboardService.getInsights(user.id),
        dashboardService.getNotifications(user.id),
      ]);
      sendSuccess(res, { overview, history, timeline, insights, notifications });
    } catch (err) { next(err); }
  },

  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await dashboardService.getOverview(user.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await dashboardService.getHistory(user.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async timeline(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const days = parseInt(req.query.days as string) || 7;
      const data = await dashboardService.getTimeline(user.id, days);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async insights(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await dashboardService.getInsights(user.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async notifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await dashboardService.getNotifications(user.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
