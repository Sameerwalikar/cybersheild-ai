import { prisma } from "../../config/database.js";

interface CreateEventInput {
  type: string;
  actorType?: string;
  actorId?: string;
  title: string;
  description?: string;
  severity?: string;
  metadata?: any;
  relatedAnalysis?: string;
  relatedIncident?: string;
  relatedEvidence?: string;
  relatedReport?: string;
}

export const timelineService = {
  async publish(input: CreateEventInput) {
    return prisma.timelineEvent.create({
      data: {
        type: input.type,
        actorType: input.actorType || "user",
        actorId: input.actorId,
        title: input.title,
        description: input.description,
        severity: input.severity || "info",
        metadata: input.metadata || undefined,
        relatedAnalysis: input.relatedAnalysis,
        relatedIncident: input.relatedIncident,
        relatedEvidence: input.relatedEvidence,
        relatedReport: input.relatedReport,
      },
    }).catch(() => null); // Never fail the parent operation
  },

  async list(params: { actorId?: string; type?: string; severity?: string; days?: number; cursor?: string; limit?: number }) {
    const { actorId, type, severity, days, cursor, limit = 30 } = params;
    const where: any = {};

    if (actorId) where.actorId = actorId;
    if (type && type !== "all") where.type = type;
    if (severity && severity !== "all") where.severity = severity;
    if (days) where.createdAt = { gte: new Date(Date.now() - days * 86400000) };

    const cursorObj = cursor ? { id: cursor } : undefined;

    const items = await prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursorObj ? { cursor: cursorObj, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;

    return {
      items: results.map((e) => ({
        id: e.id,
        type: e.type,
        actorType: e.actorType,
        title: e.title,
        description: e.description,
        severity: e.severity,
        timestamp: e.createdAt.toISOString(),
        relatedAnalysis: e.relatedAnalysis,
        relatedIncident: e.relatedIncident,
        relatedEvidence: e.relatedEvidence,
        relatedReport: e.relatedReport,
      })),
      hasMore,
      nextCursor: hasMore ? results[results.length - 1].id : null,
    };
  },

  async getGlobalStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalToday, totalWeek, byType] = await Promise.all([
      prisma.timelineEvent.count({ where: { createdAt: { gte: today } } }),
      prisma.timelineEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      prisma.timelineEvent.groupBy({ by: ["type"], _count: { id: true }, where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    ]);

    return { totalToday, totalWeek, byType: byType.map((t) => ({ type: t.type, count: t._count.id })) };
  },
};
