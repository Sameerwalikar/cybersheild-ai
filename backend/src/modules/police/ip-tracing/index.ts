import { CacheService } from "./cache.service.js";
import { MaxMindAdapter } from "./adapters/MaxMindAdapter.js";
import { AbuseIPDBAdapter } from "./adapters/AbuseIPDBAdapter.js";
import { TorExitNodeAdapter } from "./adapters/TorExitNodeAdapter.js";
import { RDAPAdapter } from "./adapters/RDAPAdapter.js";
import { GreyNoiseAdapter } from "./adapters/GreyNoiseAdapter.js";
import { InternalTelemetryAdapter } from "./adapters/InternalTelemetryAdapter.js";
import { IpTracingService } from "./ip-tracing.service.js";
import { IpTracingController } from "./ip-tracing.controller.js";
import { prisma } from "../../../config/index.js";

const cacheService = new CacheService();

const maxMindAdapter = new MaxMindAdapter();
maxMindAdapter.initialize().catch((err) => {
  console.error("[IpTracing] Failed to initialize MaxMind databases:", err.message);
});

const abuseIPDBAdapter = new AbuseIPDBAdapter();
const torExitNodeAdapter = new TorExitNodeAdapter(cacheService);
const rdapAdapter = new RDAPAdapter();
const greyNoiseAdapter = new GreyNoiseAdapter();
const internalTelemetryAdapter = new InternalTelemetryAdapter(prisma);

const adapters = [
  maxMindAdapter,
  abuseIPDBAdapter,
  torExitNodeAdapter,
  rdapAdapter,
  greyNoiseAdapter,
];

const ipTracingService = new IpTracingService(
  adapters,
  internalTelemetryAdapter,
  cacheService
);

export const ipTracingController = new IpTracingController(
  ipTracingService,
  abuseIPDBAdapter
);
