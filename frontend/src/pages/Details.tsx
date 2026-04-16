import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { User, Mail, Phone, Briefcase, GraduationCap, MapPin, Tag, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useResumeStore } from "@/store/resumeStore";
import { useToast } from "@/hooks/use-toast";
import { sendOtp, updateResumeDetails, type ExtractedData } from "@/services/api";

type DetailsFormState = Omit<ExtractedData, "skills"> & {
  skillsText: string;
};

function createFormState(data: ExtractedData): DetailsFormState {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    experience: data.experience,
    education: data.education,
    location: data.location,
    skillsText: data.skills.join(", "),
  };
}

function buildExtractedData(formState: DetailsFormState): ExtractedData {
  const skills = formState.skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  return {
    name: formState.name.trim(),
    email: formState.email.trim(),
    phone: formState.phone.trim(),
    experience: formState.experience.trim(),
    education: formState.education.trim(),
    location: formState.location.trim(),
    skills: skills.length > 0 ? skills : ["Not mentioned"],
  };
}

export default function Details() {
  const [, setLocation] = useLocation();
  const { fileId, extractedData, setExtractedData } = useResumeStore();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [formState, setFormState] = useState<DetailsFormState | null>(
    extractedData ? createFormState(extractedData) : null,
  );

  useEffect(() => {
    if (extractedData) {
      setFormState(createFormState(extractedData));
    }
  }, [extractedData]);

  if (!extractedData || !formState) {
    setLocation("/upload");
    return null;
  }

  const parsedSkills = useMemo(
    () => formState.skillsText.split(",").map((skill) => skill.trim()).filter(Boolean),
    [formState.skillsText],
  );

  const handleChange = (field: keyof DetailsFormState, value: string) => {
    setFormState((current) => {
      if (!current) return current;
      return { ...current, [field]: value };
    });
  };

  const handleSendOtp = async () => {
    if (!fileId) {
      toast({
        title: "Missing resume ID",
        description: "Please upload the resume again before continuing.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const updatedData = await updateResumeDetails(fileId, buildExtractedData(formState));
      setExtractedData(updatedData);

      if (!updatedData.phone || updatedData.phone === "Not mentioned") {
        toast({
          title: "Phone number required",
          description: "Please enter a valid mobile number to receive the OTP.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      const result = await sendOtp(updatedData.phone);
      if (result.success) {
        toast({
          title: "OTP Sent!",
          description: `A verification code has been sent to ${updatedData.phone}`,
        });
        setLocation("/verify-otp");
      } else {
        toast({ title: "Failed to send OTP", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save details or send OTP.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const fields = [
    { key: "name" as const, icon: <User className="w-4 h-4" />, label: "Full Name", type: "text" },
    { key: "email" as const, icon: <Mail className="w-4 h-4" />, label: "Email Address", type: "email" },
    { key: "phone" as const, icon: <Phone className="w-4 h-4" />, label: "Phone Number", type: "tel" },
    { key: "experience" as const, icon: <Briefcase className="w-4 h-4" />, label: "Experience", type: "text" },
    { key: "education" as const, icon: <GraduationCap className="w-4 h-4" />, label: "Education", type: "text" },
    { key: "location" as const, icon: <MapPin className="w-4 h-4" />, label: "Location", type: "text" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="mb-8">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Step 2 of 5</span>
          <h1 className="text-3xl font-bold text-foreground mt-3 mb-1.5">Review Candidate Details</h1>
          <p className="text-muted-foreground text-sm">Edit any extracted information before continuing to mobile verification.</p>
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
              <div key={field.key} className="group" data-testid={`field-${field.key}`}>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1.5">
                  <span className="text-muted-foreground/70">{field.icon}</span>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={formState[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full text-sm font-semibold text-foreground bg-muted/50 rounded-lg px-3 py-2.5 border border-border focus:border-primary focus:outline-none"
                />
                {field.key === "phone" && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    10-digit numbers are automatically stored with the <span className="font-semibold">+91</span> country code.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div data-testid="field-skills">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground/70" />
              Skills
            </label>
            <textarea
              value={formState.skillsText}
              onChange={(e) => handleChange("skillsText", e.target.value)}
              rows={3}
              className="w-full text-sm font-semibold text-foreground bg-muted/50 rounded-lg px-3 py-2.5 border border-border focus:border-primary focus:outline-none resize-none"
              placeholder="Python, Flask, PostgreSQL"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Separate skills with commas.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {parsedSkills.map((skill) => (
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
          <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Mobile OTP Verification</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              When you continue, your edits are saved first, and the OTP is sent to the normalized mobile number.
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
                Saving & Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Save & Send OTP
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
