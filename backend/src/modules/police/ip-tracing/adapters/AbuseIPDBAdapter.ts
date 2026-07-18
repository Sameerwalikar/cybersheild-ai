import { BaseAdapter } from "./BaseAdapter.js";
import { IPEntity } from "../types/IPEntity.js";

export class AbuseIPDBAdapter extends BaseAdapter {
  private apiKey: string;
  private endpoint = "https://api.abuseipdb.com/api/v2/check";

  private dailyQuota = 1000;
  private currentCount = 0;
  private currentDay = new Date().toISOString().split("T")[0];

  constructor() {
    super("AbuseIPDB");
    this.apiKey = process.env.ABUSEIPDB_API_KEY || "";
  }

  public getQuota() {
    const today = new Date().toISOString().split("T")[0];
    if (this.currentDay !== today) {
      this.currentDay = today;
      this.currentCount = 0;
    }
    return {
      used: this.currentCount,
      limit: this.dailyQuota,
      remaining: this.dailyQuota - this.currentCount,
    };
  }

  protected async enrichImpl(ip: string): Promise<Partial<IPEntity>> {
    if (!this.apiKey) {
      throw new Error("API Key not set");
    }

    const today = new Date().toISOString().split("T")[0];
    if (this.currentDay !== today) {
      this.currentDay = today;
      this.currentCount = 0;
    }

    if (this.currentCount >= this.dailyQuota) {
      throw new Error("Daily quota exceeded for AbuseIPDB (1000/day)");
    }

    this.currentCount++;

    const url = new URL(this.endpoint);
    url.searchParams.append("ipAddress", ip);
    url.searchParams.append("maxAgeInDays", "90");

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Key": this.apiKey,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`AbuseIPDB API error: ${response.statusText}`);
    }

    const resJson: any = await response.json();
    const data = resJson?.data;

    if (data) {
      return {
        reputation: {
          abuseipdb_score: data.abuseConfidenceScore,
          abuseipdb_reports: data.totalReports,
        },
      };
    }

    return {};
  }
}
