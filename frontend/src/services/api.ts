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

const MOCK_EXTRACTED_DATA: ExtractedData = {
  name: "Priya Sharma",
  email: "priya.sharma@gmail.com",
  phone: "+91-9876543210",
  skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "GraphQL", "PostgreSQL"],
  experience: "5 years",
  education: "B.Tech in Computer Science, IIT Delhi",
  location: "Bangalore, India",
};

const MOCK_ANALYSIS_RESULT: AnalysisResult = {
  status: "Verified",
  score: 100,
  fakeProbability: 8,
  extractedData: MOCK_EXTRACTED_DATA,
  jobSuggestions: [
    "Senior Frontend Developer",
    "Full Stack Engineer",
    "React Developer",
    "Software Development Engineer II",
    "Tech Lead - Web Applications",
  ],
  details: [
    { category: "OTP Verification", result: "Candidate identity confirmed via one-time password", points: 30, ok: true },
    { category: "GitHub Activity", result: "8 public repositories, active contributions detected", points: 20, ok: true },
    { category: "LinkedIn Presence", result: "Professional profile detected and verified", points: 15, ok: true },
    { category: "Resume Consistency", result: "Skills, experience, and education cross-validated", points: 35, ok: true },
  ],
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadResume(file: File): Promise<{ fileId: string; fileName: string }> {
  await delay(1200);
  return {
    fileId: `file_${Date.now()}`,
    fileName: file.name,
  };
}

export async function extractResumeData(fileId: string): Promise<ExtractedData> {
  await delay(2000);
  void fileId;
  return { ...MOCK_EXTRACTED_DATA };
}

export async function sendOtp(email: string): Promise<{ success: boolean; message: string }> {
  await delay(800);
  void email;
  return { success: true, message: "OTP sent successfully to your email" };
}

export async function verifyOtp(otp: string, email: string): Promise<{ success: boolean; message: string }> {
  await delay(1000);
  void email;
  if (otp === "000000") {
    return { success: false, message: "Invalid OTP. Please try again." };
  }
  return { success: true, message: "OTP verified successfully" };
}

export async function verifyGitHub(url: string): Promise<ExternalVerificationResult["github"]> {
  await delay(1800);
  const username = url.replace(/https?:\/\/(www\.)?github\.com\/?/, "").replace(/\/$/, "") || "priya-sharma-dev";
  if (!username || username.includes(" ")) {
    return { url, username: "", repoCount: 0, followers: 0, status: "not_found" };
  }
  return {
    url,
    username,
    repoCount: 8,
    followers: 142,
    status: "verified",
  };
}

export async function verifyLinkedIn(url: string): Promise<ExternalVerificationResult["linkedin"]> {
  await delay(2200);
  if (!url || !url.includes("linkedin")) {
    return { url, profileDetected: false, connections: "0", status: "not_found" };
  }
  return {
    url,
    profileDetected: true,
    connections: "500+",
    status: "verified",
  };
}

export async function analyzeResume(
  fileId: string,
  email: string,
  externalVerification?: ExternalVerificationResult,
): Promise<AnalysisResult> {
  await delay(2000);
  void fileId;
  void email;
  return {
    ...MOCK_ANALYSIS_RESULT,
    externalVerification,
  };
}
