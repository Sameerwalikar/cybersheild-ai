import type { GoogleSafeBrowsingResult } from "./types.js";

const GSB_API_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const TIMEOUT_MS  = 8_000;

/**
 * GoogleSafeBrowsingProvider
 *
 * Sole responsibility: query the Google Safe Browsing v4 API.
 * Returns a normalised result — never exposes raw Google JSON.
 * Degrades gracefully on any failure.
 */
export class GoogleSafeBrowsingProvider {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY || "";
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async checkUrl(url: string): Promise<GoogleSafeBrowsingResult> {
    if (!this.isConfigured) {
      return { detected: false, threatTypes: [], provider: "google", error: "API key not configured" };
    }

    if (!this.isValidUrl(url)) {
      return { detected: false, threatTypes: [], provider: "google", error: "Invalid URL" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const body = {
        client:    { clientId: "cybershield-ai", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes:      ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes:    ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries:    [{ url }],
        },
      };

      const res = await fetch(`${GSB_API_URL}?key=${this.apiKey}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
        signal:  controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 429) return this.degraded("Rate limit exceeded");
        if (res.status === 400) return this.degraded("Bad request to Safe Browsing API");
        return this.degraded(`HTTP ${res.status}: ${text.slice(0, 100)}`);
      }

      const data: any = await res.json();

      // Empty matches object means the URL is clean
      if (!data.matches || data.matches.length === 0) {
        return { detected: false, threatTypes: [], provider: "google" };
      }

      const threatTypes: string[] = [...new Set<string>(
        data.matches.map((m: any) => m.threatType as string),
      )];

      return { detected: true, threatTypes, provider: "google" };
    } catch (err: any) {
      if (err.name === "AbortError") return this.degraded("Request timeout");
      console.error("[GSB] Unexpected error:", err.message);
      return this.degraded(err.message || "Network error");
    } finally {
      clearTimeout(timer);
    }
  }

  private degraded(error: string): GoogleSafeBrowsingResult {
    return { detected: false, threatTypes: [], provider: "google", error };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
