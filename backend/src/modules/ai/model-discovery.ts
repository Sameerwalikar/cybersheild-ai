import { aiConfig } from "../../config/ai.config.js";

function parseVersion(name: string): number[] {
  const match = name.match(/gemini-(\d+)\.(\d+)/);
  if (match) {
    return [parseInt(match[1], 10), parseInt(match[2], 10)];
  }
  const singleMatch = name.match(/gemini-(\d+)/);
  if (singleMatch) {
    return [parseInt(singleMatch[1], 10), 0];
  }
  return [0, 0];
}

function compareModels(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);
  if (vA[0] !== vB[0]) {
    return vB[0] - vA[0]; // Newer (larger major version) first
  }
  return vB[1] - vA[1]; // Newer (larger minor version) first
}

export class ModelDiscoveryService {
  private static instance: ModelDiscoveryService | null = null;
  private discovered: string[] = [];
  private activeModel: string = aiConfig.preferredModel;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ModelDiscoveryService {
    if (!ModelDiscoveryService.instance) {
      ModelDiscoveryService.instance = new ModelDiscoveryService();
    }
    return ModelDiscoveryService.instance;
  }

  getActiveModel(): string {
    return this.activeModel;
  }

  setActiveModel(model: string): void {
    this.activeModel = model;
    aiConfig.activeModel = model;
  }

  async start(): Promise<void> {
    await this.discover();
    
    // Refresh periodically (every hour)
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.discover().catch((err) => {
          console.error("[Model Discovery] Scheduled discovery failed:", err.message);
        });
      }, 3600000);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async discover(): Promise<void> {
    if (aiConfig.provider.toLowerCase() !== "gemini") {
      this.activeModel = aiConfig.preferredModel;
      aiConfig.activeModel = aiConfig.preferredModel;
      return;
    }

    const url = `${aiConfig.gemini.baseUrl}/models?key=${aiConfig.gemini.apiKey}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(`Google API returned ${res.status}: ${bodyText}`);
      }

      const data = (await res.json()) as any;
      if (data && Array.isArray(data.models)) {
        // Filter only models supporting generateContent
        this.discovered = data.models
          .filter((m: any) => {
            const methods = Array.isArray(m.supportedGenerationMethods)
              ? m.supportedGenerationMethods
              : [];
            return methods.some(
              (method: string) => method.toLowerCase() === "generatecontent"
            );
          })
          .map((m: any) => m.name.replace(/^models\//, ""));
      } else {
        this.discovered = [];
      }
    } catch (err: any) {
      console.warn(`[Model Discovery] Discovery call failed: ${err.message}. Using cache.`);
    }

    this.selectAndLogModel();
  }

  private selectAndLogModel(): void {
    if (this.discovered.length === 0) {
      console.warn(`[Model Discovery] No discovered models. Reverting to preferred model: ${aiConfig.preferredModel}`);
      this.setActiveModel(aiConfig.preferredModel);
      return;
    }

    console.log("\n--- Discovered Models ---");
    this.discovered.forEach((model) => {
      console.log(`✓ ${model}`);
    });

    const preferred = aiConfig.preferredModel;
    if (this.discovered.includes(preferred)) {
      this.setActiveModel(preferred);
      console.log(`\nSelected Model: ${this.activeModel} (Preferred)`);
      console.log("-------------------------\n");
      return;
    }

    // Try fallbacks
    for (const fallback of aiConfig.fallbackModels) {
      if (this.discovered.includes(fallback)) {
        this.setActiveModel(fallback);
        console.log(`\nSelected Model: ${this.activeModel} (Fallback)`);
        console.log("-------------------------\n");
        return;
      }
    }

    // Try newest Flash
    const flashModels = this.discovered
      .filter((m) => m.toLowerCase().includes("flash"))
      .sort(compareModels);
    if (flashModels.length > 0) {
      this.setActiveModel(flashModels[0]);
      console.log(`\nSelected Model: ${this.activeModel} (Newest Flash)`);
      console.log("-------------------------\n");
      return;
    }

    // Try newest Pro
    const proModels = this.discovered
      .filter((m) => m.toLowerCase().includes("pro"))
      .sort(compareModels);
    if (proModels.length > 0) {
      this.setActiveModel(proModels[0]);
      console.log(`\nSelected Model: ${this.activeModel} (Newest Pro)`);
      console.log("-------------------------\n");
      return;
    }

    console.warn(`\n[Model Discovery] Could not find any compatible models. Using preferred default: ${preferred}`);
    this.setActiveModel(preferred);
    console.log("-------------------------\n");
  }
}
