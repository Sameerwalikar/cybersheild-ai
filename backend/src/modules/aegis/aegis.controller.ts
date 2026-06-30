import type { Request, Response, NextFunction } from "express";
import { aegisService } from "./aegis.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const aegisController = {
  async listConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await aegisService.getConversations(user.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const data = await aegisService.getConversation(req.params.id as string, user.id);
      if (!data) { sendError(res, "Conversation not found", 404); return; }
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { message, conversationId } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        sendError(res, "Message is required", 400, "VALIDATION_ERROR");
        return;
      }
      const data = await aegisService.chat(user.id, conversationId || null, message.trim());
      sendSuccess(res, data);
    } catch (err: any) {
      console.error("AEGIS chat error:", err.message || err);
      next(err);
    }
  },

  async deleteConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      await aegisService.deleteConversation(req.params.id as string, user.id);
      sendSuccess(res, { message: "Conversation deleted" });
    } catch (err) { next(err); }
  },

  async renameConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user!;
      const { title } = req.body;
      if (!title) { sendError(res, "Title required", 400); return; }
      await aegisService.renameConversation(req.params.id as string, user.id, title);
      sendSuccess(res, { message: "Renamed" });
    } catch (err) { next(err); }
  },
};
