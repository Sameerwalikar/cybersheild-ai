import { prisma } from "../../config/database.js";
import type {
  ThreatIntelligenceReport,
  EngineRiskScore,
} from "../../services/threat-intelligence/types.js";

/**
 * Persists threat intel findings into existing Prisma models.
 * Uses RiskScore (already in schema) and SavedWebsite (already in schema).
 * Does NOT modify the schema.
 */
export async function persistIntelEnrichment(
  analysisId: string,
  url: string,
  intel: ThreatIntelligenceReport,
  engineScore: EngineRiskScore,
): Promise<void> {
  await Promise.all([
    upsertRiskScore(analysisId, intel, engineScore),
    upsertSavedWebsite(analysisId, url, intel),
  ]);
}

async function upsertRiskScore(
  analysisId: string,
  intel: ThreatIntelligenceReport,
  engineScore: EngineRiskScore,
): Promise<void> {
  try {
    // Break score into component dimensions for the RiskScore model
    const vtMalicious    = intel.virusTotal?.maliciousCount ?? 0;
    const gsbDetected    = intel.google?.detected ? 1 : 0;
    const domainAgeDays  = intel.rdap?.ageInDays ?? 999;

    const contentRisk  = Math.min(100, gsbDetected * 60 + Math.min(vtMalicious * 8, 40));
    const sourceRisk   = Math.min(100, domainAgeDays < 7 ? 80 : domainAgeDays < 30 ? 50 : 10);
    const patternRisk  = Math.min(100, engineScore.score);
    const communityRisk = Math.min(
      100,
      Math.max(0, 50 - (intel.virusTotal?.communityScore ?? 0)),
    );

    await prisma.riskScore.upsert({
      where:  { analysisId },
      create: {
        analysisId,
        overall:      engineScore.score,
        contentRisk,
        sourceRisk,
        patternRisk,
        communityRisk,
        factors:      engineScore.reasons,
      },
      update: {
        overall:      engineScore.score,
        contentRisk,
        sourceRisk,
        patternRisk,
        communityRisk,
        factors:      engineScore.reasons,
        calculatedAt: new Date(),
      },
    });
  } catch (err: any) {
    console.error("[Enrichment] RiskScore upsert failed:", err.message);
  }
}

async function upsertSavedWebsite(
  analysisId: string,
  url: string,
  intel: ThreatIntelligenceReport,
): Promise<void> {
  try {
    const rdap   = intel.rdap;
    const domain = rdap?.domain ?? extractDomain(url);
    const vtRep  = intel.virusTotal
      ? Math.max(-100, Math.min(100, intel.virusTotal.communityScore))
      : null;

    const domainAgeStr = rdap?.ageInDays !== null && rdap?.ageInDays !== undefined
      ? `${rdap.ageInDays} days`
      : null;

    await prisma.savedWebsite.upsert({
      where:  { analysisId },
      create: {
        analysisId,
        url,
        domain,
        sslValid:     url.startsWith("https://"),
        domainAge:    domainAgeStr,
        reputation:   vtRep,
      },
      update: {
        url,
        domain,
        sslValid:     url.startsWith("https://"),
        domainAge:    domainAgeStr,
        reputation:   vtRep,
        lastChecked:  new Date(),
      },
    });
  } catch (err: any) {
    console.error("[Enrichment] SavedWebsite upsert failed:", err.message);
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 253);
  }
}
