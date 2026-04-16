import { useEffect, useState, createContext, useContext } from "react";
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

const STORAGE_KEY = "resume-detector-state";

interface StoredResumeState {
  fileId: string | null;
  extractedData: ExtractedData | null;
  analysisResult: AnalysisResult | null;
  externalVerification: ExternalVerificationResult | null;
}

function readStoredState(): StoredResumeState {
  if (typeof window === "undefined") {
    return {
      fileId: null,
      extractedData: null,
      analysisResult: null,
      externalVerification: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        fileId: null,
        extractedData: null,
        analysisResult: null,
        externalVerification: null,
      };
    }

    const parsed = JSON.parse(raw) as StoredResumeState;
    return {
      fileId: parsed.fileId ?? null,
      extractedData: parsed.extractedData ?? null,
      analysisResult: parsed.analysisResult ?? null,
      externalVerification: parsed.externalVerification ?? null,
    };
  } catch {
    return {
      fileId: null,
      extractedData: null,
      analysisResult: null,
      externalVerification: null,
    };
  }
}

export function useResumeStore(): ResumeState {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResumeStore must be used within ResumeProvider");
  return ctx;
}

export function useResumeState(): ResumeState {
  const [storedState] = useState<StoredResumeState>(() => readStoredState());
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(storedState.fileId);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(storedState.extractedData);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(storedState.analysisResult);
  const [externalVerification, setExternalVerification] = useState<ExternalVerificationResult | null>(storedState.externalVerification);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextState: StoredResumeState = {
      fileId,
      extractedData,
      analysisResult,
      externalVerification,
    };

    const hasStoredData = Object.values(nextState).some((value) => value !== null);
    if (!hasStoredData) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, [fileId, extractedData, analysisResult, externalVerification]);

  const reset = () => {
    setFile(null);
    setFileId(null);
    setExtractedData(null);
    setAnalysisResult(null);
    setExternalVerification(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    file, fileId, extractedData, analysisResult, externalVerification,
    setFile, setFileId, setExtractedData, setAnalysisResult, setExternalVerification,
    reset,
  };
}
