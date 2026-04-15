import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export function Navbar() {
  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <ShieldCheck className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm tracking-tight">
              ResumeShield <span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI-Powered Detection
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
