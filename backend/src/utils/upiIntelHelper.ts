import { upiReputationRepository } from "../modules/scanner/upiReputation.repository.js";

/**
 * Searches a text block for any valid UPI patterns and upserts them into the internal reputation database.
 */
export async function checkAndUpsertUpiFromText(
  text: string,
  riskScore: number,
  reportCountDelta: number = 0
): Promise<void> {
  if (!text) return;

  // Simple regex to match standard UPI patterns (e.g. name@bank)
  const upiRegex = /[a-zA-Z0-9._-]+@[a-zA-Z]+/g;
  const matches = text.match(upiRegex);
  
  if (matches) {
    for (const match of matches) {
      try {
        await upiReputationRepository.upsertReputation(match, riskScore, reportCountDelta);
      } catch (err: any) {
        console.error(`[upiIntelHelper] Failed to upsert reputation for UPI: ${match}`, err?.message);
      }
    }
  }
}
