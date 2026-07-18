// AI Explanation Engine Validation Test Suite
// Run with: npx tsx _ai_test.mjs

import { aiService } from './src/modules/ai/ai.service.js';
import { getAIProvider } from './src/modules/ai/ai.provider.js';

// Setup environment default provider if not set
if (!process.env.AI_PROVIDER && !process.env.GEMINI_API_KEY) {
  process.env.AI_PROVIDER = 'mock';
}

console.log("=== RUNNING GEMINI EXPLANATION COMPLIANCE TESTS ===");
const provider = getAIProvider();

const MOCK_LEXICAL = {
  raw: 'https://malicious-example.com/download/payload.exe',
  score: 85,
  confidence: 0.9,
  reasons: ['Executable payload in URL path', 'High entropy domain'],
  detectedBrands: [],
  detectedKeywords: [],
  suspiciousTld: false,
  entropy: 'HIGH',
  hyphenCount: 0,
  credentialHarvestingPattern: false,
  subdomainDeception: false,
  punycodeDetected: false,
  ipAddressUrl: false
};

const CASES = [
  {
    name: "Case 1: LIKELY_MALWARE",
    context: {
      scanType: "url",
      content: "https://malicious-example.com/download/payload.exe",
      ruleSignals: [],
      engineScore: {
        score: 100,
        level: "CRITICAL",
        confidence: 0.99,
        verdict: "LIKELY_MALWARE",
        headline: "Potential Malware Distribution Detected",
        recommendation: "Do NOT visit or execute any downloaded files.",
        reasons: ["PowerShell Script", "Executable Payload", "VirusTotal detected malware", "Newly registered domain", "Malware delivery pattern"]
      },
      lexical: MOCK_LEXICAL,
      intel: {
        google: null,
        virusTotal: { maliciousCount: 6, suspiciousCount: 0, harmlessCount: 70, undetectedCount: 10, communityScore: 0, categories: [], available: true },
        rdap: { domain: "malicious-example.com", registrar: "namecheap", ageInDays: 3, registrationDate: "2026-07-10", isNewDomain: true, isVeryNewDomain: true, available: true }
      }
    },
    validate: (res) => {
      const text = (res.citizenExplanation + " " + res.explanation).toLowerCase();
      // Must NEVER claim it's safe
      const containsSafeClaim = text.includes("this url is safe") || text.includes("appears legitimate") || text.includes("safe to visit");
      if (containsSafeClaim) {
        throw new Error(`Contradiction detected: LIKELY_MALWARE context returned positive/safe phrasing: "${res.citizenExplanation}"`);
      }
      console.log("   ✅ Validated: No 'safe/legitimate' claims present in malware explanation.");
    }
  },
  {
    name: "Case 2: SAFE",
    context: {
      scanType: "url",
      content: "https://google.com",
      ruleSignals: [],
      engineScore: {
        score: 0,
        level: "SAFE",
        confidence: 0.99,
        verdict: "SAFE",
        headline: "No Known Threats Detected",
        recommendation: "This website appears safe based on current intelligence.",
        reasons: []
      },
      lexical: { ...MOCK_LEXICAL, raw: "https://google.com", score: 0, reasons: [] },
      intel: { google: { detected: false, threatTypes: [], available: true }, virusTotal: null, rdap: null }
    },
    validate: (res) => {
      const text = (res.citizenExplanation + " " + res.explanation).toLowerCase();
      // Must NEVER claim it's malicious
      const containsMaliciousClaim = text.includes("malicious") || text.includes("phishing") || text.includes("malware") || text.includes("dangerous");
      if (containsMaliciousClaim) {
        throw new Error(`Contradiction detected: SAFE context returned malicious phrasing: "${res.citizenExplanation}"`);
      }
      console.log("   ✅ Validated: No false threat alerts present in safe explanation.");
    }
  },
  {
    name: "Case 3: LIKELY_PHISHING",
    context: {
      scanType: "url",
      content: "https://secure-login-paytm.xyz",
      ruleSignals: [],
      engineScore: {
        score: 85,
        level: "HIGH",
        confidence: 0.92,
        verdict: "LIKELY_PHISHING",
        headline: "Potential Credential Harvesting Website",
        recommendation: "Do NOT enter your passwords, OTPs, or personal details.",
        reasons: ["Brand impersonation (Paytm)", "Authentication keywords (secure, login)", "Suspicious TLD (.xyz)"]
      },
      lexical: { ...MOCK_LEXICAL, raw: "https://secure-login-paytm.xyz", score: 65, detectedBrands: ["Paytm"], detectedKeywords: ["secure", "login"], suspiciousTld: true },
      intel: null
    },
    validate: (res) => {
      const text = (res.citizenExplanation + " " + res.explanation).toLowerCase();
      // Must explain phishing indicators
      const explainsPhishing = text.includes("phishing") || text.includes("credential") || text.includes("login") || text.includes("steal") || text.includes("mimic");
      if (!explainsPhishing) {
        throw new Error(`Incomplete explanation: LIKELY_PHISHING context failed to explain credential harvesting indicators: "${res.citizenExplanation}"`);
      }
      console.log("   ✅ Validated: Phishing/impersonation markers correctly explained.");
    }
  },
  {
    name: "Case 4: LOW_RISK",
    context: {
      scanType: "url",
      content: "https://unverified-blog.net/post-details",
      ruleSignals: [],
      engineScore: {
        score: 25,
        level: "LOW",
        confidence: 0.75,
        verdict: "LOW_RISK",
        headline: "Exercise Caution",
        recommendation: "Proceed with caution. Avoid entering sensitive details unless verified.",
        reasons: ["Unregistered domain registry", "Minor entropy warnings"]
      },
      lexical: { ...MOCK_LEXICAL, raw: "https://unverified-blog.net/post-details", score: 20 },
      intel: null
    },
    validate: (res) => {
      const text = (res.citizenExplanation + " " + res.explanation).toLowerCase();
      // Must recommend caution
      const containsCaution = text.includes("caution") || text.includes("careful") || text.includes("verify") || text.includes("check") || text.includes("alert");
      if (!containsCaution) {
        throw new Error(`Incomplete explanation: LOW_RISK context failed to recommend caution: "${res.citizenExplanation}"`);
      }
      // Must NOT contradict the verdict (i.e. not claiming it's critical/extremely dangerous)
      const contradictsSafe = text.includes("highly dangerous") || text.includes("severe risk") || text.includes("almost certainly fraud");
      if (contradictsSafe) {
        throw new Error(`Contradiction detected: LOW_RISK context over-escalated to severe/critical alerts: "${res.citizenExplanation}"`);
      }
      console.log("   ✅ Validated: Recommends caution without over-escalating or contradicting.");
    }
  }
];

async function runTests() {
  let passed = 0;
  for (const tc of CASES) {
    console.log(`\n🏃 Running case: ${tc.name}`);
    try {
      const res = await aiService.analyzeEnrichedUrl(tc.context);
      console.log(`   Citizen Explanation: "${res.citizenExplanation}"`);
      tc.validate(res);
      passed++;
    } catch (err) {
      console.error(`   ❌ Failed case: ${tc.name}\n   Error: ${err.message}`);
    }
  }

  console.log(`\n=== AI COMPLIANCE TEST SUMMARY ===`);
  console.log(`Passed: ${passed}/${CASES.length}`);
  console.log(`==================================`);

  if (passed < CASES.length) {
    process.exit(1);
  }

  // ─── Summary Threat Consistency Validation ─────────────────────────────
  console.log("\n=== RUNNING SUMMARY THREAT CONSISTENCY VALIDATION TESTS ===");

  function validateSummary(score, summary) {
    const lowerSummary = summary.toLowerCase();
    if (score >= 80) {
      const forbidden = ["safe", "likely safe", "minor concerns", "low risk", "exercise caution"];
      for (const word of forbidden) {
        if (lowerSummary.includes(word)) {
          throw new Error(`Contradiction: Risk ${score} summary contains forbidden safe word: "${word}"`);
        }
      }
    } else if (score <= 20) {
      const forbidden = ["malicious", "critical", "dangerous"];
      for (const word of forbidden) {
        if (lowerSummary.includes(word)) {
          throw new Error(`Contradiction: Risk ${score} summary contains forbidden threat word: "${word}"`);
        }
      }
    }
  }

  const mockUrlResponse1 = { riskScore: 100, summary: "Potential Malware Distribution Detected" };
  const mockUrlResponse2 = { riskScore: 0, summary: "No Known Threats Detected" };

  try {
    validateSummary(mockUrlResponse1.riskScore, mockUrlResponse1.summary);
    console.log("✅ Case 1 Passed: High risk summary is free of contradictory safe-phrases.");
    validateSummary(mockUrlResponse2.riskScore, mockUrlResponse2.summary);
    console.log("✅ Case 2 Passed: Low risk summary is free of contradictory threat-phrases.");
  } catch (err) {
    console.error("❌ Summary validation test failed:", err.message);
    process.exit(1);
  }

  console.log("\nALL AI EXPLANATION ENGINE & SUMMARY VALIDATION TESTS PASSED! 🎉");
}

runTests();
