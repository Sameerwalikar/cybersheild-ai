export interface ExtractedEntity {
  type: "PHONE" | "EMAIL" | "UPI" | "DOMAIN" | "URL" | "IP" | "BANK_ACCOUNT" | "QR_CONTENT";
  value: string;
  normalized: string;
}

const PHONE_REGEX = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const UPI_REGEX = /[a-zA-Z0-9._-]+@[a-zA-Z]{2,}/g;
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const DOMAIN_REGEX = /(?:https?:\/\/)?([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g;
const IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

export function extractEntities(content: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // Phone numbers
  const phones = content.match(PHONE_REGEX) || [];
  phones.forEach((p) => {
    const normalized = p.replace(/[\s-]/g, "").replace(/^\+91/, "");
    if (normalized.length >= 10 && !seen.has(`PHONE:${normalized}`)) {
      seen.add(`PHONE:${normalized}`);
      entities.push({ type: "PHONE", value: p.trim(), normalized });
    }
  });

  // URLs
  const urls = content.match(URL_REGEX) || [];
  urls.forEach((u) => {
    const normalized = u.toLowerCase().replace(/\/+$/, "");
    if (!seen.has(`URL:${normalized}`)) {
      seen.add(`URL:${normalized}`);
      entities.push({ type: "URL", value: u, normalized });
      // Extract domain from URL
      try {
        const domain = new globalThis.URL(u).hostname;
        if (!seen.has(`DOMAIN:${domain}`)) {
          seen.add(`DOMAIN:${domain}`);
          entities.push({ type: "DOMAIN", value: domain, normalized: domain.toLowerCase() });
        }
      } catch {}
    }
  });

  // Emails (before UPI to avoid double-matching)
  const emails = content.match(EMAIL_REGEX) || [];
  emails.forEach((e) => {
    const normalized = e.toLowerCase();
    if (normalized.includes(".") && normalized.split("@")[1]?.includes(".") && !seen.has(`EMAIL:${normalized}`)) {
      seen.add(`EMAIL:${normalized}`);
      entities.push({ type: "EMAIL", value: e, normalized });
    }
  });

  // UPI IDs (simple pattern, exclude already-found emails)
  const upis = content.match(UPI_REGEX) || [];
  upis.forEach((u) => {
    const normalized = u.toLowerCase();
    // UPI handles use short bank codes (ybl, paytm, oksbi), not full domains
    const handle = normalized.split("@")[1] || "";
    if (handle.length <= 12 && !handle.includes(".") && !seen.has(`EMAIL:${normalized}`) && !seen.has(`UPI:${normalized}`)) {
      seen.add(`UPI:${normalized}`);
      entities.push({ type: "UPI", value: u, normalized });
    }
  });

  // IP addresses
  const ips = content.match(IP_REGEX) || [];
  ips.forEach((ip) => {
    if (!seen.has(`IP:${ip}`)) {
      seen.add(`IP:${ip}`);
      entities.push({ type: "IP", value: ip, normalized: ip });
    }
  });

  return entities;
}
