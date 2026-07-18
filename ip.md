# 🌐 IP-Intelligence — Project & Tech Stack Overview

A detailed technical breakdown of the **IP-Intelligence** engine, an automated threat profiling and network intelligence lookup system designed to aggregate real-time reputational data for IP addresses.

---

## 🏗️ System & Data Flow Architecture

The system works by orchestrating queries across local databases, caching layers, and external threat intelligence APIs. It consolidates these details into a single unified JSON profile containing risk score breakdowns, geographic location, and registrar info.

```mermaid
graph TD
    %% Client & Express entry
    Client["Client Browser (Vanilla JS + HTML)"] -->|GET /api/v1/ip/:ip| Express["Express Server (src/index.ts)"]
    Express --> IPController["IPController (src/controllers/)"]
    
    %% Enrichment Service Layer
    IPController --> EnrichmentService["EnrichmentService (src/services/)"]
    
    %% Caching
    EnrichmentService <-->|Lookup/Set Cache| CacheService["CacheService (ioredis)"]
    
    %% Aggregators & Adapters
    EnrichmentService --> Adapters["Adapters (BaseAdapter.ts)"]
    
    subgraph Geo ["Local Geo Lookup"]
        Adapters --> MaxMind["MaxMindAdapter (.mmdb database)"]
    end
    
    subgraph External ["External Intelligence APIs"]
        Adapters --> AbuseIPDB["AbuseIPDBAdapter (API)"]
        Adapters --> GreyNoise["GreyNoiseAdapter (API)"]
        Adapters --> Tor["TorExitNodeAdapter (Tor IP List)"]
        Adapters --> RDAP["RDAPAdapter (Network Registry query)"]
    end
    
    subgraph LocalTelemetry ["Local Telemetry"]
        Adapters --> Telemetry["InternalTelemetryAdapter"]
    end
    
    %% Calculations
    EnrichmentService --> Scoring["ScoringEngine.ts (Weights JSON)"]
    Scoring -->|Risk Profile (0 - 100) & Confidence| IPController
    
    %% DB Audit Log
    IPController -->|Log Lookup Audit| Prisma["Prisma Client"]
    Prisma --> PG["PostgreSQL Database"]
```

---

## 🎨 Tech Stack Breakdown

### Backend API Services
* **Runtime & Framework:** Node.js + Express.js v5 (TypeScript)
* **Development compilation:** `tsx` (TypeScript Execute) for hot reloading in development.
* **Production compilation:** TypeScript compiler `tsc` compiling TS code to JavaScript.
* **Configuration:** `dotenv` for management of API credentials (e.g. AbuseIPDB, GreyNoise keys).

### Database, ORM & Caching
* **Database Engine:** PostgreSQL
* **ORM Layer:** Prisma Client v5.22.0
* **Caching Layer:** Redis (via `ioredis` v5.11.1) to optimize performance, cache public Tor lists, and limit API requests to external servers.

### Geolocation & Geodata
* **MaxMind GeoIP Reader:** `maxmind` library v5.0.6, utilizing local file databases stored in `/data` for high-speed offline resolution:
  * `GeoLite2-City.mmdb` (City and geographic coordination lookup)
  * `GeoLite2-ASN.mmdb` (Autonomous System Number & ISP verification)

---

## 🔌 Threat Intelligence Adapters

The engine implements an extensible adapter structure inheriting from an abstract `BaseAdapter`. It collects data concurrently across 6 distinct telemetry vectors:

1. **MaxMind Adapter (`MaxMindAdapter`):** Handles offline geolocations, resolving city names, country codes, coordinates, ISP, and ASN.
2. **AbuseIPDB Adapter (`AbuseIPDBAdapter`):** Queries AbuseIPDB APIs to check if the target IP has been reported for activities like scanning, DDoS, or bruteforce, returning abuse confidence percentages.
3. **GreyNoise Adapter (`GreyNoiseAdapter`):** Identifies whether the IP belongs to mass scanners, classifying them as `benign` (e.g., search engine crawlers), `malicious` (active scanning bots), or `unknown`.
4. **Tor Exit Node Adapter (`TorExitNodeAdapter`):** Compares the IP against the Tor Project's official public list of active Tor exit nodes (cached locally in Redis).
5. **RDAP Registry Adapter (`RDAPAdapter`):** Issues queries using the Registration Data Access Protocol (RDAP) to look up network ownership details, registrar information, and network registration ranges.
6. **Internal Telemetry (`InternalTelemetryAdapter`):** Cross-references search records against historical digital evidence reported internally in CyberShield.

---

## 📈 Scoring & Threat Engine

Risk scores are computed using the `ScoringEngine` module. It assigns weighted penalty points for threats, capping the final score between `0` (Safe) and `100` (Critical).

### Default Penalty Breakdown
Weights are dynamically loaded from `scoringWeights.json`:
* **Tor Exit Node:** `+50` points
* **Known VPN:** `+25` points
* **Known Proxy:** `+35` points
* **Hosting/Cloud Provider:** `+10` points
* **AbuseIPDB Score Multiplier:** Adjusts score based on the reported abuse confidence.
* **GreyNoise Malicious:** Penalty applied if verified malicious by GreyNoise.
* **GreyNoise Benign:** `-20` points credit (e.g. Googlebot / Cloudflare DNS).
* **Internal Telemetry:** Penalizes IPs that have been flagged multiple times internally.

---

## 🗄️ Database Schema Details

The database manages audits and threat listing using three tables defined in [schema.prisma](https://github.com/prathamkhairmode15/IP-Intelligence/blob/main/src/prisma/schema.prisma):

```prisma
model IPHistory {
  id        Int      @id @default(autoincrement())
  ip        String   @unique
  firstSeen DateTime @default(now())
  lastSeen  DateTime @default(now())
  count     Int      @default(1)
}

model ip_lookup_audit {
  id            Int      @id @default(autoincrement())
  ip            String
  looked_up_by  String?
  timestamp     DateTime @default(now())
  risk_score    Int?
}

model ip_lists {
  id        Int      @id @default(autoincrement())
  ip        String
  list_type String   // 'blocklist' | 'allowlist'
  added_by  String?
  added_at  DateTime @default(now())
  note      String?
}
```

---

## 💻 Frontend Client
The frontend is a lightweight, responsive interface served statically out of `/public`:
* **`index.html`**: Structures the dashboard search inputs, maps, and risk score graphs.
* **`style.css`**: Styling sheets for dashboard widgets.
* **`app.js`**: Core client script managing UI state, API fetch requests to `/api/v1/ip/:ip`, and generating risk score charts.

---

## 🛠️ Main CLI Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Boots up the server with `tsx` watching `src/index.ts`. |
| `npm run generate` | Runs Prisma client generator. |
| `npm run download-db`| Executed script `scripts/downloadMaxMind.ts` to refresh MaxMind DB archives. |
| `npm run test` | Executes Jest test suites. |
