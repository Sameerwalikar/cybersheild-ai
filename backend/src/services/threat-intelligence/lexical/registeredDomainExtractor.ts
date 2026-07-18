// ─── REGISTERED DOMAIN EXTRACTOR ──────────────────────────────────────────────

const MULTI_LABEL_SUFFIXES = new Set([
  "co.in", "org.in", "net.in", "gov.in", "ac.in", "edu.in", "res.in", "nic.in",
  "co.uk", "org.uk", "me.uk", "ltd.uk", "plc.uk", "sch.uk", "ac.uk", "gov.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.jp", "ne.jp", "or.jp", "go.jp", "ac.jp", "ad.jp",
  "com.br", "net.br", "org.br", "gov.br",
  "co.za", "org.za", "gov.za",
  "co.nz", "net.nz", "org.nz",
  "com.sg", "net.sg", "org.sg", "gov.sg",
  "co.kr", "ne.kr", "or.kr", "go.kr", "re.kr",
]);

/**
 * Extracts the registered (registrable) domain from a hostname string.
 * Examples:
 *   secure.paytm.com => paytm.com
 *   paytm.secure-login.example.com => example.com
 *   sbi.co.in => sbi.co.in
 *   upi.npci.org.in => npci.org.in
 */
export function extractRegisteredDomain(hostname: string): string {
  if (!hostname) return "";
  const cleaned = hostname.toLowerCase().trim();
  
  // Split labels
  const labels = cleaned.split(".");
  if (labels.length <= 2) {
    return cleaned;
  }

  // Check last two labels
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_LABEL_SUFFIXES.has(lastTwo)) {
    // If it's a known multi-label suffix, the registered domain is the last three labels
    return labels.slice(-3).join(".");
  }

  // Otherwise, the registered domain is the last two labels
  return labels.slice(-2).join(".");
}
