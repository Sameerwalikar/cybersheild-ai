import type { Request, Response, NextFunction } from "express";
import { graphService } from "./graph.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export const graphController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) { sendError(res, "Query must be at least 2 characters", 400); return; }
      const results = await graphService.searchEntity(query);
      sendSuccess(res, results);
    } catch (err) { next(err); }
  },

  async getNetwork(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await graphService.getEntityNetwork(req.params.id as string);
      if (!data) { sendError(res, "Entity not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await graphService.getStats();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async topEntities(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await graphService.getTopEntities(limit);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
