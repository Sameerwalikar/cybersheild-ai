import { prisma } from "../../config/database.js";
import type { GraphEntityType, RiskLevel } from "@prisma/client";

export const graphRepository = {
  async upsertNode(entityType: GraphEntityType, value: string, normalizedVal: string, riskLevel: RiskLevel) {
    return prisma.graphNode.upsert({
      where: { entityType_normalizedVal: { entityType, normalizedVal } },
      create: { entityType, value, normalizedVal, riskLevel, occurrences: 1 },
      update: { occurrences: { increment: 1 }, lastSeen: new Date(), riskLevel },
    });
  },

  async createEdge(fromNodeId: string, toNodeId: string, edgeType: string, scanId?: string) {
    // Check if edge already exists
    const existing = await prisma.graphEdge.findFirst({
      where: { fromNodeId, toNodeId, edgeType },
    });
    if (existing) {
      return prisma.graphEdge.update({
        where: { id: existing.id },
        data: { weight: { increment: 1 } },
      });
    }
    return prisma.graphEdge.create({
      data: { fromNodeId, toNodeId, edgeType, scanId },
    });
  },

  async getNodeWithNeighbors(entityType: GraphEntityType, normalizedVal: string, maxNodes = 100) {
    const node = await prisma.graphNode.findUnique({
      where: { entityType_normalizedVal: { entityType, normalizedVal } },
      include: {
        edgesFrom: { include: { toNode: true }, take: maxNodes },
        edgesTo: { include: { fromNode: true }, take: maxNodes },
      },
    });
    return node;
  },

  async getNodeById(id: string) {
    return prisma.graphNode.findUnique({
      where: { id },
      include: {
        edgesFrom: { include: { toNode: true }, take: 50 },
        edgesTo: { include: { fromNode: true }, take: 50 },
      },
    });
  },

  async searchNodes(query: string, limit = 20) {
    return prisma.graphNode.findMany({
      where: { normalizedVal: { contains: query.toLowerCase(), mode: "insensitive" } },
      orderBy: { occurrences: "desc" },
      take: limit,
    });
  },

  async getNetworkForScan(scanId: string) {
    const edges = await prisma.graphEdge.findMany({
      where: { scanId },
      include: { fromNode: true, toNode: true },
    });
    return edges;
  },

  async getTopNodes(limit = 20) {
    return prisma.graphNode.findMany({
      orderBy: { occurrences: "desc" },
      take: limit,
      where: { occurrences: { gt: 1 } },
    });
  },

  async getGraphStats() {
    const [nodeCount, edgeCount, highRiskNodes] = await Promise.all([
      prisma.graphNode.count(),
      prisma.graphEdge.count(),
      prisma.graphNode.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
    ]);
    return { nodeCount, edgeCount, highRiskNodes };
  },
};
