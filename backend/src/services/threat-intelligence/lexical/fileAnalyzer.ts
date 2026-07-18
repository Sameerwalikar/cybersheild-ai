// ─── FILE ANALYZER ────────────────────────────────────────────────────────────

const HIGH_RISK_EXTS = new Set([
  "exe", "scr", "bat", "cmd", "hta", "vbs", "ps1", "dll", "msi", "jar", "iso", "img"
]);

const ARCHIVE_EXTS = new Set([
  "zip", "rar", "7z"
]);

export interface FileAnalysisResult {
  detected: boolean;
  fileType: string;
  extension: string;
  riskScore: number;
  confidence: number;
  reason: string;
  isDoubleExtension: boolean;
}

/**
 * Analyzes the filename in a URL path to detect executable payload delivery.
 */
export function analyzeFile(url: string): FileAnalysisResult {
  const result: FileAnalysisResult = {
    detected: false,
    fileType: "",
    extension: "",
    riskScore: 0,
    confidence: 1.0,
    reason: "",
    isDoubleExtension: false,
  };

  if (!url) return result;

  try {
    const cleaned = url.trim().toLowerCase();
    const withScheme = cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
    const u = new URL(withScheme);
    const pathname = u.pathname;
    
    // Extract filename (last segment of path)
    const segments = pathname.split("/");
    const filename = segments[segments.length - 1] || "";
    
    if (!filename.includes(".")) return result;

    // Check for double extension e.g., invoice.pdf.exe
    const parts = filename.split(".");
    if (parts.length >= 3) {
      const ext1 = parts[parts.length - 2];
      const ext2 = parts[parts.length - 1];
      
      const isExt1CommonDoc = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "png", "jpg"].includes(ext1);
      const isExt2Malicious = HIGH_RISK_EXTS.has(ext2);

      if (isExt1CommonDoc && isExt2Malicious) {
        result.detected = true;
        result.fileType = `Double Extension Masked Executable (.${ext1}.${ext2})`;
        result.extension = ext2;
        result.riskScore = 95;
        result.confidence = 0.98;
        result.reason = `Critical double extension masking detected: "${filename}"`;
        result.isDoubleExtension = true;
        return result;
      }
    }

    // Single extension check
    const ext = parts[parts.length - 1];
    if (HIGH_RISK_EXTS.has(ext)) {
      result.detected = true;
      result.fileType = ext === "ps1" ? "PowerShell Script" : ext === "exe" ? "Windows Executable" : "Executable Payload";
      result.extension = ext;
      result.riskScore = 80;
      result.confidence = 0.95;
      result.reason = `Executable payload file delivery detected: .${ext}`;
    } else if (ARCHIVE_EXTS.has(ext)) {
      result.detected = true;
      result.fileType = "Compressed Archive";
      result.extension = ext;
      result.riskScore = 30; // Archive itself is moderate risk, but suspicious
      result.confidence = 0.85;
      result.reason = `Archive file payload delivery detected: .${ext}`;
    }

  } catch {
    // URL parsing failed, skip
  }

  return result;
}
