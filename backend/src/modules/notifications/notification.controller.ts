import type { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await notificationService.list(user.id, page, limit);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await notificationService.markAsRead(req.params.id as string, user.id);
      if (!result) { sendError(res, "Notification not found", 404); return; }
      sendSuccess(res, { id: result.id, isRead: true });
    } catch (err) { next(err); }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await notificationService.markAllRead(user.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const result = await notificationService.remove(req.params.id as string, user.id);
      if (!result) { sendError(res, "Notification not found", 404); return; }
      sendSuccess(res, { message: "Deleted" });
    } catch (err) { next(err); }
  },

  async activity(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string | undefined;
      const data = await notificationService.getActivity(user.id, page, limit, type);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },
};
