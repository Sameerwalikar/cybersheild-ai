import type { EntropyLevel } from "./lexicalTypes.js";
import { BRAND_TOKEN_MAP } from "./brandDictionary.js";

const DICTIONARY_WORDS = new Set([
  "secure", "login", "signin", "sign-in", "signon", "account", "verify", "verification",
  "banking", "bank", "service", "services", "update", "updates", "portal", "support",
  "online", "web", "office", "mail", "email", "cloud", "payment", "payments", "pay",
  "wallet", "device", "devices", "security", "protect", "help", "info", "system",
  "systems", "connect", "connection", "login-page", "live", "work", "home", "admin",
  "user", "users", "customer", "customers", "client", "clients", "member", "members",
  "github", "microsoft", "google", "amazon", "paytm", "phonepe", "upi", "apple",
  "netflix", "facebook", "instagram", "whatsapp", "linkedin", "openai", "chatgpt"
]);

/**
 * Computes Shannon entropy of a string.
 *
 * H(X) = -∑ p(x) · log₂(p(x))
 *
 * Typical values for short domain labels:
 *   < 2.8  → LOW   (e.g. "google", "paytm", "github")
 *   2.8–3.5 → MEDIUM
 *   > 3.5  → HIGH  (e.g. randomised DGA domains)
 */
export function shannonEntropy(input: string): number {
  if (input.length === 0) return 0;

  const freq: Map<string, number> = new Map();
  for (const ch of input) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }

  let entropy = 0;
  const len = input.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return Math.round(entropy * 100) / 100;
}

export function entropyLevel(value: number, label?: string): EntropyLevel {
  // If no label, fall back to Shannon entropy thresholds
  if (!label) {
    if (value >= 3.5) return "HIGH";
    if (value >= 2.8) return "MEDIUM";
    return "LOW";
  }

  const cleanLabel = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleanLabel.length < 5) return "LOW";

  // Check if exactly brand or dictionary word
  if (DICTIONARY_WORDS.has(cleanLabel) || BRAND_TOKEN_MAP.has(cleanLabel)) {
    return "LOW";
  }

  // Check if hyphenated composed of clean words
  const parts = label.split("-");
  const allDictOrBrand = parts.every(part => DICTIONARY_WORDS.has(part) || BRAND_TOKEN_MAP.has(part));
  if (allDictOrBrand && parts.length > 1) {
    return "LOW";
  }

  const len = label.length;
  if (len < 5) return "LOW"; // too short to confidently detect randomness

  const hasDigits = /\d/.test(label);
  const hasLetters = /[a-z]/i.test(label);
  const digitCount = (label.match(/\d/g) ?? []).length;
  const letterCount = (label.match(/[a-z]/gi) ?? []).length;
  const digitRatio = digitCount / len;

  // Count unique characters
  const uniqueChars = new Set(label).size;
  const uniqueRatio = uniqueChars / len;

  // Vowel ratio among letters (treating y as a vowel)
  const vowels = (label.match(/[aeiouy]/gi) ?? []).length;
  const vowelRatio = letterCount > 0 ? vowels / letterCount : 0;

  // Max consecutive consonants (consonant runs)
  let maxConsonantRun = 0;
  let currentRun = 0;
  const consonantRegex = /[bcdfghjklmnpqrstvwxz]/i;
  for (const ch of label) {
    if (consonantRegex.test(ch)) {
      currentRun++;
      if (currentRun > maxConsonantRun) {
        maxConsonantRun = currentRun;
      }
    } else {
      currentRun = 0;
    }
  }

  let isHigh = false;
  let isMedium = false;

  // 1. High Shannon entropy
  if (value >= 3.5) {
    isHigh = true;
  } else if (value >= 2.8) {
    isMedium = true;
  }

  // 2. High digit mix (typical in DGAs)
  if (hasDigits && hasLetters) {
    if (digitRatio >= 0.35 && len >= 8) {
      isHigh = true;
    } else if (digitRatio >= 0.15) {
      isMedium = true;
    }
  }

  // 3. Low vowel ratio (DGA indicator)
  if (letterCount >= 5 && vowelRatio < 0.25) {
    if (vowelRatio < 0.15 || maxConsonantRun >= 4) {
      isHigh = true;
    } else {
      isMedium = true;
    }
  }

  // 4. Consecutive consonant runs
  if (maxConsonantRun >= 5) {
    isHigh = true;
  } else if (maxConsonantRun >= 4) {
    isMedium = true;
  }

  // 5. High character uniqueness for longer strings
  if (len >= 8 && uniqueRatio >= 0.7) {
    if (value >= 2.7) {
      isHigh = true;
    } else {
      isMedium = true;
    }
  }

  if (isHigh) return "HIGH";
  if (isMedium) return "MEDIUM";
  return "LOW";
}
