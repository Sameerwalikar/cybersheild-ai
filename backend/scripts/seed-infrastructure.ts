import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mockIPs = [
    { ip: "103.45.67.89", lat: 28.6139, lng: 77.2090, country: "India", org: "Fake ISP Ltd.", risk: "CRITICAL", domains: ["scam-bank.in"] },
    { ip: "185.199.108.153", lat: 19.0760, lng: 72.8777, country: "India", org: "Hosting Corp", risk: "HIGH", domains: ["fake-upi.com", "verify-kyc.org"] },
    { ip: "91.200.12.44", lat: 55.7558, lng: 37.6173, country: "Russia", org: "Bulletproof Host", risk: "CRITICAL", domains: ["phish-portal.ru"] },
    { ip: "114.114.114.114", lat: 39.9042, lng: 116.4074, country: "China", org: "China Telecom", risk: "MEDIUM", domains: [] },
    { ip: "45.33.18.44", lat: 37.7749, lng: -122.4194, country: "United States", org: "Linode", risk: "LOW", domains: ["temp-botnet.net"] },
    { ip: "194.55.66.77", lat: 48.8566, lng: 2.3522, country: "France", org: "OVH SAS", risk: "HIGH", domains: ["payment-secure.fr"] },
  ];

  console.log("Seeding SuspiciousInfrastructure...");

  for (const item of mockIPs) {
    await prisma.suspiciousInfrastructure.upsert({
      where: { ip: item.ip },
      update: {},
      create: {
        ip: item.ip,
        latitude: item.lat,
        longitude: item.lng,
        country: item.country,
        asnOrganization: item.org,
        riskLevel: item.risk as any,
        linkedDomains: item.domains,
      }
    });
  }

  console.log("Done seeding.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
