import { env } from "./env.js";

export const aiConfig = {
  provider: env.AI_PROVIDER,

  gemini: {
    apiKey: env.GEMINI_API_KEY || "",
    model: env.GEMINI_MODEL,
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
