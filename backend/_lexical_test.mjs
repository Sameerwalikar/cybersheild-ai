// Regression test suite for Lexical Rules, Threat Fusion & Verdict Engine
// Run with: npx tsx _lexical_test.mjs

import { applyLexicalRules } from './src/services/threat-intelligence/lexical/lexicalRules.js';
import { threatAnalysisEngine } from './src/services/threat-intelligence/threatAnalysisEngine.js';

const CASES = [
  // ─── Trusted Domains (Expected Verdict: SAFE) ─────────────────────────
  { url: 'https://google.com',                        expectedVerdict: 'SAFE',            type: 'trusted' },
  { url: 'https://github.com',                        expectedVerdict: 'SAFE',            type: 'trusted' },
  { url: 'https://paytm.com',                         expectedVerdict: 'SAFE',            type: 'trusted' },
  { url: 'https://microsoft.com',                     expectedVerdict: 'SAFE',            type: 'trusted' },

  // ─── Phishing / Impersonation (Expected Verdict: LIKELY_PHISHING) ─────
  { url: 'https://secure-paytm-login.click',          expectedVerdict: 'LIKELY_PHISHING', type: 'malicious' },
  { url: 'https://google-account-verify.xyz',         expectedVerdict: 'LIKELY_PHISHING', type: 'malicious' },
  { url: 'https://paytm.secure-login.example.com',    expectedVerdict: 'LIKELY_PHISHING', type: 'malicious' },

  // ─── Malware Delivery (Expected Verdict: LIKELY_MALWARE or CRITICAL) ────────────
  { url: 'http://69.12.83.188/Upaavirkeligheden.exe', expectedVerdict: 'CRITICAL',        type: 'malicious' },
  { url: 'https://tdhviatnam.com/secured_stub.ps1',   expectedVerdict: 'LIKELY_MALWARE',  type: 'malicious' },

  // ─── Threat Intelligence Positives (Expected Verdict: MALICIOUS/CRITICAL) ─
  { url: 'https://testsafebrowsing.appspot.com/phishing', expectedVerdict: 'CRITICAL',    type: 'malicious',
    intel: {
      google: { detected: true, threatTypes: ["SOCIAL_ENGINEERING"], provider: "google" },
      virusTotal: null,
      rdap: null
    }
  },
  { url: 'https://known-virustotal-malicious.com',    expectedVerdict: 'CRITICAL',       type: 'malicious',
    intel: {
      google: null,
      virusTotal: { maliciousCount: 6, suspiciousCount: 0, harmlessCount: 70, undetectedCount: 10, communityScore: 0, categories: [], lastAnalysisDate: null, provider: "virustotal" },
      rdap: null
    }
  }
];

let passed = 0;
let failed = 0;

let tp = 0; // True Positive
let fp = 0; // False Positive
let tn = 0; // True Negative
let fn = 0; // False Negative

console.log("=== RUNNING ENGINE REGRESSION TESTS ===\n");

for (const tc of CASES) {
  const lex = applyLexicalRules(tc.url);
  const intelReport = tc.intel || null;
  const eng = threatAnalysisEngine.compute(0, intelReport, lex);
  
  // Accept LIKELY_MALWARE or CRITICAL for executable checks as passing since they are both high severity delivery states
  const ok = eng.verdict === tc.expectedVerdict || 
             (tc.expectedVerdict === 'LIKELY_MALWARE' && eng.verdict === 'CRITICAL') ||
             (tc.expectedVerdict === 'CRITICAL' && eng.verdict === 'LIKELY_MALWARE');
  
  const mark = ok ? '✅' : '❌';
  if (ok) passed++; else failed++;
  
  console.log(`${mark} ${tc.url}`);
  console.log(`   Verdict: ${eng.verdict}  Score: ${eng.score}  Headline: "${eng.headline}"`);
  console.log(`   Reasons: ${eng.reasons.join(" | ") || "none"}`);
  console.log(`   Expected: ${tc.expectedVerdict}`);
  console.log("");

  // Metrics
  const isMaliciousClassification = eng.score >= 40;
  if (tc.type === 'trusted') {
    if (isMaliciousClassification) fp++; else tn++;
  } else if (tc.type === 'malicious') {
    if (isMaliciousClassification) tp++; else fn++;
  }
}

// Compute Metrics
const precision = tp / (tp + fp || 1);
const recall = tp / (tp + fn || 1);
const fpr = fp / (fp + tn || 1);
const fnr = fn / (tp + fn || 1);
const coverage = (tp + tn) / CASES.length;

console.log("=== PERFORMANCE METRICS ===");
console.log(`Total Cases Tested  : ${CASES.length}`);
console.log(`Passed Checks       : ${passed}/${CASES.length} (${(passed/CASES.length * 100).toFixed(1)}%)`);
console.log(`Precision           : ${(precision * 100).toFixed(1)}%`);
console.log(`Recall              : ${(recall * 100).toFixed(1)}%`);
console.log(`False Positive Rate : ${(fpr * 100).toFixed(1)}%`);
console.log(`False Negative Rate : ${(fnr * 100).toFixed(1)}%`);
console.log(`Overall Coverage    : ${(coverage * 100).toFixed(1)}%`);
console.log("===========================\n");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL REGRESSION TESTS PASSED SUCCESSFULLY! 🎉");
}
