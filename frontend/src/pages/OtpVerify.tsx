import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, KeyRound, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useResumeStore } from "@/store/resumeStore";
import { verifyOtp, sendOtp } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function OtpVerify() {
  const [, setLocation] = useLocation();
  const { extractedData } = useResumeStore();
  const { toast } = useToast();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!extractedData) {
    setLocation("/upload");
    return null;
  }

  if (!extractedData.phone || extractedData.phone === "Not mentioned") {
    setLocation("/details");
    return null;
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setError(null);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const next = [...otp];
      pasted.split("").forEach((ch, idx) => { if (idx < 6) next[idx] = ch; });
      setOtp(next);
      document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit OTP.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const result = await verifyOtp(code, extractedData.phone);
      if (!result.success) {
        setError(result.message);
        toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
        setVerifying(false);
        return;
      }
      toast({ title: "OTP Verified!", description: "Proceeding to external profile verification." });
      setLocation("/external-verify");
    } catch {
      setError("Verification failed. Please try again.");
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await sendOtp(extractedData.phone);
      toast({ title: "OTP Resent", description: `A new code was sent to ${extractedData.phone}` });
      setOtp(["", "", "", "", "", ""]);
      setError(null);
    } catch {
      toast({ title: "Error", description: "Could not resend OTP.", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const filled = otp.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="mb-8">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Step 3 of 5</span>
          <h1 className="text-3xl font-bold text-foreground mt-3 mb-1.5">Verify Identity</h1>
          <p className="text-muted-foreground text-sm">Enter the 6-digit code sent to the candidate's mobile number.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-7 shadow-sm">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6.5 h-6.5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent for <span className="font-semibold text-foreground">{extractedData.phone}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              If delivery is mocked or SMS is unavailable, the generated OTP is logged by the backend.
            </p>
          </div>

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste} data-testid="otp-input-group">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-background focus:outline-none transition-all ${
                  error
                    ? "border-destructive focus:border-destructive"
                    : digit
                    ? "border-primary bg-primary/5"
                    : "border-border focus:border-primary"
                }`}
                data-testid={`otp-digit-${i}`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-4 py-2.5 mb-4" data-testid="error-otp">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <Button
            className="w-full gap-2 font-semibold"
            onClick={handleVerify}
            disabled={!filled || verifying}
            data-testid="button-verify-otp"
          >
            {verifying ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Verifying & Analyzing...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Verify OTP
              </>
            )}
          </Button>

          <div className="mt-4 flex items-center justify-between">
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              onClick={() => setLocation("/details")}
              data-testid="button-back"
            >
              Back to details
            </button>
            <button
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 disabled:opacity-50"
              onClick={handleResend}
              disabled={resending}
              data-testid="button-resend-otp"
            >
              {resending ? <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {resending ? "Resending..." : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
