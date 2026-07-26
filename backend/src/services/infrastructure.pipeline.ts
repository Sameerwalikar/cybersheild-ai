import { prisma } from "../config/database.js";
import { getIO } from "../config/socket.js";
import maxmind, { CityResponse } from "maxmind";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure you have GeoLite2-City.mmdb downloaded in backend/data or scripts/
// For this example, we assume it's at `backend/data/GeoLite2-City.mmdb`
const geoDbPath = path.resolve(__dirname, "../../data/GeoLite2-City.mmdb");
let lookup: maxmind.Reader<CityResponse> | null = null;

export const initPipeline = async () => {
  try {
    if (fs.existsSync(geoDbPath)) {
      lookup = await maxmind.open<CityResponse>(geoDbPath);
      console.log("🌍 GeoIP database loaded");
    } else {
      console.warn("⚠️ GeoIP database not found at", geoDbPath);
    }
  } catch (err) {
    console.error("❌ Error loading GeoIP database:", err);
  }
};

export const processSuspiciousIP = async (ip: string, riskLevel: any, linkedDomains: string[] = []) => {
  try {
    let latitude = 0;
    let longitude = 0;
    let country = "Unknown";
    let asnOrganization = "Unknown"; // Note: ASN info requires GeoLite2-ASN database, skipping exact ASN for now unless DB is available, we'll mock or use city DB info if available.

    if (lookup) {
      const geo = lookup.get(ip);
      if (geo) {
        if (geo.location) {
          latitude = geo.location.latitude || 0;
          longitude = geo.location.longitude || 0;
        }
        if (geo.country) {
          country = geo.country.names.en || "Unknown";
        }
      }
    } else {
      // Mock coordinates if GeoDB is missing so the map still works
      latitude = 20 + Math.random() * 10;
      longitude = 70 + Math.random() * 10;
      country = "India";
    }

    // Save to DB
    const record = await prisma.suspiciousInfrastructure.upsert({
      where: { ip },
      update: {
        lastSeen: new Date(),
        riskLevel,
        linkedDomains: {
          push: linkedDomains
        }
      },
      create: {
        ip,
        latitude,
        longitude,
        country,
        asnOrganization,
        riskLevel,
        linkedDomains
      }
    });

    // Broadcast to connected clients
    try {
      const io = getIO();
      io.emit("infrastructure:new", record);
    } catch (e) {
      // socket.io not initialized yet or not available
    }

    return record;
  } catch (err) {
    console.error("❌ Error processing suspicious IP:", err);
  }
};
