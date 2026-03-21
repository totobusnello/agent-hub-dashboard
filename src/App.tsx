import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import CronHealth from "./pages/CronHealth";
import Blockers from "./pages/Blockers";
import Tarefas from "./pages/Tarefas";
import UpdateSistema from "./pages/UpdateSistema";
import MemoriaDecisoes from "./pages/MemoriaDecisoes";
import MemoriaHealth from "./pages/MemoriaHealth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-mono text-muted-foreground animate-pulse">INITIALIZING...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/cron" element={<ProtectedRoute><CronHealth /></ProtectedRoute>} />
            <Route path="/blockers" element={<ProtectedRoute><Blockers /></ProtectedRoute>} />
            <Route path="/tarefas" element={<ProtectedRoute><Tarefas /></ProtectedRoute>} />
            <Route path="/update-sistema" element={<ProtectedRoute><UpdateSistema /></ProtectedRoute>} />
            <Route path="/memoria" element={<ProtectedRoute><MemoriaDecisoes /></ProtectedRoute>} />
            <Route path="/memoria-health" element={<ProtectedRoute><MemoriaHealth /></ProtectedRoute>} />
            {/* Legacy redirects */}
            <Route path="/todos" element={<Navigate to="/tarefas" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
