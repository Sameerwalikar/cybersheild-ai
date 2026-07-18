import type { VirusTotalResult } from "./types.js";

const VT_API_BASE = "https://www.virustotal.com/api/v3";
const TIMEOUT_MS  = 12_000;

/**
 * VirusTotalProvider
 *
 * Sole responsibility: query the VirusTotal URL reputation API.
 * Returns a normalised result — never exposes raw VT JSON.
 * Degrades gracefully on any failure.
 */
export class VirusTotalProvider {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.VIRUSTOTAL_API_KEY || "";
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async checkUrl(url: string): Promise<VirusTotalResult> {
    if (!this.isConfigured) {
      return this.degraded("API key not configured");
    }

    if (!this.isValidUrl(url)) {
      return this.degraded("Invalid URL");
    }

    try {
      // VT URL lookup uses base64url-encoded URL as identifier (no padding)
      const urlId = Buffer.from(url).toString("base64url").replace(/=+$/, "");
      const endpoint = `${VT_API_BASE}/urls/${urlId}`;

      const res = await this.fetch(endpoint);

      if (res.status === 404) {
        // URL not in VT database — treat as unanalysed, not safe
        return this.unanalysed();
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 429) return this.degraded("Rate limit exceeded");
        if (res.status === 401) return this.degraded("Invalid API key");
        return this.degraded(`HTTP ${res.status}: ${text.slice(0, 100)}`);
      }

      const data: any = await res.json();
      return this.normalise(data);
    } catch (err: any) {
      if (err.name === "AbortError") return this.degraded("Request timeout");
      console.error("[VT] Unexpected error:", err.message);
      return this.degraded(err.message || "Network error");
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────

  private async fetch(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await globalThis.fetch(url, {
        headers: { "x-apikey": this.apiKey, Accept: "application/json" },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private normalise(data: any): VirusTotalResult {
    const attrs        = data?.data?.attributes ?? {};
    const stats        = attrs?.last_analysis_stats ?? {};
    const votes        = attrs?.total_votes ?? {};
    const categories   = attrs?.categories ?? {};

    const maliciousCount   = Number(stats.malicious   ?? 0);
    const suspiciousCount  = Number(stats.suspicious  ?? 0);
    const harmlessCount    = Number(stats.harmless    ?? 0);
    const undetectedCount  = Number(stats.undetected  ?? 0);

    // Community score: positive votes = trustworthy, negative = malicious
    const harmlessVotes  = Number(votes.harmless  ?? 0);
    const maliciousVotes = Number(votes.malicious ?? 0);
    const communityScore = harmlessVotes - maliciousVotes;

    // Flatten category map (vendor → category string)
    const categoryList: string[] = [...new Set<string>(Object.values(categories) as string[])];

    // Last analysis timestamp
    const lastAnalysisTs: number | null = attrs?.last_analysis_date ?? null;
    const lastAnalysisDate = lastAnalysisTs
      ? new Date(lastAnalysisTs * 1000).toISOString()
      : null;

    return {
      maliciousCount,
      suspiciousCount,
      harmlessCount,
      undetectedCount,
      communityScore,
      categories: categoryList,
      lastAnalysisDate,
      provider: "virustotal",
    };
  }

  private unanalysed(): VirusTotalResult {
    return {
      maliciousCount:  0,
      suspiciousCount: 0,
      harmlessCount:   0,
      undetectedCount: 0,
      communityScore:  0,
      categories:      [],
      lastAnalysisDate: null,
      provider:        "virustotal",
    };
  }

  private degraded(error: string): VirusTotalResult {
    return {
      maliciousCount:  0,
      suspiciousCount: 0,
      harmlessCount:   0,
      undetectedCount: 0,
      communityScore:  0,
      categories:      [],
      lastAnalysisDate: null,
      provider:        "virustotal",
      error,
    };
  }

  private isValidUrl(url: string): boolean {
    try { new URL(url); return true; } catch { return false; }
  }
}
