import { BaseAdapter } from "./BaseAdapter.js";
import { IPEntity } from "../types/IPEntity.js";
import { PrismaClient } from "@prisma/client";

export class InternalTelemetryAdapter extends BaseAdapter {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super("Internal Telemetry");
    this.prisma = prisma;
  }

  protected async enrichImpl(ip: string): Promise<Partial<IPEntity>> {
    try {
      const record = await this.prisma.iPHistory.findUnique({
        where: { ip },
      });

      if (record) {
        return {
          internal: {
            cybershield_report_count: record.count,
            first_seen: record.firstSeen,
            last_seen: record.lastSeen,
          },
        };
      } else {
        return {
          internal: {
            cybershield_report_count: 0,
            first_seen: new Date(),
            last_seen: new Date(),
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }

  public async recordSighting(ip: string): Promise<void> {
    try {
      await this.prisma.iPHistory.upsert({
        where: { ip },
        update: {
          lastSeen: new Date(),
          count: { increment: 1 },
        },
        create: {
          ip,
          firstSeen: new Date(),
          lastSeen: new Date(),
          count: 1,
        },
      });
    } catch (error: any) {
      console.error(
        `[InternalTelemetryAdapter] Error recording sighting:`,
        error.message
      );
    }
  }
}
