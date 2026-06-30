import type { Request, Response, NextFunction } from "express";
import { policeService } from "./police.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const policeController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await policeService.getDashboard();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async investigations(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const data = await policeService.getInvestigations(status as string, parseInt(page as string) || 1, parseInt(limit as string) || 20);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async investigation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await policeService.getInvestigation(req.params.id as string);
      if (!data) { sendError(res, "Investigation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async networks(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const data = await policeService.getFraudNetworks(parseInt(page as string) || 1, parseInt(limit as string) || 10);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async analytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await policeService.getAnalytics();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
