import { env } from "./env.js";

export const aiConfig = {
  provider: env.AI_PROVIDER,
  preferredModel: env.AI_PREFERRED_MODEL,
  fallbackModels: (env.AI_FALLBACK_MODELS || "").split(",").map(m => m.trim()).filter(Boolean),
  temperature: env.AI_TEMPERATURE,
  topP: env.AI_TOP_P,
  maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
  timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
  retryCount: env.AI_MAX_RETRIES,
  retryDelayMs: env.AI_RETRY_DELAY_MS,
  isDegraded: false,
  activeModel: env.AI_PREFERRED_MODEL,
  modelRefreshIntervalMinutes: env.AI_MODEL_REFRESH_INTERVAL_MINUTES,
  exhaustedModelCooldownMinutes: env.AI_EXHAUSTED_MODEL_COOLDOWN_MINUTES,
  startupSelfTest: env.AI_STARTUP_SELF_TEST,
  enableModelDiscovery: env.AI_ENABLE_MODEL_DISCOVERY,

  gemini: {
    apiKey: env.GEMINI_API_KEY || "",
    model: env.AI_PREFERRED_MODEL, // Link gemini.model to preferredModel dynamically
    baseUrl: env.GEMINI_BASE_URL,
  },

  cache: {
    scanCacheEnabled: env.AI_SCAN_CACHE_ENABLED,
    chatCacheEnabled: env.AI_CHAT_CACHE_ENABLED,
    scanCacheTtlDays: env.AI_SCAN_CACHE_TTL_DAYS,
    chatCacheTtlDays: env.AI_CHAT_CACHE_TTL_DAYS,
  },

  circuitBreaker: {
    enabled: env.AI_CIRCUIT_BREAKER_ENABLED,
    failures: env.AI_CIRCUIT_BREAKER_FAILURES,
    timeoutSeconds: env.AI_CIRCUIT_BREAKER_TIMEOUT_SECONDS,
  },

  retry: {
    maxRetries: env.AI_MAX_RETRIES,
    requestTimeoutMs: env.AI_REQUEST_TIMEOUT_MS,
    retryDelayMs: env.AI_RETRY_DELAY_MS,
  },

  routing: {
    useForSafeScans: env.AI_USE_FOR_SAFE_SCANS,
    useForLowScans: env.AI_USE_FOR_LOW_SCANS,
    useForMediumScans: env.AI_USE_FOR_MEDIUM_SCANS,
    useForHighScans: env.AI_USE_FOR_HIGH_SCANS,
    useForCriticalScans: env.AI_USE_FOR_CRITICAL_SCANS,
  },

  aegis: {
    maxContextMessages: env.AEGIS_MAX_CONTEXT_MESSAGES,
    maxRecentScans: env.AEGIS_MAX_RECENT_SCANS,
    maxRecentReports: env.AEGIS_MAX_RECENT_REPORTS,
    contextCompression: env.AEGIS_CONTEXT_COMPRESSION,
  },

  logging: {
    debugLogging: env.AI_DEBUG_LOGGING,
  },
};

export function validateAIConfig(): void {
  const provider = aiConfig.provider.toLowerCase();
  if (provider === "gemini") {
    if (!aiConfig.gemini.apiKey) {
      throw new Error("Configuration Error: GEMINI_API_KEY is not configured.");
    }
    if (!aiConfig.preferredModel) {
      throw new Error("Configuration Error: AI_PREFERRED_MODEL is not configured.");
    }
  } else if (provider === "nvidia") {
    if (!env.NVIDIA_API_KEY) {
      throw new Error("Configuration Error: NVIDIA_API_KEY is not configured.");
    }
  } else if (provider !== "mock") {
    throw new Error(`Configuration Error: Unknown AI provider "${provider}"`);
  }

  // Validate numeric parameters
  if (aiConfig.temperature < 0 || aiConfig.temperature > 2) {
    throw new Error(`Configuration Error: AI_TEMPERATURE must be between 0 and 2. Got ${aiConfig.temperature}`);
  }
  if (aiConfig.topP < 0 || aiConfig.topP > 1) {
    throw new Error(`Configuration Error: AI_TOP_P must be between 0 and 1. Got ${aiConfig.topP}`);
  }
  if (aiConfig.maxOutputTokens <= 0) {
    throw new Error(`Configuration Error: AI_MAX_OUTPUT_TOKENS must be greater than 0. Got ${aiConfig.maxOutputTokens}`);
  }
  if (aiConfig.timeoutMs <= 0) {
    throw new Error(`Configuration Error: AI_REQUEST_TIMEOUT_MS must be greater than 0. Got ${aiConfig.timeoutMs}`);
  }
  if (aiConfig.retryCount < 0) {
    throw new Error(`Configuration Error: AI_MAX_RETRIES must be 0 or greater. Got ${aiConfig.retryCount}`);
  }
}
