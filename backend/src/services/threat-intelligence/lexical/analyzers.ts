import { BRAND_TOKEN_MAP, type BrandEntry } from "./brandDictionary.js";
import { KEYWORD_WEIGHT_MAP }               from "./suspiciousKeywords.js";
import { TLD_WEIGHT_MAP }                   from "./suspiciousTlds.js";
import { shannonEntropy, entropyLevel }     from "./entropy.js";
import type { ParsedUrl, EntropyLevel }     from "./lexicalTypes.js";
import { analyzeFile }                      from "./fileAnalyzer.js";
import { analyzePath }                      from "./pathAnalyzer.js";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface AnalyzerResult {
  score: number;
  confidence: number;
  reasons: string[];
}

export interface LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, rawUrl: string): AnalyzerResult;
}

// ─── Regex & Utility Helpers ──────────────────────────────────────────────────

const IP_URL_RE = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}([\/:?#]|$)/i;
const PUNYCODE_RE = /xn--/i;
const TOKEN_SPLIT_RE = /[^a-z]+/g;

function tokenise(text: string): string[] {
  return text.toLowerCase().split(TOKEN_SPLIT_RE).filter((t) => t.length >= 3);
}

const HOMOGLYPH_MAP: { [key: string]: string } = {
  // Cyrillic to Latin
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
  'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
  'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'і': 'i', 'ѕ': 's', 'є': 'e', 'ї': 'yi',
  // Fullwidth Latin
  'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g', 'ｈ': 'h',
  'ｉ': 'i', 'ј': 'j', 'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n', 'ｏ': 'o', 'ｐ': 'p',
  'ｑ': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't', 'ｕ': 'u', 'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x',
  'ｙ': 'y', 'ｚ': 'z',
  // Diacritics / other accents
  'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'ā': 'a', 'ă': 'a', 'ą': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e', 'ė': 'e', 'ę': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i', 'į': 'i', 'ı': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ō': 'o', 'ő': 'o', 'œ': 'oe',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ū': 'u', 'ů': 'u', 'ű': 'u',
  'ç': 'c', 'ć': 'c', 'ĉ': 'c', 'ċ': 'c', 'č': 'c',
  'ñ': 'n', 'ń': 'n', 'ň': 'n',
  'ś': 's', 'ŝ': 's', 'ş': 's', 'š': 's',
  'ý': 'y', 'ÿ': 'y',
  'ź': 'z', 'ż': 'z', 'ž': 'z',
  'ł': 'l', 'ľ': 'l', 'ļ': 'l',
  'đ': 'd', 'ď': 'd',
  'ť': 't', 'ț': 't',
  'ŕ': 'r', 'ř': 'r',
  'ṅ': 'n', 'ṁ': 'm', 'ṗ': 'p', 'ṡ': 's', 'ṫ': 't',
  '€': 'e',
};

function decodePunycode(input: string): string {
  if (!input.startsWith("xn--")) return input;
  let n = 128;
  let i = 0;
  let bias = 72;
  const output: number[] = [];

  const parts = input.slice(4).split("-");
  let basic = "";
  if (parts.length > 1) {
    basic = parts.slice(0, -1).join("-");
  }
  const encoded = parts[parts.length - 1] || "";

  for (let j = 0; j < basic.length; j++) {
    const code = basic.charCodeAt(j);
    if (code >= 0x80) return input;
    output.push(code);
  }

  let encodedIndex = 0;

  function adapt(delta: number, numpoints: number, firsttime: boolean): number {
    let k = 0;
    delta = firsttime ? Math.floor(delta / 700) : Math.floor(delta / 2);
    delta += Math.floor(delta / numpoints);
    for (; delta > 455; k += 36) {
      delta = Math.floor(delta / 35);
    }
    return k + Math.floor((36 * delta) / (delta + 38));
  }

  while (encodedIndex < encoded.length) {
    const oldi = i;
    let w = 1;
    for (let k = 36; ; k += 36) {
      if (encodedIndex >= encoded.length) return input;
      const charCode = encoded.charCodeAt(encodedIndex++);
      let digit = 0;
      if (charCode - 48 < 10) digit = charCode - 48 + 26;
      else if (charCode - 65 < 26) digit = charCode - 65;
      else if (charCode - 97 < 26) digit = charCode - 97;
      else return input;

      i += digit * w;
      const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
      if (digit < t) break;
      w *= 36 - t;
    }
    const len = output.length + 1;
    bias = adapt(i - oldi, len, oldi === 0);
    n += Math.floor(i / len);
    i %= len;
    output.splice(i++, 0, n);
  }

  return String.fromCodePoint(...output);
}

function decodeDomain(hostname: string): string {
  return hostname.split(".").map(decodePunycode).join(".");
}

function normalizeUnicode(text: string): string {
  let normalized = "";
  for (const char of text.toLowerCase()) {
    if (HOMOGLYPH_MAP[char] !== undefined) {
      normalized += HOMOGLYPH_MAP[char];
    } else {
      normalized += char;
    }
  }
  return normalized;
}

// ─── 1. Brand Analyzer ────────────────────────────────────────────────────────

export class BrandAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, _rawUrl: string): AnalyzerResult {
    const scanText = parsed.pathPlusHost;
    const tokens = tokenise(scanText);
    const found = new Map<string, BrandEntry>();

    for (const tok of tokens) {
      const entry = BRAND_TOKEN_MAP.get(tok);
      if (entry) found.set(entry.name, entry);
    }
    for (const [token, entry] of BRAND_TOKEN_MAP) {
      if (token.length >= 5 && scanText.includes(token)) {
        found.set(entry.name, entry);
      }
    }

    if (found.size === 0) {
      return { score: 0, confidence: 1.0, reasons: [] };
    }

    const detectedBrands = [...found.keys()];
    const financialBrand = [...found.values()].some((e) => e.isFinancial);

    const apexLabel = parsed.apexDomain.split(".")[0];
    const brandIsApex = [...found.values()].some((e) =>
      e.tokens.some((t) => t === apexLabel),
    );

    if (brandIsApex) {
      return { score: 0, confidence: 0.9, reasons: [] };
    }

    const score = financialBrand ? 25 : 20;
    return {
      score,
      confidence: 0.8,
      reasons: [`Brand impersonation: ${detectedBrands.join(", ")}`],
    };
  }
}

// ─── 2. Keyword Analyzer ──────────────────────────────────────────────────────

export class KeywordAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, _rawUrl: string): AnalyzerResult {
    const scanText = parsed.pathPlusHost;
    const tokens = tokenise(scanText);
    const found = new Map<string, number>();

    for (const tok of tokens) {
      const w = KEYWORD_WEIGHT_MAP.get(tok);
      if (w !== undefined) found.set(tok, w);
    }
    for (const [kw, w] of KEYWORD_WEIGHT_MAP) {
      if (kw.length >= 4 && scanText.includes(kw) && !found.has(kw)) {
        found.set(kw, w);
      }
    }

    if (found.size === 0) {
      return { score: 0, confidence: 1.0, reasons: [] };
    }

    const detectedKeywords = [...found.keys()];
    let score = 0;
    for (const w of found.values()) score += w;
    score = Math.min(score, 30);

    return {
      score,
      confidence: 0.75,
      reasons: [`Authentication/credential keywords: ${detectedKeywords.slice(0, 5).join(", ")}`],
    };
  }
}

// ─── 3. Entropy Analyzer ──────────────────────────────────────────────────────

export class EntropyAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, rawUrl: string): AnalyzerResult {
    const isIp = IP_URL_RE.test(rawUrl);
    if (isIp) {
      return { score: 0, confidence: 1.0, reasons: [] };
    }

    const label = parsed.apexDomain.split(".")[0] ?? parsed.hostname;
    const value = shannonEntropy(label);
    const level = entropyLevel(value, label);

    if (level === "HIGH") {
      return {
        score: 45,
        confidence: 0.85,
        reasons: [`High domain entropy (${value.toFixed(2)}) — randomised hostname`],
      };
    }
    if (level === "MEDIUM") {
      return {
        score: 20,
        confidence: 0.65,
        reasons: [`Moderate domain entropy (${value.toFixed(2)})`],
      };
    }
    return { score: 0, confidence: 0.95, reasons: [] };
  }
}

// ─── 4. Hyphen Analyzer ───────────────────────────────────────────────────────

export class HyphenAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, _rawUrl: string): AnalyzerResult {
    const domainPart = parsed.labels.slice(0, -1).join(".");
    const count = (domainPart.match(/-/g) ?? []).length;
    if (count >= 4) {
      return {
        score: 15,
        confidence: 0.85,
        reasons: [`Excessive hyphens (${count}) — URL complexity abuse`],
      };
    }
    if (count >= 2) {
      return {
        score: 10,
        confidence: 0.75,
        reasons: [`Multiple hyphens (${count}) in domain`],
      };
    }
    return { score: 0, confidence: 0.95, reasons: [] };
  }
}

// ─── 5. Homograph Analyzer ────────────────────────────────────────────────────

export class HomographAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, rawUrl: string): AnalyzerResult {
    const isPunycode = PUNYCODE_RE.test(rawUrl);
    if (!isPunycode) {
      return { score: 0, confidence: 1.0, reasons: [] };
    }

    const decodedHost = decodeDomain(parsed.hostname);
    const normalizedHost = normalizeUnicode(decodedHost);

    let targetBrand = "";
    for (const [token, entry] of BRAND_TOKEN_MAP) {
      if (normalizedHost.includes(token)) {
        targetBrand = entry.name;
        break;
      }
    }

    if (targetBrand) {
      return {
        score: 50,
        confidence: 0.95,
        reasons: [
          `Punycode (xn--) detected — possible IDN homograph attack`,
          `IDN homograph attack targeting brand: ${targetBrand}`,
        ],
      };
    }

    return {
      score: 40,
      confidence: 0.8,
      reasons: [`Punycode (xn--) detected — possible IDN homograph attack`],
    };
  }
}

// ─── 6. IP Analyzer ───────────────────────────────────────────────────────────

export class IpAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, rawUrl: string): AnalyzerResult {
    if (IP_URL_RE.test(rawUrl)) {
      let score = 45;
      let reason = "URL uses a raw IP address instead of a domain name";
      const scanText = parsed.pathPlusHost;
      const tokens = tokenise(scanText);
      const hasKeywords = tokens.some((tok) => KEYWORD_WEIGHT_MAP.has(tok));
      
      if (hasKeywords) {
        score += 30;
        reason = "Raw IP address URL combined with authentication/credential harvesting path";
      }

      return {
        score,
        confidence: 0.95,
        reasons: [reason],
      };
    }
    return { score: 0, confidence: 1.0, reasons: [] };
  }
}

// ─── 7. Subdomain Analyzer ────────────────────────────────────────────────────

export class SubdomainAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, _rawUrl: string): AnalyzerResult {
    if (parsed.subdomains.length === 0) {
      return { score: 0, confidence: 1.0, reasons: [] };
    }
    const subText = parsed.subdomains.join(".");

    for (const [token, entry] of BRAND_TOKEN_MAP) {
      if (token.length >= 4 && subText.includes(token)) {
        const apexLabel = parsed.apexDomain.split(".")[0];
        const brandIsApex = entry.tokens.some((t) => t === apexLabel);
        if (!brandIsApex) {
          return {
            score: 20,
            confidence: 0.85,
            reasons: [
              `Subdomain deception: "${entry.name}" appears as subdomain of "${parsed.apexDomain}" ` +
              `— registered domain is "${parsed.apexDomain}"`,
            ],
          };
        }
      }
    }
    return { score: 0, confidence: 0.9, reasons: [] };
  }
}

// ─── 8. Credential Harvesting Analyzer ────────────────────────────────────────

export class CredentialHarvestingAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, _rawUrl: string): AnalyzerResult {
    const scanText = parsed.pathPlusHost;
    const tokens = tokenise(scanText);

    // Brands check
    const detectedBrands = new Set<string>();
    let financialBrand = false;
    let brandIsApex = false;

    for (const tok of tokens) {
      const entry = BRAND_TOKEN_MAP.get(tok);
      if (entry) {
        detectedBrands.add(entry.name);
        if (entry.isFinancial) financialBrand = true;
      }
    }
    const apexLabel = parsed.apexDomain.split(".")[0];
    for (const tok of tokens) {
      const entry = BRAND_TOKEN_MAP.get(tok);
      if (entry && entry.tokens.some((t) => t === apexLabel)) {
        brandIsApex = true;
      }
    }

    // Keywords check
    const detectedKeywords = new Set<string>();
    for (const tok of tokens) {
      if (KEYWORD_WEIGHT_MAP.has(tok)) {
        detectedKeywords.add(tok);
      }
    }

    if (brandIsApex) return { score: 0, confidence: 0.95, reasons: [] };

    if (detectedBrands.size > 0 && detectedKeywords.size > 0) {
      const score = financialBrand ? 30 : 25;
      const brand = [...detectedBrands][0];
      const keyword = [...detectedKeywords][0];
      return {
        score,
        confidence: 0.9,
        reasons: [`Credential harvesting: brand (${brand}) + keyword (${keyword}) co-occur`],
      };
    }

    return { score: 0, confidence: 1.0, reasons: [] };
  }
}

// ─── 9. TLD Analyzer ──────────────────────────────────────────────────────────

export class TldAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, _rawUrl: string): AnalyzerResult {
    const weight = TLD_WEIGHT_MAP.get(parsed.tld) ?? 0;
    if (weight > 0) {
      return {
        score: weight,
        confidence: 0.8,
        reasons: [`.${parsed.tld} TLD is commonly associated with phishing and abuse`],
      };
    }
    return { score: 0, confidence: 0.9, reasons: [] };
  }
}

// ─── 10. File Analyzer ────────────────────────────────────────────────────────

export class FileAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, rawUrl: string): AnalyzerResult {
    const res = analyzeFile(rawUrl);
    if (res.detected) {
      return {
        score: res.riskScore,
        confidence: res.confidence,
        reasons: [res.reason],
      };
    }
    return { score: 0, confidence: 1.0, reasons: [] };
  }
}

// ─── 11. Path Analyzer ────────────────────────────────────────────────────────

export class PathAnalyzer implements LexicalAnalyzerComponent {
  analyze(parsed: ParsedUrl, rawUrl: string): AnalyzerResult {
    const res = analyzePath(rawUrl);
    if (res.score > 0) {
      return {
        score: res.score,
        confidence: res.confidence,
        reasons: res.reasons,
      };
    }
    return { score: 0, confidence: 1.0, reasons: [] };
  }
}
