import maxmind, { Reader, CityResponse, AsnResponse } from "maxmind";
import { BaseAdapter } from "./BaseAdapter.js";
import { IPEntity } from "../types/IPEntity.js";
import path from "path";
import fs from "fs";

export class MaxMindAdapter extends BaseAdapter {
  private cityReader: Reader<CityResponse> | null = null;
  private asnReader: Reader<AsnResponse> | null = null;

  constructor() {
    super("MaxMind GeoLite2");
  }

  public async initialize(): Promise<void> {
    const cityDbPath = path.resolve(__dirname, "../../../../../data/GeoLite2-City.mmdb");
    const asnDbPath = path.resolve(__dirname, "../../../../../data/GeoLite2-ASN.mmdb");

    if (fs.existsSync(cityDbPath)) {
      this.cityReader = await maxmind.open<CityResponse>(cityDbPath);
      console.log(`[MaxMindAdapter] Loaded City DB`);
    } else {
      console.warn(`[MaxMindAdapter] City DB not found at ${cityDbPath}. Please run download-geoip script.`);
    }

    if (fs.existsSync(asnDbPath)) {
      this.asnReader = await maxmind.open<AsnResponse>(asnDbPath);
      console.log(`[MaxMindAdapter] Loaded ASN DB`);
    } else {
      console.warn(`[MaxMindAdapter] ASN DB not found at ${asnDbPath}. Please run download-geoip script.`);
    }
  }

  protected async enrichImpl(ip: string): Promise<Partial<IPEntity>> {
    const result: Partial<IPEntity> = {};

    try {
      if (this.cityReader) {
        const cityData = this.cityReader.get(ip);
        if (cityData) {
          result.geo = {
            country: cityData.country?.iso_code || cityData.registered_country?.iso_code || "Unknown",
            city: cityData.city?.names?.en || "Unknown",
            lat: cityData.location?.latitude || 0,
            lon: cityData.location?.longitude || 0,
            accuracy_km: cityData.location?.accuracy_radius || 0,
          };
        }
      }

      if (this.asnReader) {
        const asnData = this.asnReader.get(ip);
        if (asnData) {
          result.asn = {
            number: asnData.autonomous_system_number,
            org: asnData.autonomous_system_organization,
            type: "unknown",
          };
        }
      }
    } catch (error) {
      throw error;
    }

    return result;
  }
}
