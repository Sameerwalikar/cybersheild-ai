import type { Request, Response } from "express";
import { breachCheckService } from "./breach-check.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export const breachCheckController = {
  async checkEmail(req: Request, res: Response) {
    const { email } = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await breachCheckService.checkEmail(email, userId, ipAddress);

    sendSuccess(res, result);
  },
};
