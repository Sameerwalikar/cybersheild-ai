// ─────────────────────────────────────────────────────────────────────────────
// BRAND DICTIONARY
// Brands commonly impersonated in phishing attacks targeting Indian users.
// Extend this list freely — each entry is matched case-insensitively.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each brand entry carries:
 *  name        — canonical display name
 *  tokens      — all lowercase substrings to match against the URL
 *  isFinancial — financial/payment brands score higher (brand + login pattern)
 */
export interface BrandEntry {
  name: string;
  tokens: string[];
  isFinancial: boolean;
}

export const BRAND_DICTIONARY: BrandEntry[] = [
  // ── International Tech ──────────────────────────────────────────────────
  { name: "Google",    tokens: ["google"],         isFinancial: false },
  { name: "Microsoft", tokens: ["microsoft", "msft", "outlook", "office365", "microsft"], isFinancial: false },
  { name: "Apple",     tokens: ["apple", "icloud", "itunes"],    isFinancial: false },
  { name: "Amazon",    tokens: ["amazon", "aws"],                isFinancial: false },
  { name: "Meta",      tokens: ["meta"],                         isFinancial: false },
  { name: "Facebook",  tokens: ["facebook", "fb"],               isFinancial: false },
  { name: "Instagram", tokens: ["instagram", "insta"],           isFinancial: false },
  { name: "WhatsApp",  tokens: ["whatsapp"],                     isFinancial: false },
  { name: "Netflix",   tokens: ["netflix"],                      isFinancial: false },
  { name: "GitHub",    tokens: ["github"],                       isFinancial: false },
  { name: "OpenAI",    tokens: ["openai", "chatgpt"],            isFinancial: false },
  { name: "Twitter",   tokens: ["twitter"],                      isFinancial: false },
  { name: "LinkedIn",  tokens: ["linkedin"],                     isFinancial: false },
  { name: "Dropbox",   tokens: ["dropbox"],                      isFinancial: false },
  { name: "Yahoo",     tokens: ["yahoo"],                        isFinancial: false },

  // ── International Payment / Finance ─────────────────────────────────────
  { name: "PayPal",    tokens: ["paypal"],                       isFinancial: true  },
  { name: "Visa",      tokens: ["visa"],                         isFinancial: true  },
  { name: "Mastercard", tokens: ["mastercard"],                  isFinancial: true  },

  // ── Indian Payment Platforms ─────────────────────────────────────────────
  { name: "UPI",       tokens: ["upi"],                          isFinancial: true  },
  { name: "NPCI",      tokens: ["npci"],                         isFinancial: true  },
  { name: "Paytm",     tokens: ["paytm"],                        isFinancial: true  },
  { name: "PhonePe",   tokens: ["phonepe", "phone-pe"],          isFinancial: true  },
  { name: "Google Pay", tokens: ["googlepay", "gpay", "tez"],    isFinancial: true  },
  { name: "Amazon Pay", tokens: ["amazonpay", "amazon-pay"],     isFinancial: true  },
  { name: "MobiKwik",  tokens: ["mobikwik"],                     isFinancial: true  },
  { name: "FreeCharge", tokens: ["freecharge"],                  isFinancial: true  },
  { name: "BHIM",      tokens: ["bhim"],                         isFinancial: true  },

  // ── Indian Banks ─────────────────────────────────────────────────────────
  { name: "SBI",       tokens: ["sbi", "statebank", "state-bank"], isFinancial: true },
  { name: "HDFC",      tokens: ["hdfc"],                         isFinancial: true  },
  { name: "ICICI",     tokens: ["icici"],                        isFinancial: true  },
  { name: "Axis Bank", tokens: ["axisbank", "axis-bank"],        isFinancial: true  },
  { name: "Kotak",     tokens: ["kotak"],                        isFinancial: true  },
  { name: "Canara",    tokens: ["canara"],                       isFinancial: true  },
  { name: "Bank of Baroda", tokens: ["bankofbaroda", "bob", "bobibanking"], isFinancial: true },
  { name: "PNB",       tokens: ["pnb", "punjabbank"],            isFinancial: true  },
  { name: "Yes Bank",  tokens: ["yesbank", "yes-bank"],          isFinancial: true  },
  { name: "IndusInd",  tokens: ["indusind"],                     isFinancial: true  },
  { name: "IDFC",      tokens: ["idfc"],                         isFinancial: true  },

  // ── Indian Government / Regulators ───────────────────────────────────────
  { name: "Aadhaar",   tokens: ["aadhaar", "aadhar", "uidai"],   isFinancial: true  },
  { name: "PAN",       tokens: ["nsdl", "pancard"],              isFinancial: true  },
  { name: "Income Tax", tokens: ["incometax", "efiling"],        isFinancial: true  },
  { name: "RBI",       tokens: ["rbi", "rbiindia"],              isFinancial: true  },
  { name: "IRCTC",     tokens: ["irctc"],                        isFinancial: false },

  // ── E-commerce ───────────────────────────────────────────────────────────
  { name: "Flipkart",  tokens: ["flipkart"],                     isFinancial: false },
  { name: "Meesho",    tokens: ["meesho"],                       isFinancial: false },
  { name: "Myntra",    tokens: ["myntra"],                       isFinancial: false },
  { name: "Swiggy",    tokens: ["swiggy"],                       isFinancial: false },
  { name: "Zomato",    tokens: ["zomato"],                       isFinancial: false },
];

/** Build a flat lookup: token → BrandEntry (for O(1) matching) */
export const BRAND_TOKEN_MAP: Map<string, BrandEntry> = new Map(
  BRAND_DICTIONARY.flatMap((b) => b.tokens.map((t) => [t, b])),
);
