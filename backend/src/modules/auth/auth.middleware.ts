import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { sendError } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    sendError(res, "Access token required", 401, "UNAUTHORIZED");
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: string };
    (req as AuthenticatedRequest).user = {
      id: payload.id,
      email: payload.email,
      role: payload.role as "CITIZEN" | "POLICE" | "ORGANIZATION",
    };
    next();
  } catch {
    sendError(res, "Invalid or expired access token", 401, "UNAUTHORIZED");
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      sendError(res, "Not authenticated", 401, "UNAUTHORIZED");
      return;
    }
    if (!roles.includes(user.role)) {
      sendError(res, "Insufficient permissions", 403, "FORBIDDEN");
      return;
    }
    next();
  };
}
