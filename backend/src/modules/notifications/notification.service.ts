import { prisma } from "../../config/database.js";
import type { NotificationType, NotificationSeverity } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  actionUrl?: string;
  relatedId?: string;
}

export const notificationService = {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        severity: input.severity || "INFO",
        actionUrl: input.actionUrl,
        relatedId: input.relatedId,
      },
    });
  },

  async list(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type.toLowerCase(),
        title: n.title,
        message: n.message,
        severity: n.severity.toLowerCase(),
        isRead: n.isRead,
        actionUrl: n.actionUrl,
        relatedId: n.relatedId,
        timestamp: n.createdAt.toISOString(),
      })),
      unreadCount,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async markAsRead(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) return null;
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  },

  async remove(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) return null;
    return prisma.notification.delete({ where: { id } });
  },

  async getActivity(userId: string, page = 1, limit = 20, type?: string) {
    const offset = (page - 1) * limit;
    const where: any = { userId };

    // Filter by scan type if provided
    if (type === "scan") {
      where.type = { in: ["THREAT_ALERT", "SCAN_COMPLETE"] };
    } else if (type === "report") {
      where.type = "REPORT_UPDATE";
    } else if (type === "system") {
      where.type = { in: ["SYSTEM", "SECURITY_TIP"] };
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type.toLowerCase(),
        label: n.title,
        detail: n.message,
        severity: n.severity.toLowerCase(),
        timestamp: n.createdAt.toISOString(),
        actionUrl: n.actionUrl,
      })),
      pagination: { total, page, limit },
    };
  },

  // Helper: create scan notification
  async notifyScanComplete(userId: string, scanId: string, riskLevel: string, riskScore: number, scanType: string) {
    const isHighRisk = riskLevel === "HIGH" || riskLevel === "CRITICAL";
    await this.create({
      userId,
      type: isHighRisk ? "THREAT_ALERT" : "SCAN_COMPLETE",
      severity: isHighRisk ? "CRITICAL" : "INFO",
      title: isHighRisk ? `High-risk ${scanType.toLowerCase()} detected` : `${scanType.toLowerCase()} scan complete`,
      message: isHighRisk
        ? `Risk score: ${riskScore}/100. Immediate action recommended.`
        : `Scan completed with risk score ${riskScore}/100.`,
      actionUrl: `/scan/analysis`,
      relatedId: scanId,
    });
  },
};
