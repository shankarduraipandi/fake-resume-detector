import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Upload as UploadIcon, FileText, X, AlertCircle, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useResumeStore } from "@/store/resumeStore";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE_MB = 10;

export default function Upload() {
  const [, setLocation] = useLocation();
  const { setFile } = useResumeStore();
  const { toast } = useToast();
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) return "Only PDF and DOCX files are accepted.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File size must be under ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const err = validate(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a resume to upload.", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
    toast({ title: "File selected!", description: `${selectedFile.name} is ready to analyze.` });
    setLocation("/processing");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="mb-8">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Step 1 of 5</span>
          <h1 className="text-3xl font-bold text-foreground mt-3 mb-1.5">Upload Your Resume</h1>
          <p className="text-muted-foreground text-sm">Upload a PDF or DOCX file to begin AI-powered authenticity analysis.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div
            data-testid="dropzone"
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
              dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/40"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${dragging ? "bg-primary/20" : "bg-muted"}`}>
              <CloudUpload className={`w-7 h-7 transition-colors ${dragging ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <p className="font-semibold text-foreground mb-1">
              {dragging ? "Drop your resume here" : "Drag & drop your resume"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">PDF</span>
              <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">DOCX</span>
              <span className="text-xs text-muted-foreground">Max {MAX_SIZE_MB}MB</span>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={onInputChange}
              data-testid="input-file"
            />
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3" data-testid="error-upload">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {selectedFile && (
            <div className="mt-4 flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3" data-testid="selected-file">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
              </div>
              <button
                className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(null); }}
                data-testid="button-remove-file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setLocation("/")} data-testid="button-back">
              Back
            </Button>
            <Button
              className="flex-1 gap-2 font-semibold"
              onClick={handleSubmit}
              disabled={!selectedFile}
              data-testid="button-submit-upload"
            >
              <UploadIcon className="w-4 h-4" />
              Analyze Resume
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
