import type { Response } from "express";
import type { ApiResponse } from "../types/index.js";

export function sendSuccess<T>(res: Response, data: T, status = 200, meta?: ApiResponse["meta"]): void {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.status(status).json(response);
}

export function sendError(res: Response, message: string, status = 500, code?: string): void {
  const response: ApiResponse = { success: false, error: message };
  if (code) response.code = code;
  res.status(status).json(response);
}
