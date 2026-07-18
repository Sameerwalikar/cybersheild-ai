import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // ── AI Provider ──────────────────────────────────────────────────
  AI_PROVIDER: z.string().default("mock"),
  AI_PREFERRED_MODEL: z.string().default("gemini-1.5-flash"),
  AI_FALLBACK_MODELS: z.string().default("gemini-1.5-pro,gemini-2.0-flash-exp"),
  AI_TEMPERATURE: z.coerce.number().default(0.2),
  AI_TOP_P: z.coerce.number().default(0.8),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().default(1024),

  // Gemini
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_BASE_URL: z.string().default("https://generativelanguage.googleapis.com/v1beta"),

  // NVIDIA NIM (legacy — still fully supported)
  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_BASE_URL: z.string().optional(),
  NVIDIA_TEXT_MODEL: z.string().optional(),
  NVIDIA_VISION_MODEL: z.string().optional(),

  // AI Cache
  AI_SCAN_CACHE_ENABLED: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
  AI_CHAT_CACHE_ENABLED: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
  AI_SCAN_CACHE_TTL_DAYS: z.coerce.number().default(7),
  AI_CHAT_CACHE_TTL_DAYS: z.coerce.number().default(30),

  // Circuit Breaker
  AI_CIRCUIT_BREAKER_ENABLED: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
  AI_CIRCUIT_BREAKER_FAILURES: z.coerce.number().default(5),
  AI_CIRCUIT_BREAKER_TIMEOUT_SECONDS: z.coerce.number().default(120),

  // Retry Policy
  AI_MAX_RETRIES: z.coerce.number().default(2),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().default(20000),
  AI_RETRY_DELAY_MS: z.coerce.number().default(1500),

  // AI Routing
  AI_USE_FOR_SAFE_SCANS: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  AI_USE_FOR_LOW_SCANS: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  AI_USE_FOR_MEDIUM_SCANS: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
  AI_USE_FOR_HIGH_SCANS: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),
  AI_USE_FOR_CRITICAL_SCANS: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),

  // AEGIS
  AEGIS_MAX_CONTEXT_MESSAGES: z.coerce.number().default(10),
  AEGIS_MAX_RECENT_SCANS: z.coerce.number().default(3),
  AEGIS_MAX_RECENT_REPORTS: z.coerce.number().default(2),
  AEGIS_CONTEXT_COMPRESSION: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),

  // Logging
  AI_DEBUG_LOGGING: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),

  // Quota & Model selection configuration
  AI_MODEL_REFRESH_INTERVAL_MINUTES: z.coerce.number().default(60),
  AI_EXHAUSTED_MODEL_COOLDOWN_MINUTES: z.coerce.number().default(15),
  AI_STARTUP_SELF_TEST: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  AI_ENABLE_MODEL_DISCOVERY: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(true),

  // ── Threat Intelligence APIs ─────────────────────────────────────
  GOOGLE_SAFE_BROWSING_API_KEY: z.string().optional(),
  VIRUSTOTAL_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
