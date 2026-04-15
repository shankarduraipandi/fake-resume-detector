import { useState, createContext, useContext } from "react";
import type { ExtractedData, AnalysisResult, ExternalVerificationResult } from "@/services/api";

export interface ResumeState {
  file: File | null;
  fileId: string | null;
  extractedData: ExtractedData | null;
  analysisResult: AnalysisResult | null;
  externalVerification: ExternalVerificationResult | null;
  setFile: (file: File | null) => void;
  setFileId: (id: string | null) => void;
  setExtractedData: (data: ExtractedData | null) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setExternalVerification: (result: ExternalVerificationResult | null) => void;
  reset: () => void;
}

export const ResumeContext = createContext<ResumeState | null>(null);

export function useResumeStore(): ResumeState {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResumeStore must be used within ResumeProvider");
  return ctx;
}

export function useResumeState(): ResumeState {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [externalVerification, setExternalVerification] = useState<ExternalVerificationResult | null>(null);

  const reset = () => {
    setFile(null);
    setFileId(null);
    setExtractedData(null);
    setAnalysisResult(null);
    setExternalVerification(null);
  };

  return {
    file, fileId, extractedData, analysisResult, externalVerification,
    setFile, setFileId, setExtractedData, setAnalysisResult, setExternalVerification,
    reset,
  };
}
