export interface ASN {
  number: number;
  org: string;
  type: "hosting" | "isp" | "cloud" | "edu" | "gov" | "unknown";
}

export interface Geo {
  country: string;
  city: string;
  lat: number;
  lon: number;
  accuracy_km: number;
}

export interface NetworkFlags {
  is_hosting?: boolean;
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
}

export interface Reputation {
  abuseipdb_score?: number;
  abuseipdb_reports?: number;
  greynoise_classification?: "malicious" | "benign" | "unknown";
  blocklist_hits?: string[];
}

export interface InternalTelemetry {
  cybershield_report_count: number;
  first_seen: Date;
  last_seen: Date;
}

export interface SourceStatusDetail {
  status: "ok" | "failed" | "timeout" | "not_configured";
  latency_ms: number;
  error?: string;
}

export interface ScoreBreakdown {
  indicator: string;
  points: number;
  category: "network_flags" | "reputation" | "internal";
}

export interface NetworkOwnership {
  cidr?: string;
  cidrs?: string[];
  abuse_contact?: string;
  allocation_date?: string;
  registration_country?: string;
}

export interface LookupHistoryItem {
  timestamp: Date;
  risk_score: number;
}

export interface IPEntity {
  ip: string;
  asn?: ASN;
  geo?: Geo;
  network_flags?: NetworkFlags;
  reputation?: Reputation;
  internal?: InternalTelemetry;
  network_ownership?: NetworkOwnership;
  risk_score?: number;
  score_breakdown?: ScoreBreakdown[];
  confidence?: "high" | "medium" | "low";
  source_status?: Record<string, SourceStatusDetail>;
  last_checked?: Date;
  cache_expires_at?: Date;
}
