import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLatestActivity } from "@/hooks/useAgentActivity";
import { useCinematicMode } from "@/contexts/CinematicModeContext";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const typeColor: Record<string, string> = {
  output: "text-green-400",
  log: "text-blue-400",
  error: "text-red-400",
  status_change: "text-cyan-400",
  metric: "text-violet-400",
};

const typeLabel: Record<string, string> = {
  output: "OUT",
  log: "LOG",
  error: "ERR",
  status_change: "STS",
  metric: "MET",
};

export function SystemTerminal() {
  const { data: events } = useLatestActivity(50);
  const { isCinematic } = useCinematicMode();
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem("trenchclaw-terminal") !== "false";
    } catch {
      return true;
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const recentEvents = events ?? [];

  // Auto-scroll on new events
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem("trenchclaw-terminal", String(next));
    } catch {}
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-40 w-[360px] rounded-lg overflow-hidden glass border border-white/10",
        isCinematic && "w-[420px]"
      )}
    >
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 border-b border-border/30 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-green-400" />
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-green-400">
            System Log
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {/* Body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: isCinematic ? 260 : 220 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden"
          >
            {/* Top fade */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />

            <div
              ref={scrollRef}
              className="h-full overflow-y-auto px-3 py-2 space-y-0.5"
            >
              {recentEvents.length === 0 ? (
                <p className="text-[9px] font-mono text-muted-foreground/60 pt-4 text-center">
                  Waiting for first heartbeat...
                </p>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="flex gap-2 leading-tight">
                    <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0 tabular-nums">
                      {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className={cn("text-[9px] font-mono font-semibold shrink-0 w-6", typeColor[event.event_type])}>
                      {typeLabel[event.event_type] || "???"}
                    </span>
                    <span className="text-[9px] font-mono text-foreground/70 shrink-0">
                      {event.agent_name}:
                    </span>
                    <span className={cn("text-[9px] font-mono truncate", isCinematic ? "text-foreground/90" : "text-muted-foreground")}>
                      {event.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
