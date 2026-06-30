import type { Request, Response, NextFunction } from "express";
import { historyService } from "./history.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const historyController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { search, riskLevel, scanType, dateRange, sortBy, cursor, limit } = req.query;
      const data = await historyService.getHistory({
        userId: user.id,
        search: search as string,
        riskLevel: riskLevel as string,
        scanType: scanType as string,
        dateRange: dateRange as any,
        sortBy: sortBy as any,
        cursor: cursor as string,
        limit: limit ? parseInt(limit as string) : 20,
      });
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await historyService.getDetail(req.params.id as string, user.id);
      if (!data) { sendError(res, "Scan not found", 404, "NOT_FOUND"); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async trends(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await historyService.getTrends(user.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { search, riskLevel, scanType, dateRange, sortBy } = req.query;
      const data = await historyService.exportHistory({
        userId: user.id,
        search: search as string,
        riskLevel: riskLevel as string,
        scanType: scanType as string,
        dateRange: dateRange as any,
        sortBy: sortBy as any,
      });

      const format = req.query.format || "json";
      if (format === "csv") {
        const csv = "id,scanType,riskScore,riskLevel,summary,timestamp\n" +
          data.map((r) => `"${r.id}","${r.scanType}",${r.riskScore},"${r.riskLevel}","${r.summary.replace(/"/g, '""')}","${r.timestamp}"`).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=cybershield-history.csv");
        res.send(csv);
        return;
      }

      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
