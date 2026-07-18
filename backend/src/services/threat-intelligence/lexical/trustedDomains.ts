import { extractRegisteredDomain } from "./registeredDomainExtractor.js";

// ─── TRUSTED DOMAIN LIST ──────────────────────────────────────────────────────
// Configurable and extendable set of known trusted organization domains.

export const TRUSTED_DOMAINS = new Set([
  // Global Tech / Platforms
  "google.com",
  "google.in",
  "gmail.com",
  "github.com",
  "microsoft.com",
  "apple.com",
  "amazon.com",
  "amazon.in",
  "openai.com",
  "linkedin.com",
  "cloudflare.com",
  "meta.com",
  "facebook.com",
  "instagram.com",
  "yahoo.com",
  "outlook.com",
  "wikipedia.org",

  // Finance / Payments / Banking
  "paytm.com",
  "phonepe.com",
  "npci.org.in", // UPI, NPCI
  "icicibank.com",
  "sbi.co.in",
  "axisbank.com",
  "hdfcbank.com",
  "kotak.com",
]);

/**
 * Checks if a URL belongs to a known trusted organization.
 * Extract registered domain and verify against TRUSTED_DOMAINS.
 */
export function isTrustedDomain(url: string): boolean {
  if (!url) return false;
  
  let hostname = "";
  const cleaned = url.trim().toLowerCase();
  
  try {
    const withScheme = cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
    const u = new URL(withScheme);
    hostname = u.hostname;
  } catch {
    // Fallback regex parsing
    const match = cleaned.match(/^(?:https?:\/\/)?([^\/\?\#]+)/i);
    if (match && match[1]) {
      hostname = match[1];
    }
  }

  if (!hostname) return false;

  // Extract registered domain
  const regDomain = extractRegisteredDomain(hostname);
  return TRUSTED_DOMAINS.has(regDomain);
}
