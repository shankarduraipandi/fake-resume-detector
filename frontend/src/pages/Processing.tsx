import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useResumeStore } from "@/store/resumeStore";
import { uploadResume, extractResumeData } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { ShieldCheck, FileSearch, Brain, CheckCircle2 } from "lucide-react";

const STEPS = [
  { icon: <FileSearch className="w-5 h-5" />, label: "Uploading resume file...", duration: 1200 },
  { icon: <Brain className="w-5 h-5" />, label: "Analyzing resume using AI...", duration: 2000 },
  { icon: <ShieldCheck className="w-5 h-5" />, label: "Extracting candidate details...", duration: 1000 },
  { icon: <CheckCircle2 className="w-5 h-5" />, label: "Preparing your report...", duration: 500 },
];

export default function Processing() {
  const [, setLocation] = useLocation();
  const { file, setFileId, setExtractedData } = useResumeStore();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!file) {
      setLocation("/upload");
      return;
    }
    if (hasRun.current) return;
    hasRun.current = true;

    async function run() {
      try {
        setCurrentStep(0);
        const { fileId } = await uploadResume(file!);
        setFileId(fileId);

        setCurrentStep(1);
        const data = await extractResumeData(fileId);
        setExtractedData(data);

        setCurrentStep(2);
        await new Promise((r) => setTimeout(r, 1000));

        setCurrentStep(3);
        await new Promise((r) => setTimeout(r, 500));

        setDone(true);
        toast({ title: "Analysis complete!", description: "Your resume has been extracted successfully." });
        setTimeout(() => setLocation("/details"), 700);
      } catch {
        setError("Something went wrong while processing your resume. Please try again.");
        toast({ title: "Processing failed", description: "An error occurred. Please try uploading again.", variant: "destructive" });
      }
    }

    run();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8">
            <p className="text-destructive font-semibold text-lg mb-2">Processing Failed</p>
            <p className="text-muted-foreground text-sm mb-5">{error}</p>
            <button
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              onClick={() => setLocation("/upload")}
              data-testid="button-retry"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className={`w-9 h-9 text-primary ${done ? "" : "animate-pulse"}`} />
            </div>
            {!done && (
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {done ? "Analysis Complete!" : "Analyzing Your Resume"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {done ? "Redirecting you to the results..." : "Please wait while our AI processes your resume."}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3" data-testid="processing-steps">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep && !done;
            const isCompleted = done || i < currentStep;
            const isPending = !done && i > currentStep;

            return (
              <div
                key={i}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                  isActive ? "bg-primary/8 border border-primary/20" :
                  isCompleted ? "bg-muted/50" :
                  "opacity-40"
                }`}
                data-testid={`step-${i}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isCompleted ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" :
                  isActive ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                </div>
                <span className={`text-sm font-medium ${
                  isCompleted ? "text-emerald-700 dark:text-emerald-400" :
                  isActive ? "text-foreground" :
                  "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <div
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${d * 150}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold text-foreground">
              {done ? "100" : Math.round(((currentStep) / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: done ? "100%" : `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
