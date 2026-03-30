import { useState, useEffect, useCallback, useMemo } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useNotionQuery } from "@/hooks/useNotionQuery";
import { useLatestActivity } from "@/hooks/useAgentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SystemsHealthBar } from "@/components/SystemsHealthBar";
import { AgentActivityMeter } from "@/components/AgentActivityMeter";
import { AgentAvatar } from "@/components/AgentAvatar";
import { EventMarquee } from "@/components/EventMarquee";
import { AgentDetailDrawer } from "@/components/AgentDetailDrawer";
import { useCinematicMode } from "@/contexts/CinematicModeContext";
import { motion } from "framer-motion";
import { Bot, Activity, AlertTriangle, Clock, Hash, LayoutGrid, Network, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuralMap } from "@/components/neural/NeuralMap";
import { AnimatePresence } from "framer-motion";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface HeartbeatPayload {
  status?: string;
  detail?: string;
  tools?: string[];
  output_type?: string;
  revenue_model?: string;
  degraded_reasons?: string[];
  healthy_crons?: string[];
  total_outputs?: number;
  last_output_hours_ago?: number;
  last_memory_hours_ago?: number;
  [key: string]: any;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  purpose: string;
  is_active: boolean;
  computed_status: string;
  last_run_at: string | null;
  last_heartbeat_at: string | null;
  heartbeat_payload: HeartbeatPayload | null;
  last_summary: string | null;
  current_task: string | null;
  slack_channel: string | null;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}


const Index = () => {
  // Agentes: carregado da API local (não Supabase)
  const { data: allAgents, isLoading } = useNotionQuery<Agent[]>(
    "agents",
    "agents",
    30_000
  );
  const { data: blockers } = useSupabaseQuery("blockers-count", "blockers", {
    filter: { column: "status", value: "open" },
  });
  const { data: cronHealth } = useSupabaseQuery("cron-health", "cron_health");
  const { isCinematic } = useCinematicMode();
  const { data: latestEvents } = useLatestActivity(1);
  const latestEvent = latestEvents?.[latestEvents.length - 1] ?? null;

  // View mode: grid vs neural vs command (split)
  type ViewMode = "grid" | "neural" | "command";
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("commandcenter-view") as ViewMode) || "grid";
  });
  const toggleView = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("commandcenter-view", mode);
  }, []);

  // Agent drawer state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Neon flash tracking
  const [flashingAgents, setFlashingAgents] = useState<Set<string>>(new Set());

  // Only show active agents
  const agents = useMemo(() => allAgents?.filter((a) => a.is_active) ?? [], [allAgents]);
  const healthyCount = agents.filter((a) => ["active", "running", "idle"].includes(a.computed_status)).length;
  const degradedCount = agents.filter((a) => ["degraded", "errored", "stale"].includes(a.computed_status)).length;
  const pausedCount = agents.filter((a) => ["paused", "unknown"].includes(a.computed_status)).length;
  const lateJobs = cronHealth?.filter((c: any) => c.health_status !== "on_time").length ?? 0;

  // Neon flash on error events
  useEffect(() => {
    if (latestEvent && (latestEvent.event_type === "error" || latestEvent.event_type === "status_change")) {
      setFlashingAgents((prev) => new Set(prev).add(latestEvent.agent_id));
      const timer = setTimeout(() => {
        setFlashingAgents((prev) => {
          const next = new Set(prev);
          next.delete(latestEvent.agent_id);
          return next;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [latestEvent]);


  const openAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient-shimmer">
          Command Center
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agent fleet overview and operational status
        </p>
      </div>

      {/* Hero strip */}
      <div className="space-y-2.5">
        <EventMarquee />
        <SystemsHealthBar
          active={healthyCount}
          degraded={degradedCount}
          paused={pausedCount}
          total={agents.length}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Bot} label="Total Agents" value={agents.length} variant="cyan" delay={0} />
        <SummaryCard icon={Activity} label="Healthy" value={healthyCount} variant="success" delay={0.05} />
        <SummaryCard icon={AlertTriangle} label="Degraded" value={degradedCount} variant="warning" delay={0.1} />
        <SummaryCard icon={Clock} label="Late Crons" value={lateJobs} variant="warning" delay={0.15} />
      </div>

      {/* Agent Fleet Header + View Toggle */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Agent Fleet</h2>
          <div className="flex items-center gap-1 p-0.5 rounded-lg glass border border-white/5">
            <button
              onClick={() => toggleView("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wider uppercase transition-all",
                viewMode === "grid"
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              onClick={() => toggleView("neural")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wider uppercase transition-all",
                viewMode === "neural"
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                  : "text-muted-foreground hover:text-foreground/70"
              )}
            >
              <Network className="h-3.5 w-3.5" />
              Neural
            </button>
            <button
              onClick={() => toggleView("command")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wider uppercase transition-all",
                viewMode === "command"
                  ? "bg-purple-400/10 text-purple-400 border border-purple-400/20"
                  : "text-muted-foreground hover:text-foreground/70"
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Command
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "neural" ? (
            <motion.div
              key="neural"
              initial={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {isLoading ? (
                <Skeleton className="w-full rounded-lg" style={{ height: "calc(100vh - 220px)" }} />
              ) : (
                <NeuralMap agents={agents} />
              )}
            </motion.div>
          ) : viewMode === "command" ? (
            <motion.div
              key="command"
              initial={{ opacity: 0, scale: 1.01, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.99, filter: "blur(6px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {isLoading ? (
                <div className="flex gap-4" style={{ height: "calc(100vh - 220px)" }}>
                  <Skeleton className="flex-1 rounded-lg" />
                  <Skeleton className="w-[420px] rounded-lg" />
                </div>
              ) : (
                <PanelGroup
                  direction="horizontal"
                  autoSaveId="command-split"
                  style={{ height: "calc(100vh - 220px)", minHeight: 500 }}
                >
                  {/* Neural map — left panel */}
                  <Panel defaultSize={70} minSize={35}>
                    <div className="h-full pr-1">
                      <NeuralMap agents={agents} fillHeight />
                    </div>
                  </Panel>

                  {/* Resize handle */}
                  <PanelResizeHandle className="command-resize-handle" />

                  {/* Agent cards — right scrollable panel */}
                  <Panel defaultSize={30} minSize={18}>
                    <div className="h-full pl-1 flex flex-col gap-2 overflow-hidden">
                      <div className="flex items-center justify-between px-1 pb-1 border-b border-border/20">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                          Fleet Roster
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {agents.length} agents
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                        {agents.map((agent, i) => {
                          const hb = agent.heartbeat_payload;
                          const isFlashing = flashingAgents.has(agent.id);
                          return (
                            <motion.div
                              key={agent.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                            >
                              <Card
                                className={cn(
                                  "glass border-white/5 hover:border-white/10 transition-all cursor-pointer",
                                  isFlashing && "animate-neon-flash"
                                )}
                                onClick={() => openAgent(agent)}
                              >
                                <CardContent className="py-3 px-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <AgentAvatar name={agent.name} status={agent.computed_status} emoji={agent.emoji} size={28} />
                                      <span className="text-sm font-medium">{agent.name}</span>
                                    </div>
                                    <StatusBadge status={agent.computed_status} />
                                  </div>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                                    {agent.purpose || "No purpose defined"}
                                  </p>
                                  {hb?.degraded_reasons && hb.degraded_reasons.length > 0 && (
                                    <p className="text-[10px] text-warning bg-warning/10 border border-warning/20 rounded px-2 py-1 break-words line-clamp-2">
                                      {hb.degraded_reasons[0]}
                                    </p>
                                  )}
                                  {agent.current_task && (
                                    <p className="text-[10px] text-primary bg-primary/10 rounded px-2 py-0.5 line-clamp-1">
                                      {agent.current_task}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                                    <span>
                                      {agent.last_heartbeat_at
                                        ? `${timeAgo(agent.last_heartbeat_at)}`
                                        : agent.last_run_at
                                        ? `${timeAgo(agent.last_run_at)}`
                                        : "No signal"}
                                    </span>
                                    <AgentActivityMeter agentId={agent.id} />
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </Panel>
                </PanelGroup>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-lg" />
                  ))}
                </div>
              ) : agents.length === 0 ? (
                <Card className="border-dashed border-border/50">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No agents deployed yet. Run the schema SQL and add agents.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map((agent, i) => {
                    const hb = agent.heartbeat_payload;
                    const isFlashing = flashingAgents.has(agent.id);
                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className={cn(
                            "glass border-white/5 hover:border-white/10 transition-all cursor-pointer",
                            isFlashing && "animate-neon-flash"
                          )}
                          onClick={() => openAgent(agent)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AgentAvatar name={agent.name} status={agent.computed_status} emoji={agent.emoji} />
                                <CardTitle className="text-sm font-medium">
                                  {agent.name}
                                </CardTitle>
                              </div>
                              <StatusBadge status={agent.computed_status} />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2.5">
                            <p className="text-xs text-muted-foreground">
                              {agent.purpose || "No purpose defined"}
                            </p>

                            {/* Degraded reasons */}
                            {hb?.degraded_reasons && hb.degraded_reasons.length > 0 && (
                              <div className="space-y-1">
                                {hb.degraded_reasons.map((r, idx) => (
                                  <p key={idx} className="text-[11px] text-warning bg-warning/10 border border-warning/20 rounded px-2 py-1.5 break-words">
                                    {r}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Current task */}
                            {agent.current_task && (
                              <p className="text-[11px] text-primary bg-primary/10 rounded px-2 py-1 line-clamp-1">
                                {agent.current_task}
                              </p>
                            )}

                            {/* Tools */}
                            {hb?.tools && hb.tools.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {hb.tools.map((tool) => (
                                  <Badge key={tool} variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Output + Revenue */}
                            {hb?.output_type && (
                              <p className="text-[10px] text-muted-foreground">
                                <span className="text-foreground/70">Output:</span> {hb.output_type}
                              </p>
                            )}
                            {hb?.revenue_model && (
                              <p className="text-[10px] text-muted-foreground">
                                <span className="text-foreground/70">Revenue:</span> {hb.revenue_model}
                              </p>
                            )}

                            {/* Slack channel link */}
                            {(() => {
                              if (!agent.slack_channel) return null;
                              try {
                                const sc = typeof agent.slack_channel === "string" ? JSON.parse(agent.slack_channel) : agent.slack_channel;
                                if (!sc?.channel) return null;
                                return (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400/70">
                                    <Hash className="h-3 w-3" />
                                    {sc.channel.replace(/^#/, "")}
                                  </span>
                                );
                              } catch { return null; }
                            })()}

                            {/* Footer: heartbeat + activity meter */}
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                              <span>
                                {agent.last_heartbeat_at
                                  ? `Heartbeat: ${timeAgo(agent.last_heartbeat_at)}`
                                  : agent.last_run_at
                                  ? `Last run: ${timeAgo(agent.last_run_at)}`
                                  : "No signal"}
                              </span>
                              <AgentActivityMeter agentId={agent.id} />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Agent Detail Drawer */}
      <AgentDetailDrawer
        agent={selectedAgent}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setSelectedAgent(null);
        }}
      />
    </div>
  );
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  delay = 0,
}: {
  icon: any;
  label: string;
  value: number;
  variant?: "default" | "success" | "destructive" | "warning" | "cyan";
  delay?: number;
}) {
  const iconColors: Record<string, string> = {
    default: "text-muted-foreground",
    success: "text-success",
    destructive: "text-destructive",
    warning: "text-warning",
    cyan: "text-cyan-400",
  };

  const glowClasses: Record<string, string> = {
    default: "",
    success: "glow-success",
    destructive: "glow-destructive",
    warning: "glow-warning",
    cyan: "glow-cyan",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`glass border-white/5 ${glowClasses[variant]}`}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${iconColors[variant]}`} />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <AnimatedNumber value={value} className="text-xl font-semibold tabular-nums" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default Index;
