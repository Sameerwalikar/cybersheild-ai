import { GoogleSafeBrowsingProvider } from "./googleSafeBrowsing.provider.js";
import { VirusTotalProvider          } from "./virusTotal.provider.js";
import { RdapProvider                } from "./rdap.provider.js";
import type {
  ThreatIntelligenceReport,
  GoogleSafeBrowsingResult,
  VirusTotalResult,
  RdapResult,
} from "./types.js";

/**
 * ThreatIntelligenceService
 *
 * Coordinates all three external providers in parallel.
 * No provider knows another exists.
 * Applies only to URL / QR scans — silently skips for other scan types.
 */
export class ThreatIntelligenceService {
  private readonly gsb         = new GoogleSafeBrowsingProvider();
  private readonly virusTotal  = new VirusTotalProvider();
  private readonly rdap        = new RdapProvider();

  /**
   * Run Google Safe Browsing, VirusTotal, and RDAP in parallel.
   * Any individual provider failure returns null for that slot — never throws.
   */
  async enrichUrl(url: string): Promise<ThreatIntelligenceReport> {
    const [google, virusTotalResult, rdapResult] = await Promise.all([
      this.safeGsb(url),
      this.safeVirusTotal(url),
      this.safeRdap(url),
    ]);

    return { google, virusTotal: virusTotalResult, rdap: rdapResult };
  }

  /** Returns null when the scan type is not URL-based */
  isApplicable(scanType: string): boolean {
    return scanType === "URL" || scanType === "QR";
  }

  // ─── Per-provider safe wrappers ──────────────────────────────────────

  private async safeGsb(url: string): Promise<GoogleSafeBrowsingResult | null> {
    if (!this.gsb.isConfigured) return null;
    try {
      return await this.gsb.checkUrl(url);
    } catch (err: any) {
      console.error("[ThreatIntel] GSB failed:", err.message);
      return null;
    }
  }

  private async safeVirusTotal(url: string): Promise<VirusTotalResult | null> {
    if (!this.virusTotal.isConfigured) return null;
    try {
      return await this.virusTotal.checkUrl(url);
    } catch (err: any) {
      console.error("[ThreatIntel] VirusTotal failed:", err.message);
      return null;
    }
  }

  private async safeRdap(url: string): Promise<RdapResult | null> {
    try {
      return await this.rdap.checkDomain(url);
    } catch (err: any) {
      console.error("[ThreatIntel] RDAP failed:", err.message);
      return null;
    }
  }
}

// Singleton — reuse HTTP connections
export const threatIntelligenceService = new ThreatIntelligenceService();
