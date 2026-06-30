import type { AIProvider } from "./types.js";
import { MockProvider } from "./providers/mock.provider.js";
import { NvidiaProvider } from "./providers/nvidia.provider.js";

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (provider) return provider;

  const selected = (process.env.AI_PROVIDER || "mock").toLowerCase();

  switch (selected) {
    case "nvidia":
      provider = new NvidiaProvider();
      console.log("🤖 AI Provider: NVIDIA NIM (Text: %s, Vision: %s)",
        process.env.NVIDIA_TEXT_MODEL || "meta/llama-3.3-70b-instruct",
        process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-90b-vision-instruct"
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

export function resetProvider(): void {
  provider = null;
}
