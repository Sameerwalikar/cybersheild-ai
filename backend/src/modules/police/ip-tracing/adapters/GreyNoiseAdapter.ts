import { BaseAdapter } from "./BaseAdapter.js";
import { IPEntity } from "../types/IPEntity.js";

export class GreyNoiseAdapter extends BaseAdapter {
  private apiKey: string;
  private endpoint = "https://api.greynoise.io/v3/community";

  constructor() {
    super("GreyNoise Community");
    this.apiKey = process.env.GREYNOISE_API_KEY || "";
  }

  protected async enrichImpl(ip: string): Promise<Partial<IPEntity>> {
    if (!this.apiKey) {
      throw new Error("API Key not set");
    }

    const url = `${this.endpoint}/${ip}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "key": this.apiKey,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(id);

      if (response.status === 404) {
        // GreyNoise returns 404 for "IP not observed"
        return {
          reputation: {
            greynoise_classification: "unknown",
          },
        };
      }

      if (!response.ok) {
        throw new Error(`GreyNoise API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      let classification: "malicious" | "benign" | "unknown" = "unknown";

      if (data.classification === "malicious") {
        classification = "malicious";
      } else if (data.classification === "benign") {
        classification = "benign";
      }

      return {
        reputation: {
          greynoise_classification: classification,
        },
      };
    } catch (error: any) {
      clearTimeout(id);
      if (error.status === 404 || error.response?.status === 404) {
        return {
          reputation: {
            greynoise_classification: "unknown",
          },
        };
      }
      throw error;
    }
  }
}
