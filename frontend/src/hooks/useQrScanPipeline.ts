import { useState, useCallback } from "react";
import { scannerApi } from "@/services/api/scanner";

export type PipelineStage = "idle" | "uploading" | "classifying" | "confirming" | "analyzing" | "success" | "error";

export function useQrScanPipeline() {
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [decodedContent, setDecodedContent] = useState("");
  const [contentType, setContentType] = useState("");
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("low");
  const [parsedFields, setParsedFields] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStage, setErrorStage] = useState<PipelineStage | null>(null);

  const reset = useCallback(() => {
    setStage("idle");
    setFile(null);
    setDecodedContent("");
    setContentType("");
    setConfidence("low");
    setParsedFields(null);
    setReport(null);
    setError(null);
    setErrorStage(null);
  }, []);

  const handleUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setStage("uploading");
    setError(null);
    setErrorStage(null);

    try {
      const decodeRes = await scannerApi.uploadQrImage(uploadedFile);
      setDecodedContent(decodeRes.decodedContent);

      setStage("classifying");
      const classifyRes = await scannerApi.classifyQrContent(decodeRes.decodedContent);
      setContentType(classifyRes.contentType);
      setConfidence(classifyRes.confidence);
      setParsedFields(classifyRes.parsedFields);

      setStage("confirming");
    } catch (err: any) {
      setError(err.message || "An error occurred during decoding.");
      setErrorStage("uploading");
      setStage("error");
    }
  };

  const handleAnalyze = async () => {
    if (!decodedContent) return;
    setStage("analyzing");
    setError(null);
    setErrorStage(null);

    try {
      const scanReport = await scannerApi.analyzeQrParsed(decodedContent);
      setReport(scanReport);
      setStage("success");
    } catch (err: any) {
      setError(err.message || "Threat analysis failed.");
      setErrorStage("analyzing");
      setStage("error");
    }
  };

  const handleRetry = async () => {
    if (errorStage === "uploading" && file) {
      await handleUpload(file);
    } else if (errorStage === "analyzing") {
      await handleAnalyze();
    }
  };

  return {
    stage,
    file,
    decodedContent,
    contentType,
    confidence,
    parsedFields,
    report,
    error,
    errorStage,
    handleUpload,
    handleAnalyze,
    handleRetry,
    reset,
    setContentType,
  };
}
