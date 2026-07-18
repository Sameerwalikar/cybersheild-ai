import { useState, useCallback, useRef, useEffect } from "react";
import { scannerApi, type ScanResult } from "@/services/api/scanner";

export type PipelineStage = "idle" | "loading" | "success" | "error";

export const SCAN_STEPS = [
  "Uploading QR Image",
  "Decoding QR Code",
  "Classifying Payload Type",
  "Running Security Heuristics",
  "Calculating Threat Score",
  "Generating AI Explanation",
  "Preparing Security Report"
];

export function useQrScanPipeline() {
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [report, setReport] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<{ fileKey: string; report: ScanResult } | null>(null);

  // Clean up any pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStage("idle");
    setFile(null);
    setActiveStepIndex(0);
    setReport(null);
    setError(null);
  }, []);

  const handleUpload = async (uploadedFile: File) => {
    // 1. Cancel previous pending request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const fileKey = `${uploadedFile.name}-${uploadedFile.size}-${uploadedFile.lastModified}`;
    setFile(uploadedFile);
    setError(null);

    // 2. Check session cache
    if (cacheRef.current && cacheRef.current.fileKey === fileKey) {
      setReport(cacheRef.current.report);
      setStage("success");
      return;
    }

    // 3. Start new pipeline
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStage("loading");
    setActiveStepIndex(0);

    // Interval to simulate step progress smoothly
    let currentIdx = 0;
    const stepTimer = setInterval(() => {
      if (currentIdx < SCAN_STEPS.length - 2) {
        currentIdx += 1;
        setActiveStepIndex(currentIdx);
      }
    }, 450); // Progress step every 450ms

    try {
      const scanReport = await scannerApi.uploadQrImage(uploadedFile, controller.signal);
      clearInterval(stepTimer);
      setActiveStepIndex(SCAN_STEPS.length - 1); // jump to end
      
      // Save in cache
      cacheRef.current = { fileKey, report: scanReport };
      setReport(scanReport);
      setStage("success");
    } catch (err: any) {
      clearInterval(stepTimer);
      if (err.name === "AbortError") {
        // Ignored since a newer upload aborted this
        return;
      }
      
      // Map error to clean client messages
      let displayError = "Please upload an image containing a valid QR code.";
      if (err.message && (
        err.message.includes("No QR code") ||
        err.message.includes("unreadable") ||
        err.message.includes("corrupted") ||
        err.message.includes("limit")
      )) {
        displayError = err.message;
      } else if (err.message && err.message.includes("temporary")) {
        displayError = "Analysis temporarily unavailable.";
      }
      
      setError(displayError);
      setStage("error");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleRetry = async () => {
    if (file) {
      await handleUpload(file);
    }
  };

  return {
    stage,
    file,
    activeStepIndex,
    report,
    error,
    handleUpload,
    handleRetry,
    reset,
  };
}
