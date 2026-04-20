import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import CronHealth from "./pages/CronHealth";
import Blockers from "./pages/Blockers";
import Tarefas from "./pages/Tarefas";
import UpdateSistema from "./pages/UpdateSistema";
import MemoriaDecisoes from "./pages/MemoriaDecisoes";
import MemoriaHealth from "./pages/MemoriaHealth";
import MemoryHealth from "./pages/MemoryHealth";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import AgentIntel from "./pages/AgentIntel";
import SystemPaper from "./pages/SystemPaper";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Page = ({ children }: { children: React.ReactNode }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Page><Index /></Page>} />
          <Route path="/cron" element={<Page><CronHealth /></Page>} />
          <Route path="/blockers" element={<Page><Blockers /></Page>} />
          <Route path="/tarefas" element={<Page><Tarefas /></Page>} />
          <Route path="/update-sistema" element={<Page><UpdateSistema /></Page>} />
          <Route path="/memoria" element={<Page><MemoriaDecisoes /></Page>} />
          <Route path="/memoria-health" element={<Page><MemoriaHealth /></Page>} />
          <Route path="/memory" element={<Page><MemoryHealth /></Page>} />
          <Route path="/knowledge-graph" element={<Page><KnowledgeGraph /></Page>} />
          <Route path="/agent-intel" element={<Page><AgentIntel /></Page>} />
          <Route path="/system-paper" element={<Page><SystemPaper /></Page>} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="/todos" element={<Navigate to="/tarefas" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
