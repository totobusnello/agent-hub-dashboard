import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentActivity } from "@/hooks/useAgentActivity";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeartbeatPayload {
  status?: string;
  detail?: string;
  tools?: string[];
  output_type?: string;
  revenue_model?: string;
  degraded_reasons?: string[];
  total_outputs?: number;
  [key: string]: any;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  purpose: string;
  computed_status: string;
  current_task: string | null;
  heartbeat_payload: HeartbeatPayload | null;
  last_heartbeat_at: string | null;
}

const statusGlow: Record<string, string> = {
  active: "shadow-[0_0_30px_hsl(142_60%_50%/0.2)]",
  running: "shadow-[0_0_30px_hsl(142_60%_50%/0.2)]",
  idle: "shadow-[0_0_20px_hsl(210_90%_50%/0.15)]",
  degraded: "shadow-[0_0_30px_hsl(38_80%_55%/0.2)]",
  errored: "shadow-[0_0_30px_hsl(0_62%_55%/0.2)]",
};

const eventTypeColor: Record<string, string> = {
  output: "text-success",
  log: "text-blue-400",
  error: "text-destructive",
  status_change: "text-cyan-400",
  metric: "text-violet-400",
};

export function AgentDetailDrawer({
  agent,
  open,
  onOpenChange,
}: {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: agentEvents } = useAgentActivity(agent?.id, 5);

  if (!agent) return null;

  const recentEvents = (agentEvents ?? []).slice(-5).reverse();
  const hb = agent.heartbeat_payload;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn("glass border-white/10 w-[380px] sm:w-[420px]", statusGlow[agent.computed_status])}
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <AgentAvatar name={agent.name} status={agent.computed_status} emoji={agent.emoji} size={48} />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg">{agent.name}</SheetTitle>
              <StatusBadge status={agent.computed_status} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{agent.purpose}</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-2">
          <div className="space-y-5">
            {/* Current Task */}
            {agent.current_task && (
              <section>
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Current Task</h3>
                <p className="text-xs text-primary bg-primary/10 rounded px-3 py-2">{agent.current_task}</p>
              </section>
            )}

            {/* Recent Events */}
            <section>
              <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Recent Events</h3>
              {recentEvents.length > 0 ? (
                <div className="space-y-2">
                  {recentEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-[11px]"
                    >
                      <span className="text-[9px] font-mono text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                        {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <Badge variant="outline" className={cn("text-[8px] px-1 py-0 shrink-0", eventTypeColor[event.event_type])}>
                        {event.event_type}
                      </Badge>
                      <span className="text-muted-foreground">{event.message}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">No recent events</p>
              )}
            </section>

            {/* Tools */}
            {hb?.tools && hb.tools.length > 0 && (
              <section>
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Tools</h3>
                <div className="flex flex-wrap gap-1.5">
                  {hb.tools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="text-[10px] font-normal">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Output & Revenue */}
            {(hb?.output_type || hb?.revenue_model) && (
              <section>
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Output</h3>
                <div className="space-y-1 text-xs">
                  {hb?.output_type && (
                    <p><span className="text-muted-foreground">Type:</span> {hb.output_type}</p>
                  )}
                  {hb?.revenue_model && (
                    <p><span className="text-muted-foreground">Revenue:</span> {hb.revenue_model}</p>
                  )}
                  {hb?.total_outputs != null && (
                    <p><span className="text-muted-foreground">Total:</span> {hb.total_outputs} outputs</p>
                  )}
                </div>
              </section>
            )}

            {/* Open Logs Button */}
            <Button variant="outline" size="sm" className="w-full text-xs gap-2" disabled>
              <ExternalLink className="h-3 w-3" />
              Open Logs
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
