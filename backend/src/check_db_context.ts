import { prisma } from "./config/database.js";

async function main() {
  const reports = await prisma.threatReport.findMany();
  console.log("=== THREAT REPORTS ===");
  for (const r of reports) {
    console.log(`ID: ${r.id} | No: ${r.reportNumber} | Type: ${r.type} | Status: ${r.status} | Desc: ${r.description}`);
  }

  const scans = await prisma.threatScan.findMany({ include: { analysis: true } });
  console.log("=== THREAT SCANS ===");
  for (const s of scans) {
    console.log(`ID: ${s.id} | Type: ${s.scanType} | Content: ${s.content} | Score: ${s.analysis?.riskScore}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
