import { BaseAdapter } from "./BaseAdapter.js";
import { IPEntity } from "../types/IPEntity.js";
import { CacheService } from "../cache.service.js";

export class TorExitNodeAdapter extends BaseAdapter {
  private cache: CacheService;
  private readonly CACHE_KEY = "tor_exit_nodes";
  private readonly CACHE_TTL_SECONDS = 3600; // 1 hour
  private readonly TOR_LIST_URL = "https://check.torproject.org/torbulkexitlist";

  constructor(cacheService: CacheService) {
    super("Tor Exit Node List");
    this.cache = cacheService;
  }

  private async fetchAndCacheList(): Promise<void> {
    try {
      console.log(`[TorExitNodeAdapter] Fetching latest Tor exit node list...`);
      
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(this.TOR_LIST_URL, { signal: controller.signal });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`Failed to fetch Tor exit list: ${response.statusText}`);
      }

      const text = await response.text();
      const ips = text.split("\n").map((ip) => ip.trim()).filter((ip) => ip !== "");

      if (ips.length > 0) {
        this.cache.delete(this.CACHE_KEY);
        this.cache.sadd(this.CACHE_KEY, ips);
        this.cache.expire(this.CACHE_KEY, this.CACHE_TTL_SECONDS);
        console.log(`[TorExitNodeAdapter] Cached ${ips.length} Tor exit nodes.`);
      }
    } catch (error: any) {
      console.error(`[TorExitNodeAdapter] Failed to fetch Tor exit list:`, error.message);
    }
  }

  protected async enrichImpl(ip: string): Promise<Partial<IPEntity>> {
    try {
      let isTor = false;
      const exists = this.cache.has(this.CACHE_KEY);

      if (!exists) {
        await this.fetchAndCacheList();
      }

      isTor = this.cache.sismember(this.CACHE_KEY, ip);

      return {
        network_flags: {
          is_tor: isTor,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
