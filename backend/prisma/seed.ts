import { PrismaClient, Role, ScanType, ScanStatus, RiskLevel, ReportStatus, ReportPriority, NotificationType, NotificationSeverity, InvestigationStatus, EvidenceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.fraudNetwork.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.threatReport.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.savedWebsite.deleteMany();
  await prisma.threatIndicator.deleteMany();
  await prisma.threatAnalysis.deleteMany();
  await prisma.threatScan.deleteMany();
  await prisma.session.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // ─── Users ──────────────────────────────────────────────────────────

  const citizen = await prisma.user.create({
    data: {
      email: "citizen@cybershield.in",
      passwordHash,
      role: Role.CITIZEN,
      isVerified: true,
      profile: {
        create: {
          name: "Arjun Sharma",
          phone: "+91 98765 43210",
          location: "Mumbai, Maharashtra",
          preferences: JSON.stringify({ notifications: true, emailAlerts: true, language: "en", theme: "dark" }),
        },
      },
    },
  });

  const police = await prisma.user.create({
    data: {
      email: "officer@cybershield.in",
      passwordHash,
      role: Role.POLICE,
      isVerified: true,
      profile: {
        create: {
          name: "Inspector Mehra",
          phone: "+91 99887 76655",
          location: "Delhi, NCR",
          preferences: JSON.stringify({ notifications: true, emailAlerts: true }),
        },
      },
    },
  });

  const org = await prisma.user.create({
    data: {
      email: "admin@techcorp.in",
      passwordHash,
      role: Role.ORGANIZATION,
      isVerified: true,
      profile: {
        create: {
          name: "TechCorp Security",
          location: "Bengaluru, Karnataka",
          preferences: JSON.stringify({ notifications: true }),
        },
      },
    },
  });

  console.log("  ✓ Users created");

  // ─── Threat Scans + Analysis ────────────────────────────────────────

  const scan1 = await prisma.threatScan.create({
    data: {
      userId: citizen.id,
      scanType: ScanType.MESSAGE,
      content: "Your SBI account has been suspended. Verify immediately at sbi-secure-login.xyz",
      status: ScanStatus.COMPLETED,
    },
  });

  await prisma.threatAnalysis.create({
    data: {
      scanId: scan1.id,
      riskScore: 94,
      riskLevel: RiskLevel.CRITICAL,
      summary: "This message impersonates a banking institution and requests immediate verification through a fraudulent domain.",
      recommendation: "Do not click any links. Block the sender. Report to your bank.",
      confidence: 0.94,
      processingTime: 2340,
      indicators: {
        create: [
          { label: "Urgent Language", severity: RiskLevel.HIGH, confidence: 0.96, description: "Message creates artificial urgency.", indicators: ["immediately", "suspended"] },
          { label: "Fake Domain", severity: RiskLevel.CRITICAL, confidence: 0.99, description: "Domain sbi-secure-login.xyz registered 2 days ago.", indicators: ["sbi-secure-login.xyz"] },
          { label: "Brand Impersonation", severity: RiskLevel.HIGH, confidence: 0.94, description: "Falsely claims to be SBI.", indicators: ["SBI"] },
        ],
      },
      riskScores: {
        create: {
          overall: 94,
          contentRisk: 91,
          sourceRisk: 98,
          patternRisk: 89,
          communityRisk: 95,
          factors: ["Known phishing language", "Domain age < 72h", "132 community reports"],
        },
      },
    },
  });

  const scan2 = await prisma.threatScan.create({
    data: {
      userId: citizen.id,
      scanType: ScanType.URL,
      content: "https://paypal-verify-account.com/login",
      status: ScanStatus.COMPLETED,
    },
  });

  await prisma.threatAnalysis.create({
    data: {
      scanId: scan2.id,
      riskScore: 87,
      riskLevel: RiskLevel.HIGH,
      summary: "This URL mimics PayPal's login page and is hosted on a newly registered domain.",
      recommendation: "Do not enter credentials. Report as phishing.",
      confidence: 0.91,
      processingTime: 1890,
      indicators: {
        create: [
          { label: "Look-alike Domain", severity: RiskLevel.HIGH, confidence: 0.95, description: "Domain mimics legitimate service.", indicators: ["paypal-verify-account.com"] },
          { label: "Missing SSL", severity: RiskLevel.MEDIUM, confidence: 0.88, description: "No valid SSL certificate.", indicators: [] },
        ],
      },
      website: {
        create: {
          url: "https://paypal-verify-account.com/login",
          domain: "paypal-verify-account.com",
          sslValid: false,
          domainAge: "P3D",
          reputation: 8,
        },
      },
    },
  });

  const scan3 = await prisma.threatScan.create({
    data: {
      userId: citizen.id,
      scanType: ScanType.UPI,
      content: "shop@paytm",
      status: ScanStatus.COMPLETED,
    },
  });

  await prisma.threatAnalysis.create({
    data: {
      scanId: scan3.id,
      riskScore: 12,
      riskLevel: RiskLevel.SAFE,
      summary: "This UPI ID belongs to a verified Paytm merchant. No fraud indicators found.",
      recommendation: "This UPI ID appears safe for transactions.",
      confidence: 0.97,
      processingTime: 890,
    },
  });

  console.log("  ✓ Scans & analyses created");

  // ─── Reports ────────────────────────────────────────────────────────

  await prisma.threatReport.create({
    data: {
      reportNumber: "RPT-2026-001247",
      userId: citizen.id,
      type: "phishing",
      description: "Received fake SBI SMS with suspicious link asking for credentials.",
      status: ReportStatus.UNDER_REVIEW,
      priority: ReportPriority.HIGH,
      evidence: ["screenshot_sms.png", "link_analysis.pdf"],
    },
  });

  await prisma.threatReport.create({
    data: {
      reportNumber: "RPT-2026-001198",
      userId: citizen.id,
      type: "upi_fraud",
      description: "Unknown UPI collect request from fraudster@ybl claiming cashback.",
      status: ReportStatus.RESOLVED,
      priority: ReportPriority.MEDIUM,
      evidence: ["upi_screenshot.png"],
      resolvedAt: new Date(),
    },
  });

  console.log("  ✓ Reports created");

  // ─── Notifications ──────────────────────────────────────────────────

  await prisma.notification.createMany({
    data: [
      { userId: citizen.id, type: NotificationType.THREAT_ALERT, title: "Critical threat blocked", message: "A phishing message targeting your SBI account was detected and blocked.", severity: NotificationSeverity.CRITICAL },
      { userId: citizen.id, type: NotificationType.REPORT_UPDATE, title: "Report under review", message: "Your report RPT-2026-001247 is now being investigated.", severity: NotificationSeverity.INFO },
      { userId: citizen.id, type: NotificationType.SECURITY_TIP, title: "Never share OTP", message: "Legitimate banks never ask for OTP over phone or SMS.", severity: NotificationSeverity.INFO, isRead: true },
      { userId: citizen.id, type: NotificationType.SCAN_COMPLETE, title: "Analysis complete", message: "Your website scan has finished. Risk score: 87 (High).", severity: NotificationSeverity.WARNING },
    ],
  });

  console.log("  ✓ Notifications created");

  // ─── Fraud Network & Investigation ──────────────────────────────────

  const network = await prisma.fraudNetwork.create({
    data: {
      name: "Mumbai Banking Phish Ring",
      cities: ["Mumbai", "Delhi", "Pune"],
      confidence: 94,
      nodeCount: 47,
      edgeCount: 68,
      status: "active",
    },
  });

  const investigation = await prisma.investigation.create({
    data: {
      caseId: "CYB-MUM-2026-063",
      title: "Banking Domain Fraud Ring",
      description: "Coordinated phishing campaign targeting SBI customers across multiple cities.",
      status: InvestigationStatus.ACTIVE,
      confidence: 94,
      city: "Mumbai",
      assignedTo: police.id,
      networkId: network.id,
    },
  });

  await prisma.evidence.createMany({
    data: [
      { type: EvidenceType.PHONE, value: "+91 89XX XXX XXX", description: "Primary contact number used in SMS", investigationId: investigation.id, networkId: network.id },
      { type: EvidenceType.DOMAIN, value: "sbi-secure-login.xyz", description: "Phishing domain registered 2 days ago", investigationId: investigation.id, networkId: network.id },
      { type: EvidenceType.UPI, value: "verify@sbi-secure.pay", description: "Fraudulent UPI address", investigationId: investigation.id, networkId: network.id },
      { type: EvidenceType.DEVICE, value: "Android • Mumbai", description: "Device fingerprint from sender", investigationId: investigation.id },
    ],
  });

  console.log("  ✓ Investigation & fraud network created");

  // ─── System Settings ────────────────────────────────────────────────

  await prisma.systemSetting.createMany({
    data: [
      { key: "ai_model_version", value: JSON.stringify("aegis-v1.2") },
      { key: "rate_limit_scans_per_hour", value: JSON.stringify(30) },
      { key: "max_file_upload_mb", value: JSON.stringify(25) },
    ],
  });

  console.log("  ✓ System settings created");
  console.log("\n✅ Seed complete!");
  console.log(`\n📧 Accounts:`);
  console.log(`   Citizen: citizen@cybershield.in / password123`);
  console.log(`   Police:  officer@cybershield.in / password123`);
  console.log(`   Org:     admin@techcorp.in / password123`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
