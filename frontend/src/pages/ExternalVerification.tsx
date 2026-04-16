import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Github, Linkedin, CheckCircle2, XCircle, Loader2,
  ArrowRight, ExternalLink, Users, GitFork, Star, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useResumeStore } from "@/store/resumeStore";
import { verifyGitHub, verifyLinkedIn, analyzeResume } from "@/services/api";
import type { ExternalVerificationResult } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type CheckStatus = "idle" | "checking" | "verified" | "not_found";

interface GithubResult {
  username: string;
  repoCount: number;
  followers: number;
  status: CheckStatus;
}

interface LinkedinResult {
  profileDetected: boolean;
  connections: string;
  status: CheckStatus;
}

function toCheckStatus(status: ExternalVerificationResult["github"]["status"]): CheckStatus {
  return status === "verified" ? "verified" : status === "not_found" ? "not_found" : "idle";
}

export default function ExternalVerification() {
  const [, setLocation] = useLocation();
  const { extractedData, fileId, analysisResult, externalVerification, setExternalVerification, setAnalysisResult } = useResumeStore();
  const { toast } = useToast();

  const savedGithubStatus = externalVerification ? toCheckStatus(externalVerification.github.status) : "idle";
  const savedLinkedinStatus = externalVerification ? toCheckStatus(externalVerification.linkedin.status) : "idle";

  const [githubUrl, setGithubUrl] = useState(externalVerification?.github.url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(externalVerification?.linkedin.url ?? "");

  const [githubStatus, setGithubStatus] = useState<CheckStatus>(savedGithubStatus);
  const [linkedinStatus, setLinkedinStatus] = useState<CheckStatus>(savedLinkedinStatus);
  const [githubResult, setGithubResult] = useState<GithubResult | null>(
    externalVerification?.github.url
      ? {
          username: externalVerification.github.username,
          repoCount: externalVerification.github.repoCount,
          followers: externalVerification.github.followers,
          status: savedGithubStatus,
        }
      : null,
  );
  const [linkedinResult, setLinkedinResult] = useState<LinkedinResult | null>(
    externalVerification?.linkedin.url
      ? {
          profileDetected: externalVerification.linkedin.profileDetected,
          connections: externalVerification.linkedin.connections,
          status: savedLinkedinStatus,
        }
      : null,
  );

  const [continuing, setContinuing] = useState(false);
  const [redirectPending, setRedirectPending] = useState(false);

  useEffect(() => {
    if (redirectPending && analysisResult) {
      setRedirectPending(false);
      setLocation("/result");
    }
  }, [redirectPending, analysisResult, setLocation]);

  if (!extractedData) {
    setLocation("/upload");
    return null;
  }

  const runGithubCheck = useCallback(async () => {
    setGithubStatus("checking");
    setGithubResult(null);
    try {
      const result = await verifyGitHub(githubUrl);
      const nextStatus = toCheckStatus(result.status);
      setGithubStatus(nextStatus);
      setGithubResult({
        username: result.username,
        repoCount: result.repoCount,
        followers: result.followers,
        status: nextStatus,
      });
      if (nextStatus === "verified") {
        toast({ title: "GitHub Verified", description: `Found ${result.repoCount} repositories for @${result.username}` });
      } else {
        toast({ title: "GitHub Not Found", description: "No matching profile found.", variant: "destructive" });
      }
    } catch {
      setGithubStatus("not_found");
      toast({ title: "GitHub check failed", variant: "destructive" });
    }
  }, [githubUrl, toast]);

  const runLinkedinCheck = useCallback(async () => {
    setLinkedinStatus("checking");
    setLinkedinResult(null);
    try {
      const result = await verifyLinkedIn(linkedinUrl);
      const nextStatus = toCheckStatus(result.status);
      setLinkedinStatus(nextStatus);
      setLinkedinResult({
        profileDetected: result.profileDetected,
        connections: result.connections,
        status: nextStatus,
      });
      if (nextStatus === "verified") {
        toast({ title: "LinkedIn Verified", description: "Professional profile successfully detected." });
      } else {
        toast({ title: "LinkedIn Not Found", description: "No matching profile found.", variant: "destructive" });
      }
    } catch {
      setLinkedinStatus("not_found");
      toast({ title: "LinkedIn check failed", variant: "destructive" });
    }
  }, [linkedinUrl, toast]);

  const handleRunAll = async () => {
    await Promise.all([runGithubCheck(), runLinkedinCheck()]);
  };

  const canContinue = githubStatus !== "idle" || linkedinStatus !== "idle";
  const allChecked = githubStatus !== "idle" && githubStatus !== "checking"
    && linkedinStatus !== "idle" && linkedinStatus !== "checking";

  const handleContinue = async () => {
    setContinuing(true);
    try {
      if (!fileId) {
        throw new Error("Missing file ID. Please upload the resume again.");
      }

      const ghVerified = githubStatus === "verified";
      const liVerified = linkedinStatus === "verified";
      const confidenceBoost = (ghVerified ? 20 : 0) + (liVerified ? 15 : 0);

      const extResult: ExternalVerificationResult = {
        github: {
          url: githubUrl,
          username: githubResult?.username ?? "",
          repoCount: githubResult?.repoCount ?? 0,
          followers: githubResult?.followers ?? 0,
          status: ghVerified ? "verified" : "not_found",
        },
        linkedin: {
          url: linkedinUrl,
          profileDetected: linkedinResult?.profileDetected ?? false,
          connections: linkedinResult?.connections ?? "0",
          status: liVerified ? "verified" : "not_found",
        },
        confidenceBoost,
      };

      setExternalVerification(extResult);

      const analysis = await analyzeResume(
        fileId,
        {
          email: extractedData.email,
          phone: extractedData.phone,
        },
        extResult,
      );
      setAnalysisResult(analysis);
      setRedirectPending(true);

      toast({ title: "Analysis Complete!", description: "Your full verification report is ready." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not complete analysis. Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
      setContinuing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="mb-8">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Step 4 of 5</span>
          <h1 className="text-3xl font-bold text-foreground mt-3 mb-1.5">External Profile Verification</h1>
          <p className="text-muted-foreground text-sm">
            Cross-check the candidate's online presence to boost confidence in the authenticity score.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Enter the candidate's public profile URLs and run the checks. Results are used to boost the final authenticity score.
            You can edit the pre-filled URLs before checking.
          </p>
        </div>

        <div className="space-y-5">
          {/* GitHub Card */}
          <div
            className={`bg-card border rounded-2xl shadow-sm overflow-hidden transition-all ${
              githubStatus === "verified" ? "border-emerald-300 dark:border-emerald-700/60" :
              githubStatus === "not_found" ? "border-red-300 dark:border-red-700/60" :
              githubStatus === "checking" ? "border-primary/40" :
              "border-border"
            }`}
            data-testid="github-card"
          >
            {/* Card Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-gray-900 dark:bg-gray-100 flex items-center justify-center shrink-0">
                <Github className="w-4.5 h-4.5 text-white dark:text-gray-900" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground text-sm">GitHub Verification</h2>
                <p className="text-xs text-muted-foreground">Validate public repositories and activity</p>
              </div>
              <StatusBadge status={githubStatus} />
            </div>

            {/* URL Input */}
            <div className="px-5 py-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">GitHub Profile URL</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => { setGithubUrl(e.target.value); setGithubStatus("idle"); setGithubResult(null); }}
                    placeholder="https://github.com/username"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    data-testid="input-github-url"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runGithubCheck}
                  disabled={githubStatus === "checking" || !githubUrl}
                  className="shrink-0 text-xs font-semibold"
                  data-testid="button-check-github"
                >
                  {githubStatus === "checking" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Check"}
                </Button>
              </div>
            </div>

            {/* GitHub Result */}
            {githubStatus === "checking" && (
              <GithubChecking />
            )}
            {githubResult && githubStatus === "verified" && (
              <GithubVerifiedResult result={githubResult} />
            )}
            {githubStatus === "not_found" && githubResult && (
              <div className="mx-5 mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">No GitHub profile found at this URL.</p>
              </div>
            )}
          </div>

          {/* LinkedIn Card */}
          <div
            className={`bg-card border rounded-2xl shadow-sm overflow-hidden transition-all ${
              linkedinStatus === "verified" ? "border-emerald-300 dark:border-emerald-700/60" :
              linkedinStatus === "not_found" ? "border-red-300 dark:border-red-700/60" :
              linkedinStatus === "checking" ? "border-primary/40" :
              "border-border"
            }`}
            data-testid="linkedin-card"
          >
            {/* Card Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-[#0A66C2] flex items-center justify-center shrink-0">
                <Linkedin className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground text-sm">LinkedIn Verification</h2>
                <p className="text-xs text-muted-foreground">Confirm professional profile presence</p>
              </div>
              <StatusBadge status={linkedinStatus} />
            </div>

            {/* URL Input */}
            <div className="px-5 py-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">LinkedIn Profile URL</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => { setLinkedinUrl(e.target.value); setLinkedinStatus("idle"); setLinkedinResult(null); }}
                    placeholder="https://linkedin.com/in/username"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    data-testid="input-linkedin-url"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runLinkedinCheck}
                  disabled={linkedinStatus === "checking" || !linkedinUrl}
                  className="shrink-0 text-xs font-semibold"
                  data-testid="button-check-linkedin"
                >
                  {linkedinStatus === "checking" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Check"}
                </Button>
              </div>
            </div>

            {/* LinkedIn Result */}
            {linkedinStatus === "checking" && (
              <LinkedinChecking />
            )}
            {linkedinResult && linkedinStatus === "verified" && (
              <LinkedinVerifiedResult result={linkedinResult} />
            )}
            {linkedinStatus === "not_found" && linkedinResult && (
              <div className="mx-5 mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">No LinkedIn profile found at this URL.</p>
              </div>
            )}
          </div>
        </div>

        {/* Confidence Boost Preview */}
        {allChecked && (
          <div className="mt-5 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-primary mb-2.5 uppercase tracking-wide">Confidence Boost Preview</p>
            <div className="space-y-1.5">
              {githubStatus === "verified" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Github className="w-3.5 h-3.5" /> GitHub Verified</span>
                  <span className="font-bold text-emerald-600">+20 pts</span>
                </div>
              )}
              {linkedinStatus === "verified" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Linkedin className="w-3.5 h-3.5" /> LinkedIn Verified</span>
                  <span className="font-bold text-emerald-600">+15 pts</span>
                </div>
              )}
              {(githubStatus === "not_found" || linkedinStatus === "not_found") && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profile Not Found</span>
                  <span className="font-bold text-red-500">+0 pts</span>
                </div>
              )}
              <div className="border-t border-primary/20 pt-2 mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total Boost</span>
                <span className="font-black text-primary text-base">
                  +{(githubStatus === "verified" ? 20 : 0) + (linkedinStatus === "verified" ? 15 : 0)} pts
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleRunAll()}
            disabled={githubStatus === "checking" || linkedinStatus === "checking"}
            data-testid="button-run-all"
          >
            Run All Checks
          </Button>
          <Button
            className="flex-1 gap-2 font-semibold"
            onClick={handleContinue}
            disabled={!canContinue || continuing || githubStatus === "checking" || linkedinStatus === "checking"}
            data-testid="button-continue"
          >
            {continuing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Continue to Analysis
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          You can skip individual checks — they're optional but improve accuracy.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === "idle") return <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">Not checked</span>;
  if (status === "checking") return (
    <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
      <Loader2 className="w-3 h-3 animate-spin" /> Checking...
    </span>
  );
  if (status === "verified") return (
    <span className="text-xs text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
      <CheckCircle2 className="w-3 h-3" /> Verified
    </span>
  );
  return (
    <span className="text-xs text-red-700 bg-red-100 dark:bg-red-950/50 dark:text-red-300 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
      <XCircle className="w-3 h-3" /> Not Found
    </span>
  );
}

function GithubChecking() {
  const rows = ["Fetching profile data...", "Counting repositories...", "Checking activity history..."];
  return (
    <div className="mx-5 mb-5 bg-muted/50 rounded-xl px-4 py-3 space-y-2">
      {rows.map((r) => (
        <div key={r} className="flex items-center gap-2.5">
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
          <span className="text-xs text-muted-foreground">{r}</span>
        </div>
      ))}
    </div>
  );
}

function GithubVerifiedResult({ result }: { result: GithubResult }) {
  return (
    <div className="mx-5 mb-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Profile Found & Verified</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-emerald-900/30 rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Username</p>
          <p className="text-sm font-bold text-foreground">@{result.username}</p>
        </div>
        <div className="bg-white dark:bg-emerald-900/30 rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><GitFork className="w-3 h-3" />Repos</p>
          <p className="text-sm font-bold text-foreground">{result.repoCount}</p>
        </div>
        <div className="bg-white dark:bg-emerald-900/30 rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Users className="w-3 h-3" />Followers</p>
          <p className="text-sm font-bold text-foreground">{result.followers}</p>
        </div>
      </div>
    </div>
  );
}

function LinkedinChecking() {
  const rows = ["Fetching profile metadata...", "Verifying professional history..."];
  return (
    <div className="mx-5 mb-5 bg-muted/50 rounded-xl px-4 py-3 space-y-2">
      {rows.map((r) => (
        <div key={r} className="flex items-center gap-2.5">
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
          <span className="text-xs text-muted-foreground">{r}</span>
        </div>
      ))}
    </div>
  );
}

function LinkedinVerifiedResult({ result }: { result: LinkedinResult }) {
  return (
    <div className="mx-5 mb-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Profile Detected & Verified</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-emerald-900/30 rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Profile Status</p>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{result.profileDetected ? "Active" : "Inactive"}</p>
        </div>
        <div className="bg-white dark:bg-emerald-900/30 rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Star className="w-3 h-3" />Connections</p>
          <p className="text-sm font-bold text-foreground">{result.connections}</p>
        </div>
      </div>
    </div>
  );
}
