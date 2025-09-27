import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CaseView from "./pages/CaseView";
import SpecialistGrid from "./pages/SpecialistGrid";
import EvidenceExplorer from "./pages/EvidenceExplorer";
import ResearchHub from "./pages/ResearchHub";
import ModelOperations from "./pages/ModelOperations";
import PatientSummary from "./pages/PatientSummary";
import TestsOrders from "./pages/TestsOrders";
import AdminAudit from "./pages/AdminAudit";
import PatientOnboarding from "./pages/PatientOnboarding";
import NotFound from "./pages/NotFound";
import DiagnosisProgress from "./pages/DiagnosisProgress";
import DiagnosisResult from "./pages/DiagnosisResult";
import CollaborationRoom from "./pages/CollaborationRoom";
import VisualDiagnosis from "./pages/VisualDiagnosis";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/case/:id" element={<CaseView />} />
          <Route path="/specialists" element={<SpecialistGrid />} />
          <Route path="/evidence" element={<EvidenceExplorer />} />
          <Route path="/research" element={<ResearchHub />} />
          <Route path="/model-ops" element={<ModelOperations />} />
          <Route path="/patient/:id" element={<PatientSummary />} />
          <Route path="/patient-summary/:id" element={<PatientSummary />} />
          <Route path="/patient-onboarding" element={<PatientOnboarding />} />
          <Route path="/onboarding" element={<PatientOnboarding />} />
          <Route path="/case-view/:caseId" element={<CaseView />} />
          <Route path="/patient-summary/:mrn" element={<PatientSummary />} />
          <Route path="/evidence-explorer" element={<EvidenceExplorer />} />
          <Route path="/collaboration-room" element={<CollaborationRoom />} />
          <Route path="/model-operations" element={<ModelOperations />} />
          <Route path="/research-hub" element={<ResearchHub />} />
          <Route path="/specialist-grid" element={<SpecialistGrid />} />
          <Route path="/tests-orders" element={<TestsOrders />} />
          <Route path="/admin-audit" element={<AdminAudit />} />
          <Route path="/diagnosis-progress/:mrn" element={<DiagnosisProgress />} />
          <Route path="/diagnosis-result" element={<DiagnosisResult />} />
          <Route path="/visual-diagnosis" element={<VisualDiagnosis />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
