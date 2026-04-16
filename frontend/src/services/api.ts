export interface ExtractedData {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  location: string;
}

export interface ExternalVerificationResult {
  github: {
    url: string;
    username: string;
    repoCount: number;
    followers: number;
    status: "verified" | "not_found" | "pending";
  };
  linkedin: {
    url: string;
    profileDetected: boolean;
    connections: string;
    status: "verified" | "not_found" | "pending";
  };
  confidenceBoost: number;
}

export interface AnalysisResult {
  status: "Verified" | "Suspicious" | "Fake";
  score: number;
  fakeProbability: number;
  extractedData: ExtractedData;
  jobSuggestions: string[];
  details: {
    category: string;
    result: string;
    points: number;
    ok: boolean;
  }[];
  externalVerification?: ExternalVerificationResult;
}

type ApiSuccessMessage = {
  success?: boolean;
  message?: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, `Request failed with status ${response.status}`), response.status);
  }

  return payload as T;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const message = "message" in payload ? payload.message : undefined;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function normalizeExtractedData(payload: Partial<ExtractedData> | undefined): ExtractedData {
  const skills = Array.isArray(payload?.skills)
    ? payload.skills.map((skill) => String(skill).trim()).filter(Boolean)
    : [];

  return {
    name: payload?.name?.trim() || "Not mentioned",
    email: payload?.email?.trim() || "Not mentioned",
    phone: payload?.phone?.trim() || "Not mentioned",
    skills: skills.length > 0 ? skills : ["Not mentioned"],
    experience: payload?.experience?.trim() || "Not mentioned",
    education: payload?.education?.trim() || "Not mentioned",
    location: payload?.location?.trim() || "Not mentioned",
  };
}

function normalizeGithubResult(payload: Record<string, unknown>, fallbackUrl: string): ExternalVerificationResult["github"] {
  return {
    url: String(payload.url ?? fallbackUrl),
    username: String(payload.username ?? ""),
    repoCount: Number(payload.repoCount ?? payload.public_repos ?? 0),
    followers: Number(payload.followers ?? 0),
    status: payload.status === "verified" ? "verified" : "not_found",
  };
}

function normalizeLinkedinResult(payload: Record<string, unknown>, fallbackUrl: string): ExternalVerificationResult["linkedin"] {
  return {
    url: String(payload.url ?? fallbackUrl),
    profileDetected: Boolean(payload.profileDetected ?? payload.profile_detected ?? false),
    connections: String(payload.connections ?? "0"),
    status: payload.status === "verified" ? "verified" : "not_found",
  };
}

function normalizeExternalVerification(
  payload: Partial<ExternalVerificationResult> | undefined,
): ExternalVerificationResult | undefined {
  if (!payload) {
    return undefined;
  }

  const githubPayload = (payload.github as Record<string, unknown> | undefined) ?? {};
  const linkedinPayload = (payload.linkedin as Record<string, unknown> | undefined) ?? {};

  return {
    github: normalizeGithubResult(githubPayload, String(githubPayload.url ?? "")),
    linkedin: normalizeLinkedinResult(linkedinPayload, String(linkedinPayload.url ?? "")),
    confidenceBoost: Number(payload.confidenceBoost ?? 0),
  };
}

function normalizeAnalysisResult(
  payload: Record<string, unknown>,
  fallbackExternalVerification?: ExternalVerificationResult,
): AnalysisResult {
  const extractedPayload =
    (payload.extractedData as Partial<ExtractedData> | undefined)
    ?? (payload.extracted_data as Partial<ExtractedData> | undefined);

  const details = Array.isArray(payload.details)
    ? payload.details.map((item) => ({
        category: String((item as Record<string, unknown>).category ?? "Unknown"),
        result: String((item as Record<string, unknown>).result ?? ""),
        points: Number((item as Record<string, unknown>).points ?? 0),
        ok: Boolean((item as Record<string, unknown>).ok),
      }))
    : [];

  const normalizedExternal =
    normalizeExternalVerification(payload.externalVerification as Partial<ExternalVerificationResult> | undefined)
    ?? fallbackExternalVerification;

  const status = payload.status;
  const normalizedStatus: AnalysisResult["status"] =
    status === "Fake" || status === "Suspicious" || status === "Verified" ? status : "Suspicious";

  return {
    status: normalizedStatus,
    score: Number(payload.score ?? payload.authenticity_score ?? 0),
    fakeProbability: Number(payload.fakeProbability ?? payload.fake_probability ?? 0),
    extractedData: normalizeExtractedData(extractedPayload),
    jobSuggestions: Array.isArray(payload.jobSuggestions)
      ? payload.jobSuggestions.map((item) => String(item))
      : Array.isArray(payload.job_suggestions)
      ? payload.job_suggestions.map((item) => String(item))
      : [],
    details,
    externalVerification: normalizedExternal,
  };
}

export async function uploadResume(file: File): Promise<{ fileId: string; fileName: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const payload = await apiRequest<Record<string, unknown>>("/upload", {
    method: "POST",
    body: formData,
  });

  const fileId = payload.fileId ?? payload.file_id;
  if (fileId === undefined || fileId === null) {
    throw new Error("Backend did not return a file ID.");
  }

  return {
    fileId: String(fileId),
    fileName: String(payload.fileName ?? payload.file_name ?? file.name),
  };
}

export async function extractResumeData(fileId: string): Promise<ExtractedData> {
  const payload = await apiRequest<Record<string, unknown>>("/extract", {
    method: "POST",
    body: JSON.stringify({ fileId }),
  });

  const extractedPayload =
    (payload.extractedData as Partial<ExtractedData> | undefined)
    ?? (payload.extracted_data as Partial<ExtractedData> | undefined)
    ?? (payload as Partial<ExtractedData>);

  return normalizeExtractedData(extractedPayload);
}

export async function updateResumeDetails(fileId: string, extractedData: ExtractedData): Promise<ExtractedData> {
  const payload = await apiRequest<Record<string, unknown>>(`/resume/${fileId}/details`, {
    method: "PUT",
    body: JSON.stringify(extractedData),
  });

  const extractedPayload =
    (payload.extractedData as Partial<ExtractedData> | undefined)
    ?? (payload.extracted_data as Partial<ExtractedData> | undefined)
    ?? (payload as Partial<ExtractedData>);

  return normalizeExtractedData(extractedPayload);
}

export async function sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
  const payload = await apiRequest<ApiSuccessMessage>("/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });

  return {
    success: Boolean(payload.success),
    message: payload.message || "OTP sent successfully.",
  };
}

export async function verifyOtp(otp: string, phone: string): Promise<{ success: boolean; message: string }> {
  try {
    const payload = await apiRequest<ApiSuccessMessage>("/verify-otp", {
      method: "POST",
      body: JSON.stringify({ otp, phone }),
    });

    return {
      success: Boolean(payload.success),
      message: payload.message || "OTP verified successfully.",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}

export async function verifyGitHub(url: string): Promise<ExternalVerificationResult["github"]> {
  const payload = await apiRequest<Record<string, unknown>>("/verify-github", {
    method: "POST",
    body: JSON.stringify({ githubUrl: url }),
  });

  return normalizeGithubResult(payload, url);
}

export async function verifyLinkedIn(url: string): Promise<ExternalVerificationResult["linkedin"]> {
  const payload = await apiRequest<Record<string, unknown>>("/verify-linkedin", {
    method: "POST",
    body: JSON.stringify({ linkedinUrl: url }),
  });

  return normalizeLinkedinResult(payload, url);
}

export async function analyzeResume(
  fileId: string,
  contact: Pick<ExtractedData, "email" | "phone">,
  externalVerification?: ExternalVerificationResult,
): Promise<AnalysisResult> {
  const payload = await apiRequest<Record<string, unknown>>("/analyze", {
    method: "POST",
    body: JSON.stringify({
      fileId,
      email: contact.email,
      phone: contact.phone,
      externalVerification,
    }),
  });

  return normalizeAnalysisResult(payload, externalVerification);
}
