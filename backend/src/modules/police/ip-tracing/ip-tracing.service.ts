import fs from "fs";
import path from "path";
import { IPEntity } from "./types/IPEntity.js";
import { BaseAdapter } from "./adapters/BaseAdapter.js";
import { ScoringEngine } from "./scoring.engine.js";
import { CacheService } from "./cache.service.js";
import { InternalTelemetryAdapter } from "./adapters/InternalTelemetryAdapter.js";

export class IpTracingService {
  private adapters: BaseAdapter[];
  private scoringEngine: ScoringEngine;
  private cache: CacheService;
  private internalAdapter: InternalTelemetryAdapter;
  private asnClassification: { hosting: string[]; isp: string[] };

  constructor(
    adapters: BaseAdapter[],
    internalAdapter: InternalTelemetryAdapter,
    cache: CacheService
  ) {
    this.adapters = adapters;
    this.internalAdapter = internalAdapter;
    this.scoringEngine = new ScoringEngine();
    this.cache = cache;

    const configPath = path.resolve(__dirname, "./config/asnClassification.json");
    this.asnClassification = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }

  public async getRiskProfile(ip: string, bypassCache: boolean = false): Promise<IPEntity> {
    const cacheKey = `ip_enrichment:${ip}`;

    await this.internalAdapter.recordSighting(ip).catch(console.error);

    if (!bypassCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const cachedEntity = cached as IPEntity;
        if (cachedEntity.internal) {
          cachedEntity.internal.cybershield_report_count =
            (cachedEntity.internal.cybershield_report_count || 0) + 1;
          cachedEntity.internal.last_seen = new Date();
        }
        return this.scoringEngine.calculateScore(cachedEntity);
      }
    }

    const promises = this.adapters.map((adapter) => adapter.enrich(ip));
    promises.push(this.internalAdapter.enrich(ip));

    const results = await Promise.allSettled(promises);

    let baseEntity: IPEntity = { ip, source_status: {} };

    for (const result of results) {
      if (result.status === "fulfilled") {
        const data = result.value;
        if (data.asn) baseEntity.asn = { ...baseEntity.asn, ...data.asn } as any;
        if (data.geo) baseEntity.geo = { ...baseEntity.geo, ...data.geo } as any;
        if (data.network_flags)
          baseEntity.network_flags = {
            ...baseEntity.network_flags,
            ...data.network_flags,
          };
        if (data.reputation)
          baseEntity.reputation = { ...baseEntity.reputation, ...data.reputation };
        if (data.internal)
          baseEntity.internal = { ...baseEntity.internal, ...data.internal } as any;
        if (data.network_ownership)
          baseEntity.network_ownership = {
            ...baseEntity.network_ownership,
            ...data.network_ownership,
          };
        if (data.source_status) {
          baseEntity.source_status = {
            ...baseEntity.source_status,
            ...data.source_status,
          };
        }
      }
    }

    // Augment is_hosting flag and set ASN type
    if (baseEntity.asn?.org) {
      const org = baseEntity.asn.org.toLowerCase();
      let type: "hosting" | "isp" | "cloud" | "edu" | "gov" | "unknown" = "unknown";
      let is_hosting = false;

      if (this.asnClassification.hosting.some((kw) => org.includes(kw))) {
        type = "hosting";
        is_hosting = true;
      } else if (this.asnClassification.isp.some((kw) => org.includes(kw))) {
        type = "isp";
      }

      baseEntity.asn.type = type;
      if (is_hosting) {
        baseEntity.network_flags = {
          ...baseEntity.network_flags,
          is_hosting: true,
        };
      }
    }

    const scoredEntity = this.scoringEngine.calculateScore(baseEntity);

    scoredEntity.last_checked = new Date();
    const ttlSeconds = 300; // 5 minutes cache TTL
    scoredEntity.cache_expires_at = new Date(Date.now() + ttlSeconds * 1000);

    this.cache.set(cacheKey, scoredEntity, ttlSeconds);

    return scoredEntity;
  }
}
