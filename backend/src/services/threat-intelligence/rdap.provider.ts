import type { RdapResult } from "./types.js";

const RDAP_BASE   = "https://rdap.org/domain";
const TIMEOUT_MS  = 8_000;

/**
 * RdapProvider
 *
 * Sole responsibility: query RDAP (Registration Data Access Protocol).
 * No API key required. Uses the public rdap.org bootstrap service.
 *
 * Extracts: domain, registrar, registration date, expiration date,
 *           status flags, and calculates domain age.
 */
export class RdapProvider {
  async checkDomain(domain: string): Promise<RdapResult> {
    const normalised = this.normaliseDomain(domain);
    if (!normalised) {
      return this.degraded(domain, "Could not extract domain from input");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${RDAP_BASE}/${normalised}`, {
        headers: { Accept: "application/json" },
        signal:  controller.signal,
      });

      if (res.status === 404) {
        return this.degraded(normalised, "Domain not found in RDAP");
      }

      if (!res.ok) {
        return this.degraded(normalised, `HTTP ${res.status}`);
      }

      const data: any = await res.json();
      return this.normalise(normalised, data);
    } catch (err: any) {
      if (err.name === "AbortError") return this.degraded(normalised, "Request timeout");
      // RDAP registry may not support the TLD — treat as graceful
      return this.degraded(normalised, `RDAP lookup failed: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────

  private normalise(domain: string, data: any): RdapResult {
    const events: any[]   = data?.events ?? [];
    const entities: any[] = data?.entities ?? [];
    const statusArr: any[] = data?.status ?? [];

    // Extract key event dates
    const registrationDate = this.extractEventDate(events, "registration");
    const expirationDate   = this.extractEventDate(events, "expiration");

    // Calculate age in days
    const ageInDays = registrationDate
      ? Math.floor((Date.now() - new Date(registrationDate).getTime()) / 86_400_000)
      : null;

    // Registrar — found in entities with role "registrar"
    const registrarEntity = entities.find((e: any) =>
      Array.isArray(e.roles) && e.roles.includes("registrar"),
    );
    const registrar: string | null =
      registrarEntity?.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3] ??
      registrarEntity?.publicIds?.[0]?.identifier ??
      null;

    // Status flags
    const status: string[] = Array.isArray(statusArr) ? statusArr : [];

    return {
      domain,
      registrar,
      registrationDate,
      expirationDate,
      status,
      ageInDays,
      isNewDomain:     ageInDays !== null && ageInDays < 30,
      isVeryNewDomain: ageInDays !== null && ageInDays < 7,
      provider:        "rdap",
    };
  }

  private extractEventDate(events: any[], action: string): string | null {
    const ev = events.find(
      (e: any) => typeof e.eventAction === "string" &&
        e.eventAction.toLowerCase().includes(action),
    );
    return ev?.eventDate ?? null;
  }

  /** Extract the registrable domain (e.g. "evil.sbi-login.xyz" → "sbi-login.xyz"). */
  private normaliseDomain(input: string): string | null {
    try {
      // Accept full URLs or bare domains
      const withScheme = input.startsWith("http") ? input : `https://${input}`;
      const { hostname } = new URL(withScheme);
      if (!hostname || hostname.match(/^\d{1,3}(\.\d{1,3}){3}$/)) return null; // skip IPs

      // Take last two labels (apex domain)
      const parts = hostname.replace(/^www\./, "").split(".");
      if (parts.length < 2) return null;
      return parts.slice(-2).join(".");
    } catch {
      return null;
    }
  }

  private degraded(domain: string, error: string): RdapResult {
    return {
      domain,
      registrar:        null,
      registrationDate: null,
      expirationDate:   null,
      status:           [],
      ageInDays:        null,
      isNewDomain:      false,
      isVeryNewDomain:  false,
      provider:         "rdap",
      error,
    };
  }
}
