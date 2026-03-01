import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Bot, Activity, AlertTriangle, Clock } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  purpose: string;
  computed_status: string;
  last_run_at: string | null;
  last_summary: string | null;
}

const Index = () => {
  const { data: agents, isLoading } = useSupabaseQuery<Agent>(
    "agents",
    "agent_current_status"
  );
  const { data: blockers } = useSupabaseQuery("blockers-count", "blockers", {
    filter: { column: "status", value: "open" },
  });
  const { data: cronHealth } = useSupabaseQuery("cron-health", "cron_health");

  const activeCount = agents?.filter((a) => a.computed_status === "active").length ?? 0;
  const errorCount = agents?.filter((a) => a.computed_status === "errored").length ?? 0;
  const lateJobs = cronHealth?.filter((c: any) => c.health_status !== "on_time").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">
          Command Center
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agent fleet overview and operational status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Bot}
          label="Total Agents"
          value={agents?.length ?? 0}
          delay={0}
        />
        <SummaryCard
          icon={Activity}
          label="Active"
          value={activeCount}
          variant="success"
          delay={0.05}
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Errors / Blockers"
          value={`${errorCount} / ${blockers?.length ?? 0}`}
          variant="destructive"
          delay={0.1}
        />
        <SummaryCard
          icon={Clock}
          label="Late Crons"
          value={lateJobs}
          variant={lateJobs > 0 ? "warning" : "default"}
          delay={0.15}
        />
      </div>

      {/* Agent Grid */}
      <div>
        <h2 className="text-lg font-mono font-semibold mb-4">Agent Fleet</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : agents?.length === 0 ? (
          <Card className="border-dashed border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground font-mono">
              No agents deployed yet. Run the schema SQL and add agents.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents?.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{agent.emoji}</span>
                        <CardTitle className="text-sm font-mono">
                          {agent.name}
                        </CardTitle>
                      </div>
                      <StatusBadge status={agent.computed_status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {agent.purpose || "No purpose defined"}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>
                        {agent.last_run_at
                          ? `Last: ${new Date(agent.last_run_at).toLocaleString()}`
                          : "No runs"}
                      </span>
                    </div>
                    {agent.last_summary && (
                      <p className="text-[11px] text-secondary-foreground mt-2 bg-secondary/50 rounded px-2 py-1 font-mono line-clamp-1">
                        {agent.last_summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
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
  value: string | number;
  variant?: "default" | "success" | "destructive" | "warning";
  delay?: number;
}) {
  const iconColors = {
    default: "text-muted-foreground",
    success: "text-primary",
    destructive: "text-destructive",
    warning: "text-warning",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${iconColors[variant]}`} />
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                {label}
              </p>
              <p className="text-xl font-mono font-bold mt-0.5">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default Index;
