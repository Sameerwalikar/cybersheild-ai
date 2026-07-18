import type { AIProvider } from "./types.js";
import { MockProvider }  from "./providers/mock.provider.js";
import { NvidiaProvider } from "./providers/nvidia.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";

let provider: AIProvider | null = null;

/**
 * Returns the singleton AI provider selected by the AI_PROVIDER env var.
 *
 * Priority / options:
 *   "gemini"  — Google Gemini 2.5 Flash (default)
 *   "nvidia"  — NVIDIA NIM (legacy, still fully supported)
 *   "mock"    — Deterministic stubs for testing
 */
export function getAIProvider(): AIProvider {
  if (provider) return provider;

  const selected = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  switch (selected) {
    case "gemini":
      provider = new GeminiProvider();
      console.log("🤖 AI Provider: Google Gemini (%s)", process.env.GEMINI_MODEL || "gemini-2.5-flash");
      break;
    case "nvidia":
      provider = new NvidiaProvider();
      console.log(
        "🤖 AI Provider: NVIDIA NIM (Text: %s, Vision: %s)",
        process.env.NVIDIA_TEXT_MODEL || "meta/llama-3.3-70b-instruct",
        process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-90b-vision-instruct",
      );
      break;
    case "mock":
    default:
      provider = new MockProvider();
      console.log("🤖 AI Provider: Mock (deterministic responses)");
      break;
  }

  return provider;
}

/** Reset the singleton — used in tests or when env changes. */
export function resetProvider(): void {
  provider = null;
}
