import { prisma } from "../../config/database.js";

/**
 * Normalizes a UPI ID to lowercase and trims whitespace.
 */
export function normalizeUpiId(upiId: string): string {
  return upiId.trim().toLowerCase();
}

export const upiReputationRepository = {
  /**
   * Fetches a UPI reputation record.
   */
  async getReputation(upiId: string) {
    const normalized = normalizeUpiId(upiId);
    return prisma.uPIReputation.findUnique({
      where: { upiId: normalized },
    });
  },

  /**
   * Upserts a UPI reputation record.
   */
  async upsertReputation(upiId: string, riskScore: number, reportCountDelta: number = 0) {
    const normalized = normalizeUpiId(upiId);
    const status = riskScore >= 80 ? "MALICIOUS" : riskScore >= 40 ? "SUSPICIOUS" : "CLEAN";

    const existing = await prisma.uPIReputation.findUnique({
      where: { upiId: normalized },
    });

    if (existing) {
      const newScore = Math.max(existing.riskScore, riskScore);
      const newStatus = newScore >= 80 ? "MALICIOUS" : newScore >= 40 ? "SUSPICIOUS" : "CLEAN";

      return prisma.uPIReputation.update({
        where: { upiId: normalized },
        data: {
          riskScore: newScore,
          reportCount: { increment: reportCountDelta },
          lastSeen: new Date(),
          status: newStatus,
        },
      });
    } else {
      return prisma.uPIReputation.create({
        data: {
          upiId: normalized,
          normalizedUpi: normalized,
          riskScore,
          reportCount: reportCountDelta,
          status,
          firstSeen: new Date(),
          lastSeen: new Date(),
        },
      });
    }
  },
};
