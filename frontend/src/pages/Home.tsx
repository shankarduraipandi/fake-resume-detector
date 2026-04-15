import { useLocation } from "wouter";
import { ShieldCheck, Zap, Lock, BarChart3, ArrowRight, FileText, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <FileText className="w-5 h-5 text-primary" />,
      title: "AI Resume Parsing",
      desc: "Extracts name, email, phone, skills and experience with high accuracy.",
    },
    {
      icon: <Zap className="w-5 h-5 text-primary" />,
      title: "Instant Analysis",
      desc: "Get results in seconds using our advanced machine learning pipeline.",
    },
    {
      icon: <Lock className="w-5 h-5 text-primary" />,
      title: "OTP Verification",
      desc: "Confirm candidate identity via secure one-time password verification.",
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-primary" />,
      title: "Fake Score & Report",
      desc: "Visual score, probability, and category breakdown for every resume.",
    },
  ];

  const statuses = [
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Verified", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { icon: <AlertTriangle className="w-4 h-4" />, label: "Suspicious", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
    { icon: <XCircle className="w-4 h-4" />, label: "Fake", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/20 pointer-events-none" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-6 border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                AI-Powered Resume Verification
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight mb-6">
                Fake Resume
                <span className="text-primary block sm:inline"> Detection</span>
                <span className="block">System</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
                Automatically detect fraudulent resumes using AI. Upload a PDF or DOCX, verify identity via OTP, and get a detailed authenticity report in seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="gap-2 text-base font-semibold px-7 shadow-md"
                  onClick={() => setLocation("/upload")}
                  data-testid="button-upload-resume"
                >
                  Upload Resume
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3 px-4 py-2">
                  {statuses.map((s) => (
                    <span key={s.label} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${s.bg} ${s.color}`}>
                      {s.icon}
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Three simple steps to verify any resume's authenticity</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Upload Resume", desc: "Upload a PDF or DOCX resume. Drag and drop supported." },
              { step: "02", title: "AI Extraction & OTP", desc: "Our AI extracts all key details and sends an OTP to verify identity." },
              { step: "03", title: "Get Your Report", desc: "Receive a detailed authenticity score with job suggestions." },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-all hover:border-primary/20">
                  <span className="text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors leading-none block mb-4">
                    {item.step}
                  </span>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/40 border-y border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Powerful Features</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Everything you need to catch fraudulent resumes before they get through</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f) => (
                <div key={f.title} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm hover:border-primary/20 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-10">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Ready to Detect Fake Resumes?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Start analyzing resumes in seconds. No account needed.</p>
            <Button size="lg" className="gap-2 px-8 font-semibold shadow-md" onClick={() => setLocation("/upload")} data-testid="button-start-now">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        ResumeShield AI &copy; {new Date().getFullYear()} — AI-Based Fake Resume Detection System
      </footer>
    </div>
  );
}
