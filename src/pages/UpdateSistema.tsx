import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  last_run_at: string | null;
  next_expected_at: string | null;
  enabled: boolean;
  agent_id: string | null;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: string;
  model: string | null;
  last_seen_at: string | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

const UpdateSistema = () => {
  const { data: crons, isLoading: cronsLoading } = useSupabaseQuery<CronJob>(
    "cron-jobs",
    "cron_jobs",
    { order: { column: "name", ascending: true } }
  );
  const { data: agents, isLoading: agentsLoading } = useSupabaseQuery<Agent>(
    "agents-status",
    "agents",
    { order: { column: "name", ascending: true } }
  );

  const isLoading = cronsLoading || agentsLoading;

  const activeCrons = crons?.filter((c) => c.enabled) ?? [];
  const onlineAgents = agents?.filter((a) => a.status === "online") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Update de Sistema</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estado atual da infra — agentes, crons e saúde geral do sistema
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Agentes Online</p>
                <p className="text-3xl font-mono font-bold mt-1 text-cyan-400">
                  {onlineAgents.length}/{agents?.length ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Crons Ativos</p>
                <p className="text-3xl font-mono font-bold mt-1 text-cyan-400">
                  {activeCrons.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Último Heartbeat</p>
                <p className="text-sm font-mono font-bold mt-1">
                  {timeAgo(agents?.[0]?.last_seen_at ?? null)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    onlineAgents.length > 0 ? "bg-green-400" : "bg-red-400"
                  )} />
                  <p className="text-sm font-mono font-bold">
                    {onlineAgents.length > 0 ? "ONLINE" : "OFFLINE"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agents status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-cyan-400" />
                Status dos Agentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agents?.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{agent.emoji}</span>
                      <div>
                        <p className="text-sm font-medium capitalize">{agent.name}</p>
                        {agent.model && (
                          <p className="text-[10px] text-muted-foreground">{agent.model}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] text-muted-foreground">{timeAgo(agent.last_seen_at)}</p>
                      <Badge
                        variant={agent.status === "online" ? "default" : "secondary"}
                        className={cn(
                          "text-[10px]",
                          agent.status === "online" && "bg-green-500/20 text-green-400 border-green-500/30"
                        )}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Crons list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                Cron Jobs ({activeCrons.length} ativos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {crons?.map((cron) => (
                  <div key={cron.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{cron.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{cron.schedule}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-[10px] text-muted-foreground">último: {timeAgo(cron.last_run_at)}</p>
                      </div>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        cron.enabled ? "bg-green-400" : "bg-muted-foreground"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default UpdateSistema;
