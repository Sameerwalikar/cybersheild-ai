import { graphRepository } from "./graph.repository.js";
import { extractEntities, type ExtractedEntity } from "./entity-extractor.js";
import type { GraphEntityType, RiskLevel } from "@prisma/client";

export const graphService = {
  /**
   * Process a completed scan: extract entities, create/update nodes, create edges.
   */
  async processScan(scanId: string, content: string, riskLevel: string) {
    const entities = extractEntities(content);
    if (entities.length === 0) return;

    const prismaRiskLevel = riskLevel.toUpperCase() as RiskLevel;
    const nodeIds: string[] = [];

    // Create/update nodes
    for (const entity of entities) {
      const node = await graphRepository.upsertNode(
        entity.type as GraphEntityType,
        entity.value,
        entity.normalized,
        prismaRiskLevel
      );
      nodeIds.push(node.id);
    }

    // Create edges between co-occurring entities
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        await graphRepository.createEdge(nodeIds[i], nodeIds[j], "APPEARS_WITH", scanId);
      }
    }
  },

  /**
   * Search for an entity and return its network neighbors.
   */
  async searchEntity(query: string) {
    const nodes = await graphRepository.searchNodes(query, 20);
    return nodes.map((n) => ({
      id: n.id,
      type: n.entityType.toLowerCase(),
      value: n.value,
      occurrences: n.occurrences,
      riskLevel: n.riskLevel.toLowerCase(),
      firstSeen: n.firstSeen.toISOString(),
      lastSeen: n.lastSeen.toISOString(),
    }));
  },

  /**
   * Get a node with its immediate connections (max 100 neighbors).
   */
  async getEntityNetwork(nodeId: string) {
    const node = await graphRepository.getNodeById(nodeId);
    if (!node) return null;

    const nodes: any[] = [{
      id: node.id,
      type: node.entityType.toLowerCase(),
      value: node.value,
      occurrences: node.occurrences,
      riskLevel: node.riskLevel.toLowerCase(),
    }];

    const edges: any[] = [];
    const seenNodes = new Set([node.id]);

    for (const edge of node.edgesFrom) {
      if (!seenNodes.has(edge.toNode.id)) {
        seenNodes.add(edge.toNode.id);
        nodes.push({
          id: edge.toNode.id,
          type: edge.toNode.entityType.toLowerCase(),
          value: edge.toNode.value,
          occurrences: edge.toNode.occurrences,
          riskLevel: edge.toNode.riskLevel.toLowerCase(),
        });
      }
      edges.push({ id: edge.id, source: edge.fromNodeId, target: edge.toNodeId, type: edge.edgeType, weight: edge.weight });
    }

    for (const edge of node.edgesTo) {
      if (!seenNodes.has(edge.fromNode.id)) {
        seenNodes.add(edge.fromNode.id);
        nodes.push({
          id: edge.fromNode.id,
          type: edge.fromNode.entityType.toLowerCase(),
          value: edge.fromNode.value,
          occurrences: edge.fromNode.occurrences,
          riskLevel: edge.fromNode.riskLevel.toLowerCase(),
        });
      }
      edges.push({ id: edge.id, source: edge.fromNodeId, target: edge.toNodeId, type: edge.edgeType, weight: edge.weight });
    }

    return { nodes: nodes.slice(0, 100), edges: edges.slice(0, 200) };
  },

  /**
   * Get overall graph statistics.
   */
  async getStats() {
    return graphRepository.getGraphStats();
  },

  /**
   * Get the most connected entities.
   */
  async getTopEntities(limit = 20) {
    const nodes = await graphRepository.getTopNodes(limit);
    return nodes.map((n) => ({
      id: n.id,
      type: n.entityType.toLowerCase(),
      value: n.value,
      occurrences: n.occurrences,
      riskLevel: n.riskLevel.toLowerCase(),
      lastSeen: n.lastSeen.toISOString(),
    }));
  },
};
