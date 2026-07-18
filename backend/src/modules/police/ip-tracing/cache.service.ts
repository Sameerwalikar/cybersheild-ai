export class CacheService {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  public set(key: string, value: any, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  public get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  // Set-like operations for Tor exit nodes
  public sadd(key: string, values: string[]): void {
    const existing = this.get(key) || new Set<string>();
    for (const val of values) {
      existing.add(val);
    }
    // Default TTL for sets is 3600 seconds
    this.set(key, existing, 3600);
  }

  public sismember(key: string, value: string): boolean {
    const existing = this.get(key);
    if (existing instanceof Set) {
      return existing.has(value);
    }
    return false;
  }

  public expire(key: string, ttlSeconds: number): void {
    const item = this.cache.get(key);
    if (item) {
      item.expiry = Date.now() + ttlSeconds * 1000;
    }
  }
}
