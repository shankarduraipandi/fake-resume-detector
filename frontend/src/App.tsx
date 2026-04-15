import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ResumeContext, useResumeState } from "@/store/resumeStore";
import Home from "@/pages/Home";
import Upload from "@/pages/Upload";
import Processing from "@/pages/Processing";
import Details from "@/pages/Details";
import OtpVerify from "@/pages/OtpVerify";
import ExternalVerification from "@/pages/ExternalVerification";
import Result from "@/pages/Result";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload" component={Upload} />
      <Route path="/processing" component={Processing} />
      <Route path="/details" component={Details} />
      <Route path="/verify-otp" component={OtpVerify} />
      <Route path="/external-verify" component={ExternalVerification} />
      <Route path="/result" component={Result} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const resumeState = useResumeState();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ResumeContext.Provider value={resumeState}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </ResumeContext.Provider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
