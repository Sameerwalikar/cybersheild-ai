import { BaseAdapter } from "./BaseAdapter.js";
import { IPEntity } from "../types/IPEntity.js";

export class RDAPAdapter extends BaseAdapter {
  constructor() {
    super("RDAP WHOIS");
  }

  protected async enrichImpl(ip: string): Promise<Partial<IPEntity>> {
    try {
      const url = `https://rdap.org/ip/${ip}`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/rdap+json",
        },
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`RDAP lookup failed: ${response.statusText}`);
      }

      const data: any = await response.json();
      const name = data.name?.toLowerCase() || "";
      const entities = data.entities || [];

      let isHosting = false;
      const hostingKeywords = [
        "cloud",
        "hosting",
        "datacenter",
        "aws",
        "amazon",
        "google",
        "azure",
        "digitalocean",
        "hetzner",
        "ovh",
      ];

      if (hostingKeywords.some((kw) => name.includes(kw))) {
        isHosting = true;
      } else {
        for (const entity of entities) {
          const vcardArray = entity.vcardArray || [];
          const vcardString = JSON.stringify(vcardArray).toLowerCase();
          if (hostingKeywords.some((kw) => vcardString.includes(kw))) {
            isHosting = true;
            break;
          }
        }
      }

      let cidr = "Not available";
      if (data.cidr0_cidrs && data.cidr0_cidrs.length > 0) {
        const c = data.cidr0_cidrs[0];
        cidr = `${c.v4prefix || c.v6prefix || ""}/${c.length || ""}`;
      } else if (data.startAddress && data.endAddress) {
        cidr = `${data.startAddress} - ${data.endAddress}`;
      }

      const registration_country = data.country || "Not available";
      let allocation_date = "Not available";
      if (data.events && Array.isArray(data.events)) {
        const regEvent = data.events.find(
          (e: any) =>
            e.eventAction === "registration" ||
            e.eventAction === "last changed" ||
            e.eventAction === "transfer"
        );
        if (regEvent && regEvent.eventDate) allocation_date = regEvent.eventDate;
      }

      let abuse_contact = "Not available";
      for (const entity of entities) {
        if (entity.roles && entity.roles.includes("abuse")) {
          const vcard = entity.vcardArray?.[1] || [];
          const emailProp = vcard.find((prop: any) => prop[0] === "email");
          if (emailProp) {
            abuse_contact = emailProp[3];
            break;
          }
        }
      }

      return {
        network_flags: {
          is_hosting: isHosting,
        },
        network_ownership: {
          cidr,
          abuse_contact,
          allocation_date,
          registration_country,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
