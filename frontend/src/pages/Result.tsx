import { useLocation } from "wouter";
import {
  CheckCircle2, AlertTriangle, XCircle, RotateCcw,
  User, Mail, Phone, Briefcase, GraduationCap, MapPin, Tag,
  TrendingUp, Lightbulb, Github, Linkedin, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useResumeStore } from "@/store/resumeStore";
import { Progress } from "@/components/ui/progress";

const STATUS_CONFIG = {
  Verified: {
    icon: <CheckCircle2 className="w-8 h-8" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/40",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    label: "Resume Verified",
    desc: "This resume appears to be authentic based on our AI analysis.",
  },
  Suspicious: {
    icon: <AlertTriangle className="w-8 h-8" />,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800/40",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    label: "Suspicious Activity",
    desc: "Some inconsistencies were detected. Manual review is recommended.",
  },
  Fake: {
    icon: <XCircle className="w-8 h-8" />,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800/40",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    label: "Fake Resume Detected",
    desc: "High probability of fraudulent information detected in this resume.",
  },
};

export default function Result() {
  const [, setLocation] = useLocation();
  const { analysisResult, externalVerification, reset } = useResumeStore();

  if (!analysisResult) {
    setLocation("/upload");
    return null;
  }

  const cfg = STATUS_CONFIG[analysisResult.status];
  const { extractedData, score, fakeProbability, jobSuggestions, details } = analysisResult;

  const fields = [
    { icon: <User className="w-3.5 h-3.5" />, label: "Name", value: extractedData.name },
    { icon: <Mail className="w-3.5 h-3.5" />, label: "Email", value: extractedData.email },
    { icon: <Phone className="w-3.5 h-3.5" />, label: "Phone", value: extractedData.phone },
    { icon: <Briefcase className="w-3.5 h-3.5" />, label: "Experience", value: extractedData.experience },
    { icon: <GraduationCap className="w-3.5 h-3.5" />, label: "Education", value: extractedData.education },
    { icon: <MapPin className="w-3.5 h-3.5" />, label: "Location", value: extractedData.location },
  ];

  const handleReset = () => {
    reset();
    setLocation("/");
  };

  const extV = externalVerification ?? analysisResult.externalVerification;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="mb-8">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Step 5 of 5</span>
          <h1 className="text-3xl font-bold text-foreground mt-3 mb-1.5">Verification Report</h1>
          <p className="text-muted-foreground text-sm">Complete AI-powered authenticity analysis for the submitted resume.</p>
        </div>

        {/* Status Banner */}
        <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-6 mb-5 flex items-center gap-4`} data-testid="status-banner">
          <div className={`${cfg.color} shrink-0`}>{cfg.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`} data-testid="status-label">
                {analysisResult.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{cfg.desc}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          {/* Authenticity Score */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm" data-testid="authenticity-score">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Authenticity Score</h3>
            </div>
            <div className="text-center mb-4">
              <span className="text-5xl font-black text-foreground">{score}</span>
              <span className="text-xl font-bold text-muted-foreground">/100</span>
            </div>
            <Progress value={score} className="h-2.5 mb-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 — Fake</span>
              <span>100 — Genuine</span>
            </div>
          </div>

          {/* Fake Probability */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm" data-testid="fake-probability">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-foreground text-sm">Fake Probability</h3>
            </div>
            <div className="text-center mb-4">
              <span className="text-5xl font-black text-foreground">{fakeProbability}</span>
              <span className="text-xl font-bold text-muted-foreground">%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${
                  fakeProbability > 60 ? "bg-red-500" : fakeProbability > 30 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${fakeProbability}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% — Genuine</span>
              <span>100% — Fake</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5" data-testid="verification-details">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Score Breakdown
          </h3>
          <div className="space-y-3">
            {details.map((d, i) => (
              <div key={i} className="flex items-center gap-3" data-testid={`detail-row-${i}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  d.ok
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                }`}>
                  {d.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{d.category}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.result}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    d.ok
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                  }`}>
                    {d.ok ? `+${d.points}` : "+0"}
                  </span>
                </div>
              </div>
            ))}
            {/* Total row */}
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Total (Core Score)</span>
              <span className="text-sm font-black text-primary">
                +{details.filter((d) => d.ok).reduce((acc, d) => acc + d.points, 0)} pts
              </span>
            </div>
          </div>
        </div>

        {/* External Validation Results */}
        {extV && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5" data-testid="external-validation">
            <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              External Validation Results
            </h3>
            <div className="space-y-3">
              {/* GitHub Row */}
              <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-muted/50 border border-transparent" data-testid="external-github">
                <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center shrink-0">
                  <Github className="w-3.5 h-3.5 text-white dark:text-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">GitHub</span>
                    {extV.github.status === "verified" ? (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Not Found
                      </span>
                    )}
                  </div>
                  {extV.github.status === "verified" && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      @{extV.github.username} &middot; {extV.github.repoCount} repositories found
                    </p>
                  )}
                </div>
                <span className={`text-xs font-black shrink-0 ${extV.github.status === "verified" ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {extV.github.status === "verified" ? "+20 pts" : "+0 pts"}
                </span>
              </div>

              {/* LinkedIn Row */}
              <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-muted/50 border border-transparent" data-testid="external-linkedin">
                <div className="w-7 h-7 rounded-lg bg-[#0A66C2] flex items-center justify-center shrink-0">
                  <Linkedin className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">LinkedIn</span>
                    {extV.linkedin.status === "verified" ? (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Not Found
                      </span>
                    )}
                  </div>
                  {extV.linkedin.status === "verified" && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Profile detected &middot; {extV.linkedin.connections} connections
                    </p>
                  )}
                </div>
                <span className={`text-xs font-black shrink-0 ${extV.linkedin.status === "verified" ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {extV.linkedin.status === "verified" ? "+15 pts" : "+0 pts"}
                </span>
              </div>

              {/* Confidence Boost Row */}
              <div className="border-t border-border pt-3 mt-1 flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-bold text-foreground">Confidence Boost</p>
                  <p className="text-xs text-muted-foreground">From external profile verification</p>
                </div>
                <span className="text-base font-black text-primary">
                  +{extV.confidenceBoost} pts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Extracted Summary */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-5" data-testid="extracted-summary">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Candidate Summary
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {fields.map((field) => (
              <div key={field.label} className="flex items-start gap-2.5">
                <span className="text-muted-foreground mt-0.5">{field.icon}</span>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{field.label}</p>
                  <p className="text-sm text-foreground font-semibold">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5" />
              Skills
            </label>
            <div className="flex flex-wrap gap-1.5">
              {extractedData.skills.map((skill) => (
                <span key={skill} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Job Suggestions */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-7" data-testid="job-suggestions">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Recommended Job Roles
          </h3>
          <div className="space-y-2">
            {jobSuggestions.map((job, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors" data-testid={`job-suggestion-${i}`}>
                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                <span className="text-sm font-medium text-foreground">{job}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleReset} data-testid="button-new-analysis">
            <RotateCcw className="w-4 h-4" />
            Analyze Another Resume
          </Button>
          <Button
            className="flex-1 gap-2 font-semibold"
            onClick={() => window.print()}
            data-testid="button-download-report"
          >
            Download Report
          </Button>
        </div>
      </div>
    </div>
  );
}
