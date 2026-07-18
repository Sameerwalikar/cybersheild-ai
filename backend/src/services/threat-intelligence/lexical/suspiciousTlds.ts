// ─────────────────────────────────────────────────────────────────────────────
// SUSPICIOUS TOP-LEVEL DOMAINS
// TLDs frequently abused in phishing, malware distribution, and spam campaigns.
// Each TLD carries a weight reflecting how commonly it appears in malicious URLs.
// ─────────────────────────────────────────────────────────────────────────────

export interface TldEntry {
  tld: string;   // without leading dot, lowercase
  weight: number;
}

export const SUSPICIOUS_TLDS: TldEntry[] = [
  // ── Very high abuse rate ────────────────────────────────────────────────
  { tld: "tk",    weight: 18 },
  { tld: "ml",    weight: 18 },
  { tld: "ga",    weight: 18 },
  { tld: "cf",    weight: 18 },
  { tld: "gq",    weight: 18 },
  { tld: "click", weight: 16 },
  { tld: "zip",   weight: 18 }, // Google registrar but near-100% abuse
  { tld: "mov",   weight: 16 }, // Mimics file extension
  { tld: "icu",   weight: 15 },
  { tld: "pw",    weight: 15 },

  // ── High abuse rate ──────────────────────────────────────────────────────
  { tld: "xyz",   weight: 14 },
  { tld: "top",   weight: 14 },
  { tld: "rest",  weight: 12 },
  { tld: "work",  weight: 12 },
  { tld: "live",  weight: 10 },
  { tld: "online", weight: 10 },
  { tld: "site",  weight: 10 },
  { tld: "fun",   weight: 10 },
  { tld: "club",  weight: 10 },
  { tld: "uno",   weight: 12 },
  { tld: "cyou",  weight: 12 },
  { tld: "buzz",  weight: 10 },

  // ── Moderate abuse rate (contextual) ────────────────────────────────────
  { tld: "info",  weight: 8  },
  { tld: "biz",   weight: 8  },
  { tld: "cc",    weight: 8  },
  { tld: "ws",    weight: 8  },
  { tld: "vip",   weight: 8  },
  { tld: "win",   weight: 10 },
  { tld: "loan",  weight: 12 },
  { tld: "trade", weight: 10 },
  { tld: "link",  weight: 8  },
  { tld: "gdn",   weight: 10 },
  { tld: "best",  weight: 8  },
  { tld: "ltd",   weight: 8  },
  { tld: "email", weight: 8  },
];

/** TLD → weight map for O(1) lookup */
export const TLD_WEIGHT_MAP: Map<string, number> = new Map(
  SUSPICIOUS_TLDS.map((t) => [t.tld, t.weight]),
);
