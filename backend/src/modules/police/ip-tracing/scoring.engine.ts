import fs from "fs";
import path from "path";
import { IPEntity, ScoreBreakdown } from "./types/IPEntity.js";

export class ScoringEngine {
  private weights: any;

  constructor() {
    const weightsPath = path.resolve(__dirname, "./config/scoringWeights.json");
    this.weights = JSON.parse(fs.readFileSync(weightsPath, "utf-8")).weights;
  }

  public calculateScore(entity: IPEntity): IPEntity {
    let score = 0;
    const breakdown: ScoreBreakdown[] = [];

    // 1. Tor Exit Node
    if (entity.network_flags?.is_tor) {
      score += this.weights.tor_exit;
      breakdown.push({
        indicator: "IP is a known Tor exit node",
        points: this.weights.tor_exit,
        category: "network_flags",
      });
    }

    // 2. VPN / Proxy
    if (entity.network_flags?.is_vpn) {
      score += this.weights.vpn;
      breakdown.push({
        indicator: "IP is a known VPN",
        points: this.weights.vpn,
        category: "network_flags",
      });
    }
    if (entity.network_flags?.is_proxy) {
      score += this.weights.proxy;
      breakdown.push({
        indicator: "IP is a known proxy",
        points: this.weights.proxy,
        category: "network_flags",
      });
    }

    // 3. Hosting Provider
    if (entity.network_flags?.is_hosting) {
      score += this.weights.hosting_provider;
      breakdown.push({
        indicator: "IP belongs to a hosting/cloud provider",
        points: this.weights.hosting_provider,
        category: "network_flags",
      });
    }

    // 4. AbuseIPDB
    if (entity.reputation?.abuseipdb_score && entity.reputation.abuseipdb_score > 0) {
      const points = entity.reputation.abuseipdb_score * this.weights.abuseipdb_score_multiplier;
      score += points;
      breakdown.push({
        indicator: `AbuseIPDB confidence score is ${entity.reputation.abuseipdb_score}%`,
        points,
        category: "reputation",
      });
    }

    // 5. GreyNoise
    if (entity.reputation?.greynoise_classification === "malicious") {
      score += this.weights.greynoise_malicious;
      breakdown.push({
        indicator: "GreyNoise classified this IP as malicious (mass scanner/actor)",
        points: this.weights.greynoise_malicious,
        category: "reputation",
      });
    } else if (entity.reputation?.greynoise_classification === "benign") {
      score -= 20; // Reduce score if benign
      breakdown.push({
        indicator: "GreyNoise classified this IP as benign",
        points: -20,
        category: "reputation",
      });
    }

    // 6. Internal Telemetry
    if (
      entity.internal?.cybershield_report_count &&
      entity.internal.cybershield_report_count >= this.weights.internal_telemetry_threshold
    ) {
      score += this.weights.internal_telemetry_penalty;
      breakdown.push({
        indicator: `IP has been reported ${entity.internal.cybershield_report_count} times internally`,
        points: this.weights.internal_telemetry_penalty,
        category: "internal",
      });
    }

    // Cap score at 100 and floor at 0
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Assign confidence based on source statuses
    let confidence: "high" | "medium" | "low" = "high";

    if (entity.source_status) {
      let failedSources = 0;
      let reputationFailed = 0;
      const reputationAdapters = ["AbuseIPDB", "GreyNoise"];

      for (const [adapterName, statusDetail] of Object.entries(entity.source_status)) {
        if (statusDetail.status === "failed" || statusDetail.status === "timeout") {
          failedSources++;
          if (reputationAdapters.includes(adapterName)) {
            reputationFailed++;
          }
        }
      }

      if (failedSources >= 3 || reputationFailed === reputationAdapters.length) {
        confidence = "low";
      } else if (failedSources >= 1) {
        confidence = "medium";
      }
    }

    entity.risk_score = score;
    entity.score_breakdown = breakdown;
    entity.confidence = confidence;

    return entity;
  }
}
