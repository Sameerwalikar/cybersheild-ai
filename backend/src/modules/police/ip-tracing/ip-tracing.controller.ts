import { Request, Response } from "express";
import net from "net";
import { prisma } from "../../../config/index.js";
import { IpTracingService } from "./ip-tracing.service.js";
import { AbuseIPDBAdapter } from "./adapters/AbuseIPDBAdapter.js";
import { sendSuccess, sendError } from "../../../utils/response.js";

export class IpTracingController {
  private ipTracingService: IpTracingService;
  private abuseIPDBAdapter: AbuseIPDBAdapter;

  constructor(ipTracingService: IpTracingService, abuseIPDBAdapter: AbuseIPDBAdapter) {
    this.ipTracingService = ipTracingService;
    this.abuseIPDBAdapter = abuseIPDBAdapter;
  }

  public getRiskProfile = async (req: Request, res: Response): Promise<void> => {
    const ip = req.params.ip as string;
    const bypassCache = req.query.bypassCache === "true";

    if (!net.isIP(ip)) {
      sendError(res, "Invalid IP address format", 400);
      return;
    }

    try {
      const profile = await this.ipTracingService.getRiskProfile(ip, bypassCache);

      // Save audit log to database
      await prisma.ipLookupAudit.create({
        data: {
          ip,
          lookedUpBy: (req as any).user?.email || "officer@cybershield.in",
          riskScore: profile.risk_score || 0,
        },
      });

      sendSuccess(res, profile);
    } catch (error: any) {
      console.error("[IpTracingController] Error getting risk profile:", error.message);
      sendError(res, "Internal Server Error", 500);
    }
  };

  public addToList = async (req: Request, res: Response): Promise<void> => {
    const ip = req.params.ip as string;
    const { list_type, note } = req.body;

    if (!net.isIP(ip)) {
      sendError(res, "Invalid IP address format", 400);
      return;
    }

    try {
      const result = await prisma.ipList.create({
        data: {
          ip,
          listType: list_type,
          note,
          addedBy: (req as any).user?.email || "officer@cybershield.in",
        },
      });
      sendSuccess(res, result);
    } catch (error: any) {
      console.error("[IpTracingController] Error adding to list:", error.message);
      sendError(res, "Internal Server Error", 500);
    }
  };

  public getQuotas = async (req: Request, res: Response): Promise<void> => {
    try {
      sendSuccess(res, {
        abuseIPDB: this.abuseIPDBAdapter.getQuota(),
      });
    } catch (error: any) {
      console.error("[IpTracingController] Error getting quotas:", error.message);
      sendError(res, "Internal Server Error", 500);
    }
  };
}
