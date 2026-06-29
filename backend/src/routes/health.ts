import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  let dbStatus = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  res.status(dbStatus === "connected" ? 200 : 503).json({
    success: true,
    data: {
      status: "running",
      database: dbStatus,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export const healthRouter = router;
