import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CinematicModeProvider, useCinematicMode } from "@/contexts/CinematicModeContext";
import { LivePill } from "@/components/LivePill";
import { LastEventTicker } from "@/components/LastEventTicker";
import { CinematicToggle } from "@/components/CinematicToggle";
import { SystemTerminal } from "@/components/SystemTerminal";
import { cn } from "@/lib/utils";

function DashboardInner({ children }: { children: ReactNode }) {
  const { isCinematic } = useCinematicMode();

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen flex w-full", isCinematic && "cinematic")}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Layer 1: Animated gradient mesh */}
          <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
          {/* Layer 2: Dot grid */}
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          {/* Layer 3: Scanlines */}
          <div className="absolute inset-0 scanlines pointer-events-none" />
          {/* Radar sweep (cinematic only) */}
          {isCinematic && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "conic-gradient(from 0deg, transparent 0deg, hsl(190 90% 50% / 0.04) 30deg, transparent 60deg)",
                animation: "radar-sweep 8s linear infinite",
                transformOrigin: "center center",
              }}
            />
          )}

          <header className="h-12 flex items-center justify-between border-b border-border/50 px-4 relative z-10">
            <SidebarTrigger className="text-muted-foreground" />
            <div className="flex items-center gap-3">
              <LastEventTicker />
              <LivePill />
              <CinematicToggle />
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto relative z-10">
            {children}
          </main>
          <SystemTerminal />
        </div>
      </div>
    </SidebarProvider>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <CinematicModeProvider>
      <DashboardInner>{children}</DashboardInner>
    </CinematicModeProvider>
  );
}
