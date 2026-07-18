// Test suite for UPI Threat Intelligence Engine
// Run with: npx tsx _upi_test.mjs

import { analyzeUpi } from './src/modules/scanner/risk-engine.js';
import { upiReputationRepository } from './src/modules/scanner/upiReputation.repository.js';
import { prisma } from './src/config/database.js';

console.log("=== RUNNING UPI THREAT INTEL ENGINE TESTS ===\n");

async function runUpiTests() {
  // Test case 1: Brand Impersonation and Fraud Naming Pattern
  const res1 = await analyzeUpi("claim-refund@oksbi");
  console.log("UPI: claim-refund@oksbi");
  console.log(`Score: ${res1.riskScore} | Level: ${res1.riskLevel}`);
  console.log("Signals:", res1.signals.map(s => s.label).join(", "));
  console.log(`Summary: "${res1.summary}"`);
  console.log(`Recommendation: "${res1.recommendation}"`);
  console.log("");
  
  if (res1.riskScore < 60) {
    throw new Error("Test 1 failed: claim-refund@oksbi should be flagged high/critical risk!");
  }

  // Test case 2: Paytm Official impersonation
  const res2 = await analyzeUpi("paytm-security@ybl");
  console.log("UPI: paytm-security@ybl");
  console.log(`Score: ${res2.riskScore} | Level: ${res2.riskLevel}`);
  console.log("Signals:", res2.signals.map(s => s.label).join(", "));
  console.log("");

  if (res2.riskScore < 40) {
    throw new Error("Test 2 failed: paytm-security@ybl should be flagged brand impersonation!");
  }

  // Test case 3: Internal Reputation Database integration
  console.log("Upserting reputation for testing-reputation@upi...");
  await upiReputationRepository.upsertReputation("testing-reputation@upi", 90, 5);
  
  const res3 = await analyzeUpi("testing-reputation@upi");
  console.log("UPI: testing-reputation@upi (After 5 reports)");
  console.log(`Score: ${res3.riskScore} | Level: ${res3.riskLevel}`);
  console.log("Signals:", res3.signals.map(s => s.label).join(", "));
  console.log("");

  if (!res3.signals.some(s => s.label === "Previously Reported")) {
    throw new Error("Test 3 failed: Previously Reported signal was not triggered!");
  }

  // Clean up
  await prisma.uPIReputation.deleteMany({ where: { upiId: "testing-reputation@upi" } });

  console.log("ALL UPI THREAT ENGINE TESTS PASSED SUCCESSFULLY! 🎉");
}

runUpiTests().catch(err => {
  console.error("❌ UPI test failed:", err.message);
  process.exit(1);
});
