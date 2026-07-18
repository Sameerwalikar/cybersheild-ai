import { IPEntity } from "../types/IPEntity.js";

export abstract class BaseAdapter {
  protected adapterName: string;

  constructor(name: string) {
    this.adapterName = name;
  }

  protected abstract enrichImpl(ip: string): Promise<Partial<IPEntity>>;

  public async enrich(ip: string): Promise<Partial<IPEntity>> {
    const start = Date.now();
    try {
      const result = await this.enrichImpl(ip);
      const latency_ms = Date.now() - start;
      return {
        ...result,
        source_status: {
          [this.adapterName]: { status: "ok", latency_ms },
        },
      };
    } catch (error: any) {
      const latency_ms = Date.now() - start;
      const isTimeout = error.message?.toLowerCase().includes("timeout") || error.code === "ECONNABORTED";
      return {
        source_status: {
          [this.adapterName]: {
            status: isTimeout ? "timeout" : "failed",
            latency_ms,
            error: error.message,
          },
        },
      };
    }
  }

  public getName(): string {
    return this.adapterName;
  }
}
