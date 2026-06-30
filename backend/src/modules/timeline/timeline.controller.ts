import type { Request, Response, NextFunction } from "express";
import { timelineService } from "./timeline.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const timelineController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { type, severity, days, cursor, limit } = req.query;
      // Citizens see only their events, Police see all
      const actorId = user.role === "POLICE" ? undefined : user.id;
      const data = await timelineService.list({
        actorId,
        type: type as string,
        severity: severity as string,
        days: days ? parseInt(days as string) : undefined,
        cursor: cursor as string,
        limit: limit ? parseInt(limit as string) : 30,
      });
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await timelineService.getGlobalStats();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
