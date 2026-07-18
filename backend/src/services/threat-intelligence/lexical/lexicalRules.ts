import { isTrustedDomain } from "./trustedDomains.js";
import {
  BrandAnalyzer,
  KeywordAnalyzer,
  EntropyAnalyzer,
  HyphenAnalyzer,
  HomographAnalyzer,
  IpAnalyzer,
  SubdomainAnalyzer,
  CredentialHarvestingAnalyzer,
  TldAnalyzer,
  FileAnalyzer,
  PathAnalyzer,
} from "./analyzers.js";
import { shannonEntropy, entropyLevel } from "./entropy.js";
import type { LexicalResult, ParsedUrl } from "./lexicalTypes.js";

const IP_URL_RE = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}([\/:?#]|$)/i;
const PUNYCODE_RE = /xn--/i;

function parseUrl(url: string): ParsedUrl | null {
  const withScheme = url.startsWith("http") ? url : `https://${url}`;
  let hostname = "";
  let pathname = "";
  try {
    const u = new URL(withScheme);
    hostname = u.hostname;
    pathname = u.pathname;
  } catch {
    const match = withScheme.match(/^https?:\/\/([^\/\?\#]+)(.*)$/i);
    if (match) {
      hostname = match[1];
      pathname = match[2] || "/";
    } else {
      return null;
    }
  }

  const labels = hostname.toLowerCase().split(".");
  const tld    = labels[labels.length - 1] ?? "";
  const apex   = labels.length >= 2 ? labels.slice(-2).join(".") : hostname;
  const subs   = labels.length > 2 ? labels.slice(0, -2) : [];
  return {
    hostname:     hostname.toLowerCase(),
    apexDomain:   apex,
    tld,
    subdomains:   subs,
    labels,
    pathPlusHost: hostname.toLowerCase() + pathname.toLowerCase(),
    raw:          url,
  };
}

export function applyLexicalRules(url: string): LexicalResult {
  const isTrusted = isTrustedDomain(url);
  const ipAddressUrl = IP_URL_RE.test(url);
  const punycodeDetected = PUNYCODE_RE.test(url);

  // If the domain is trusted, bypass lexical analyzers completely to eliminate false positives
  if (isTrusted) {
    return {
      raw: url,
      score: 0,
      confidence: 0.99,
      reasons: [],
      detectedBrands: [],
      detectedKeywords: [],
      suspiciousTld: false,
      entropy: "LOW",
      hyphenCount: 0,
      credentialHarvestingPattern: false,
      subdomainDeception: false,
      punycodeDetected,
      ipAddressUrl,
    };
  }

  const parsed = parseUrl(url);
  if (!parsed) {
    const score = (ipAddressUrl ? 45 : 0) + (punycodeDetected ? 40 : 0);
    const reasons: string[] = [];
    if (ipAddressUrl) reasons.push("URL uses a raw IP address instead of a domain name");
    if (punycodeDetected) reasons.push("Punycode (xn--) detected — possible IDN homograph attack");
    
    return {
      raw: url,
      score: Math.min(100, score),
      confidence: 0.5,
      reasons,
      detectedBrands: [],
      detectedKeywords: [],
      suspiciousTld: false,
      entropy: "LOW",
      hyphenCount: 0,
      credentialHarvestingPattern: false,
      subdomainDeception: false,
      punycodeDetected,
      ipAddressUrl,
    };
  }

  // Instantiate analyzers
  const brandAnalyzer = new BrandAnalyzer();
  const keywordAnalyzer = new KeywordAnalyzer();
  const entropyAnalyzer = new EntropyAnalyzer();
  const hyphenAnalyzer = new HyphenAnalyzer();
  const homographAnalyzer = new HomographAnalyzer();
  const ipAnalyzer = new IpAnalyzer();
  const subdomainAnalyzer = new SubdomainAnalyzer();
  const credentialHarvestingAnalyzer = new CredentialHarvestingAnalyzer();
  const tldAnalyzer = new TldAnalyzer();
  const fileAnalyzer = new FileAnalyzer();
  const pathAnalyzer = new PathAnalyzer();

  // Run analyses
  const brandRes = brandAnalyzer.analyze(parsed, url);
  const kwRes = keywordAnalyzer.analyze(parsed, url);
  const entropyRes = entropyAnalyzer.analyze(parsed, url);
  const hyphenRes = hyphenAnalyzer.analyze(parsed, url);
  const homographRes = homographAnalyzer.analyze(parsed, url);
  const ipRes = ipAnalyzer.analyze(parsed, url);
  const subdomainRes = subdomainAnalyzer.analyze(parsed, url);
  const chRes = credentialHarvestingAnalyzer.analyze(parsed, url);
  const tldRes = tldAnalyzer.analyze(parsed, url);
  const fileRes = fileAnalyzer.analyze(parsed, url);
  const pathRes = pathAnalyzer.analyze(parsed, url);

  const results = [
    brandRes,
    kwRes,
    entropyRes,
    hyphenRes,
    homographRes,
    ipRes,
    subdomainRes,
    chRes,
    tldRes,
    fileRes,
    pathRes,
  ];

  let score = 0;
  const reasons: string[] = [];
  let totalConfidence = 0;
  let activeAnalyzers = 0;

  for (const res of results) {
    if (res.score > 0) {
      score += res.score;
      reasons.push(...res.reasons);
    }
    totalConfidence += res.confidence;
    activeAnalyzers++;
  }

  score = Math.min(100, score);
  const confidence = activeAnalyzers > 0 ? totalConfidence / activeAnalyzers : 0.5;

  const domainPart = parsed.labels.slice(0, -1).join(".");
  const hyphenCount = (domainPart.match(/-/g) ?? []).length;
  
  const detectedBrands = brandRes.reasons.length > 0 ? getBrandNames(brandRes.reasons[0]) : [];
  const detectedKeywords = kwRes.reasons.length > 0 ? getKeywords(kwRes.reasons[0]) : [];

  return {
    raw: url,
    score,
    confidence,
    reasons,
    detectedBrands,
    detectedKeywords,
    suspiciousTld: tldRes.score > 0,
    entropy: entropyLevel(shannonEntropy(parsed.apexDomain.split(".")[0] ?? parsed.hostname), parsed.apexDomain.split(".")[0] ?? parsed.hostname),
    hyphenCount,
    credentialHarvestingPattern: chRes.score > 0,
    subdomainDeception: subdomainRes.score > 0,
    punycodeDetected,
    ipAddressUrl,
  };
}

function getBrandNames(reason: string): string[] {
  if (!reason.startsWith("Brand impersonation:")) return [];
  return reason.replace("Brand impersonation:", "").split(",").map(s => s.trim());
}

function getKeywords(reason: string): string[] {
  if (!reason.startsWith("Authentication/credential keywords:")) return [];
  return reason.replace("Authentication/credential keywords:", "").split(",").map(s => s.trim());
}
