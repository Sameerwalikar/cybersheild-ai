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

function getModelRank(model: string, preferred: string): number {
  const m = model.toLowerCase();
  
  // Rank 0: Preferred model from configuration
  if (m === preferred.toLowerCase()) return 0;
  
  // Rank 1: Stable "latest" aliases (e.g. gemini-flash-latest)
  if (m.endsWith("-latest")) return 1;
  
  const isExp = m.includes("experimental") || m.includes("exp") || m.includes("-exp");
  const isPreview = m.includes("preview");
  const isLite = m.includes("lite") || m.includes("flash-lite");

  // Rank 2: Stable production models (not experimental, not preview, not lite)
  if (!isExp && !isPreview && !isLite) return 2;
  
  // Rank 3: Flash Lite models
  if (isLite && !isExp && !isPreview) return 3;
  
  // Rank 4: Preview models
  if (isPreview) return 4;
  
  // Rank 5: Experimental models
  if (isExp) return 5;
  
  return 6;
}

export function rankAndSortModels(models: string[], preferred: string): string[] {
  return [...models].sort((a, b) => {
    const rankA = getModelRank(a, preferred);
    const rankB = getModelRank(b, preferred);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return compareModels(a, b);
  });
}

export class ModelDiscoveryService {
  private static instance: ModelDiscoveryService | null = null;
  private discovered: string[] = [];
  private activeModel: string = aiConfig.preferredModel;
  private intervalId: NodeJS.Timeout | null = null;
  private lastDiscoveryTime = 0;
  
  // Cache of exhausted models
  private exhaustedModels = new Map<string, { reason: string; expiresAt: number }>();

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
    aiConfig.gemini.model = model;
  }

  markExhausted(model: string, reason: string): void {
    const cooldownMs = (aiConfig.exhaustedModelCooldownMinutes || 15) * 60000;
    this.exhaustedModels.set(model, {
      reason,
      expiresAt: Date.now() + cooldownMs,
    });
    
    // Select the next available model
    const available = this.getAvailableModels();
    if (available.length > 0) {
      this.setActiveModel(available[0]);
    }
  }

  isExhausted(model: string): boolean {
    const entry = this.exhaustedModels.get(model);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.exhaustedModels.delete(model);
      return false;
    }
    return true;
  }

  getAvailableModels(): string[] {
    const preferred = aiConfig.preferredModel;
    const baseList = (aiConfig.enableModelDiscovery && this.discovered.length > 0)
      ? this.discovered
      : [preferred, ...aiConfig.fallbackModels];

    const uniqueList = Array.from(new Set(baseList));
    const available = uniqueList.filter((m) => !this.isExhausted(m));

    if (available.length === 0) {
      // Fallback of last resort
      return rankAndSortModels(uniqueList, preferred);
    }

    return rankAndSortModels(available, preferred);
  }

  getExhaustedModelsMap() {
    // Return a fresh map with expired items filtered out
    const result = new Map<string, { reason: string; expiresAt: number }>();
    for (const [model, val] of this.exhaustedModels.entries()) {
      if (Date.now() <= val.expiresAt) {
        result.set(model, val);
      } else {
        this.exhaustedModels.delete(model);
      }
    }
    return result;
  }

  async start(): Promise<void> {
    if (!aiConfig.enableModelDiscovery) {
      return;
    }
    await this.discover();
    
    // Refresh periodically
    if (!this.intervalId) {
      const intervalMs = (aiConfig.modelRefreshIntervalMinutes || 60) * 60 * 1000;
      this.intervalId = setInterval(() => {
        this.discover(true).catch((err) => {
          console.error("[Model Discovery] Scheduled discovery failed:", err.message);
        });
      }, intervalMs);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async discover(force: boolean = false): Promise<void> {
    if (aiConfig.provider.toLowerCase() !== "gemini") {
      this.activeModel = aiConfig.preferredModel;
      aiConfig.activeModel = aiConfig.preferredModel;
      return;
    }

    if (!aiConfig.enableModelDiscovery) {
      this.discovered = [];
      return;
    }

    const intervalMs = (aiConfig.modelRefreshIntervalMinutes || 60) * 60 * 1000;
    const now = Date.now();

    if (!force && this.discovered.length > 0 && (now - this.lastDiscoveryTime < intervalMs)) {
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
        this.lastDiscoveryTime = now;
      }
    } catch (err: any) {
      console.warn(`[Model Discovery] Discovery call failed: ${err.message}. Using cache.`);
    }

    this.selectAndLogModel();
  }

  private selectAndLogModel(): void {
    const available = this.getAvailableModels();
    if (available.length === 0) {
      this.setActiveModel(aiConfig.preferredModel);
      return;
    }

    this.setActiveModel(available[0]);

    if (aiConfig.logging.debugLogging) {
      console.log("\n--- Discovered Models ---");
      (this.discovered.length > 0 ? this.discovered : [aiConfig.preferredModel]).forEach((model) => {
        const status = this.isExhausted(model) ? " [Exhausted]" : "";
        console.log(`✓ ${model}${status}`);
      });
      console.log(`\nActive Model: ${this.activeModel}`);
      console.log("-------------------------\n");
    }
  }
}
