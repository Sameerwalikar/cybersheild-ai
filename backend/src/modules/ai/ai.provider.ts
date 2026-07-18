import type { AIProvider } from "./types.js";
import { MockProvider }  from "./providers/mock.provider.js";
import { NvidiaProvider } from "./providers/nvidia.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { aiConfig, validateAIConfig } from "../../config/ai.config.js";
import { ModelDiscoveryService } from "./model-discovery.js";

let provider: AIProvider | null = null;

/**
 * Returns the singleton AI provider selected by the AI_PROVIDER config.
 */
export function getAIProvider(): AIProvider {
  if (provider) return provider;

  const selected = (aiConfig.provider || "gemini").toLowerCase();

  switch (selected) {
    case "gemini":
      provider = new GeminiProvider();
      break;
    case "nvidia":
      provider = new NvidiaProvider();
      break;
    case "mock":
    default:
      provider = new MockProvider();
      break;
  }

  return provider;
}

/**
 * Validates configuration and runs a lightweight capability self-test on startup.
 */
export async function initAI(): Promise<void> {
  try {
    validateAIConfig();
  } catch (err: any) {
    console.error(`❌ AI Configuration validation failed: ${err.message}`);
    aiConfig.isDegraded = true;
    return;
  }

  console.log(`🤖 AI Provider: ${aiConfig.provider.toUpperCase()}`);
  console.log(`⚙️  Preferred Model: ${aiConfig.preferredModel}`);
  console.log(`⚙️  Fallback Models: ${aiConfig.fallbackModels.join(", ") || "None"}`);
  console.log(`⚙️  Timeout: ${aiConfig.timeoutMs}ms`);
  console.log(`⚙️  Retries: ${aiConfig.retryCount}`);

  const p = getAIProvider();

  if (p instanceof GeminiProvider) {
    try {
      console.log("⚡ Starting Model Discovery Service...");
      await ModelDiscoveryService.getInstance().start();

      const activeModel = ModelDiscoveryService.getInstance().getActiveModel();

      const shouldRunSelfTest = aiConfig.startupSelfTest && process.env.NODE_ENV !== "development";

      if (shouldRunSelfTest) {
        console.log("⚡ Running AI capability self-test...");
        const startTest = Date.now();
        await p.analyzeText("test");
        const latency = Date.now() - startTest;

        console.log("✓ AI Provider Connected");
        console.log("✓ Authentication Successful");
        console.log(`✓ Model Verified (${activeModel})`);
        console.log("✓ AI Ready");
        console.log(`📊 Average Latency: ${latency}ms`);
      } else {
        console.log(`✓ AI Ready (Self-test skipped, active model: ${activeModel})`);
      }
    } catch (err: any) {
      console.error(`❌ AI startup self-test failed: ${err.message}`);
      aiConfig.isDegraded = true;
    }
  } else {
    console.log("✓ AI Ready (Mock/Nvidia)");
  }
}

/** Reset the singleton — used in tests or when env changes. */
export function resetProvider(): void {
  provider = null;
}
