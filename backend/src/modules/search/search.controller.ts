import type { Request, Response, NextFunction } from "express";
import { searchService } from "./search.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export const searchController = {
  async globalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        sendError(res, "Query must be at least 2 characters", 400, "VALIDATION_ERROR");
        return;
      }

      const filters: any = {};
      if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
      if (req.query.threatLevel) filters.threatLevel = req.query.threatLevel;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.category) filters.category = req.query.category;
      if (req.query.investigationStatus) filters.investigationStatus = req.query.investigationStatus;

      const limit = parseInt(req.query.limit as string) || 10;

      const results = await searchService.globalSearch({ query: query.trim(), filters, limit });
      sendSuccess(res, results);
    } catch (err) {
      next(err);
    }
  },
};
