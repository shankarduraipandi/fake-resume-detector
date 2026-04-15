import { useLocation } from "wouter";
import { User, Mail, Phone, Briefcase, GraduationCap, MapPin, Tag, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useResumeStore } from "@/store/resumeStore";
import { useToast } from "@/hooks/use-toast";
import { sendOtp } from "@/services/api";
import { useState } from "react";

export default function Details() {
  const [, setLocation] = useLocation();
  const { extractedData } = useResumeStore();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  if (!extractedData) {
    setLocation("/upload");
    return null;
  }

  const fields = [
    { icon: <User className="w-4 h-4" />, label: "Full Name", value: extractedData.name },
    { icon: <Mail className="w-4 h-4" />, label: "Email Address", value: extractedData.email },
    { icon: <Phone className="w-4 h-4" />, label: "Phone Number", value: extractedData.phone },
    { icon: <Briefcase className="w-4 h-4" />, label: "Experience", value: extractedData.experience },
    { icon: <GraduationCap className="w-4 h-4" />, label: "Education", value: extractedData.education },
    { icon: <MapPin className="w-4 h-4" />, label: "Location", value: extractedData.location },
  ];

  const handleSendOtp = async () => {
    setSending(true);
    try {
      const result = await sendOtp(extractedData.email);
      if (result.success) {
        toast({ title: "OTP Sent!", description: `A verification code has been sent to ${extractedData.email}` });
        setLocation("/verify-otp");
      } else {
        toast({ title: "Failed to send OTP", description: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not send OTP. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="mb-8">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Step 2 of 5</span>
          <h1 className="text-3xl font-bold text-foreground mt-3 mb-1.5">Extracted Details</h1>
          <p className="text-muted-foreground text-sm">Review the information our AI extracted from the resume.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 mb-5" data-testid="extracted-details">
          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-border">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground text-sm">Candidate Information</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.label} className="group" data-testid={`field-${field.label.toLowerCase().replace(/\s/g, "-")}`}>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                  <span className="text-muted-foreground/70">{field.icon}</span>
                  {field.label}
                </label>
                <p className="text-sm font-semibold text-foreground bg-muted/50 rounded-lg px-3 py-2.5 border border-transparent group-hover:border-border transition-colors">
                  {field.value}
                </p>
              </div>
            ))}
          </div>

          <div data-testid="field-skills">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-muted-foreground/70" />
              Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {extractedData.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/15"
                  data-testid={`skill-${skill}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-5 flex items-start gap-2.5">
          <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Identity Verification Required</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              We'll send a one-time password to <strong>{extractedData.email}</strong> to verify the candidate's identity.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setLocation("/upload")} data-testid="button-back">
            Back
          </Button>
          <Button
            className="flex-1 gap-2 font-semibold"
            onClick={handleSendOtp}
            disabled={sending}
            data-testid="button-send-otp"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send OTP
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
