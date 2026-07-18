import { classifyQrContent } from "./qrClassifier.service.js";
import { scannerService } from "../modules/scanner/scanner.service.js";
import { analyzePhone } from "./heuristics/phoneHeuristic.service.js";
import { analyzeWifi } from "./heuristics/wifiHeuristic.service.js";
import { analyzeEmail } from "./heuristics/emailHeuristic.service.js";
import { analyzeDeepLink } from "./heuristics/deepLinkHeuristic.service.js";
import { expandUrl } from "../utils/redirectExpander.util.js";

export async function routeAndAnalyzeQr(userId: string, decodedContent: string) {
  const classification = classifyQrContent(decodedContent);
  const { contentType, confidence, parsedFields } = classification;

  let riskScore = 0;
  let riskLevel: "safe" | "low" | "medium" | "high" | "critical" = "safe";
  let riskIndicators: string[] = [];
  let summary = "";
  let recommendation = "";
  let redirectChain: string[] | undefined = undefined;
  let underlyingScanner = "qr_router";
  let analysisId = "";
  let scanId = "";

  const mapLevel = (score: number) => {
    if (score >= 80) return "critical" as const;
    if (score >= 60) return "high" as const;
    if (score >= 40) return "medium" as const;
    if (score >= 20) return "low" as const;
    return "safe" as const;
  };

  switch (contentType) {
    case "URL": {
      underlyingScanner = "url_threat_engine";
      let targetUrl = parsedFields.url;
      try {
        redirectChain = await expandUrl(targetUrl);
        targetUrl = redirectChain[redirectChain.length - 1];
      } catch {
        redirectChain = [targetUrl];
      }
      
      const scanRes = await scannerService.analyzeScan({
        userId,
        scanType: "URL",
        content: targetUrl,
        metadata: { redirectChain, originalQr: decodedContent }
      });

      analysisId = scanRes.id;
      scanId = scanRes.scanId;
      riskScore = scanRes.riskScore;
      riskLevel = scanRes.riskLevel as any;
      riskIndicators = scanRes.signals.map((s: any) => s.description || s.label);
      summary = scanRes.summary;
      recommendation = scanRes.recommendation;
      break;
    }
    case "UPI": {
      underlyingScanner = "upi_heuristic";
      const upiId = parsedFields.pa;
      const scanRes = await scannerService.analyzeScan({
        userId,
        scanType: "UPI",
        content: upiId,
        metadata: { upiFields: parsedFields, originalQr: decodedContent, isQrScan: true }
      });

      analysisId = scanRes.id;
      scanId = scanRes.scanId;
      riskScore = scanRes.riskScore;
      riskLevel = scanRes.riskLevel as any;
      riskIndicators = scanRes.signals.map((s: any) => s.description || s.label);
      summary = scanRes.summary;
      recommendation = scanRes.recommendation;
      break;
    }
    case "PHONE": {
      underlyingScanner = "phone_heuristic";
      const res = analyzePhone(decodedContent);
      riskScore = res.score;
      riskLevel = mapLevel(riskScore);
      riskIndicators = res.signals.map((s: any) => s.description || s.label);
      summary = res.summary;
      recommendation = res.recommendation;
      
      const scanRes = await scannerService.analyzeScan({
        userId,
        scanType: "QR",
        content: decodedContent,
        metadata: { originalType: "phone", score: riskScore, signals: res.signals }
      });
      analysisId = scanRes.id;
      scanId = scanRes.scanId;
      break;
    }
    case "WIFI": {
      underlyingScanner = "wifi_heuristic";
      const res = analyzeWifi(decodedContent);
      riskScore = res.score;
      riskLevel = mapLevel(riskScore);
      riskIndicators = res.signals.map((s: any) => s.description || s.label);
      summary = res.summary;
      recommendation = res.recommendation;

      const scanRes = await scannerService.analyzeScan({
        userId,
        scanType: "QR",
        content: decodedContent,
        metadata: { originalType: "wifi", score: riskScore, signals: res.signals }
      });
      analysisId = scanRes.id;
      scanId = scanRes.scanId;
      break;
    }
    case "EMAIL": {
      underlyingScanner = "email_heuristic";
      const res = analyzeEmail(decodedContent);
      riskScore = res.score;
      riskLevel = mapLevel(riskScore);
      riskIndicators = res.signals.map((s: any) => s.description || s.label);
      summary = res.summary;
      recommendation = res.recommendation;

      const scanRes = await scannerService.analyzeScan({
        userId,
        scanType: "QR",
        content: decodedContent,
        metadata: { originalType: "email", score: riskScore, signals: res.signals }
      });
      analysisId = scanRes.id;
      scanId = scanRes.scanId;
      break;
    }
    case "DEEP_LINK": {
      underlyingScanner = "deeplink_heuristic";
      const res = analyzeDeepLink(decodedContent);
      riskScore = res.score;
      riskLevel = mapLevel(riskScore);
      riskIndicators = res.signals.map((s: any) => s.description || s.label);
      summary = res.summary;
      recommendation = res.recommendation;

      const scanRes = await scannerService.analyzeScan({
        userId,
        scanType: "QR",
        content: decodedContent,
        metadata: { originalType: "deeplink", score: riskScore, signals: res.signals }
      });
      analysisId = scanRes.id;
      scanId = scanRes.scanId;
      break;
    }
    case "PLAIN_TEXT":
    case "SMS":
    case "VCARD":
    default: {
      underlyingScanner = "message_pattern_analyzer";
      const scanRes = await scannerService.analyzeScan({
        userId,
        scanType: "MESSAGE",
        content: decodedContent,
        metadata: { originalQr: decodedContent, qrType: contentType }
      });

      analysisId = scanRes.id;
      scanId = scanRes.scanId;
      riskScore = scanRes.riskScore;
      riskLevel = scanRes.riskLevel as any;
      riskIndicators = scanRes.signals.map((s: any) => s.description || s.label);
      summary = scanRes.summary;
      recommendation = scanRes.recommendation;
      break;
    }
  }

  return {
    scanId,
    analysisId,
    timestamp: new Date().toISOString(),
    sourceType: "qr" as const,
    decodedContent,
    contentType,
    classificationConfidence: confidence,
    threatScore: riskScore,
    riskLevel,
    riskIndicators,
    aiExplanation: summary,
    recommendedActions: [recommendation],
    underlyingScanner,
    redirectChain,
    metadata: parsedFields,
  };
}
