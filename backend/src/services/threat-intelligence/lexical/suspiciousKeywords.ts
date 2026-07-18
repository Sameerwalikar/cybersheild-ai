// ─────────────────────────────────────────────────────────────────────────────
// SUSPICIOUS / AUTHENTICATION KEYWORDS
// Words commonly used in credential-harvesting and phishing URLs.
// ─────────────────────────────────────────────────────────────────────────────

/** Credential / authentication keywords — each has an individual weight */
export interface KeywordEntry {
  keyword: string;
  weight: number; // contribution to lexical score when found
}

export const AUTH_KEYWORDS: KeywordEntry[] = [
  // Credential actions
  { keyword: "login",        weight: 10 },
  { keyword: "signin",       weight: 10 },
  { keyword: "sign-in",      weight: 10 },
  { keyword: "logon",        weight: 8  },
  { keyword: "authenticate", weight: 10 },
  { keyword: "auth",         weight: 8  },

  // Verification / account
  { keyword: "verify",       weight: 10 },
  { keyword: "verification", weight: 10 },
  { keyword: "validate",     weight: 8  },
  { keyword: "confirm",      weight: 8  },
  { keyword: "account",      weight: 6  },
  { keyword: "update",       weight: 6  },
  { keyword: "upgrade",      weight: 6  },

  // Security / safety theatre
  { keyword: "secure",       weight: 8  },
  { keyword: "security",     weight: 6  },
  { keyword: "safe",         weight: 5  },
  { keyword: "protected",    weight: 5  },

  // Financial / payment
  { keyword: "wallet",       weight: 8  },
  { keyword: "payment",      weight: 8  },
  { keyword: "pay",          weight: 6  },
  { keyword: "bank",         weight: 8  },
  { keyword: "banking",      weight: 8  },
  { keyword: "transaction",  weight: 6  },

  // Identity / credential
  { keyword: "reset",        weight: 8  },
  { keyword: "password",     weight: 10 },
  { keyword: "credential",   weight: 10 },
  { keyword: "otp",          weight: 12 },
  { keyword: "kyc",          weight: 12 },
  { keyword: "pin",          weight: 8  },
  { keyword: "cvv",          weight: 10 },

  // Urgency / social engineering
  { keyword: "urgent",       weight: 8  },
  { keyword: "suspended",    weight: 8  },
  { keyword: "blocked",      weight: 8  },
  { keyword: "alert",        weight: 6  },
  { keyword: "notice",       weight: 5  },
  { keyword: "support",      weight: 5  },
  { keyword: "helpdesk",     weight: 5  },
  { keyword: "claim",        weight: 6  },
  { keyword: "reward",       weight: 6  },
  { keyword: "cashback",     weight: 6  },
  { keyword: "winner",       weight: 8  },
  { keyword: "prize",        weight: 6  },
];

/** Flat set of all keyword strings for fast contains-check */
export const KEYWORD_SET: Set<string> = new Set(AUTH_KEYWORDS.map((k) => k.keyword));

/** Keyword → weight lookup */
export const KEYWORD_WEIGHT_MAP: Map<string, number> = new Map(
  AUTH_KEYWORDS.map((k) => [k.keyword, k.weight]),
);
