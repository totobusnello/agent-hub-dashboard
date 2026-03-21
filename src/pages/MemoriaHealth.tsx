import { useNotionQuery } from "@/hooks/useNotionQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentMemory {
  name: string;
  lastCommit: string | null;
  notionSynced: boolean;
  memoryStatus: "ok" | "stale" | "missing";
}

interface SystemState {
  lastUpdate: string;
  noxMemVersion: string;
  totalChunks: number;
}

interface SyncVerify {
  lastRun: string;
  issues: number;
}

interface MemoryHealthResponse {
  agents: AgentMemory[];
  systemState: SystemState;
  syncVerify: SyncVerify;
  timestamp: number;
}

const AGENT_EMOJI: Record<string, string> = {
  forge: "⚡",
  nox: "🌑",
  atlas: "🗺️",
  boris: "📡",
  cipher: "🔐",
  lex: "⚖️",
};

const STATUS_CONFIG = {
  ok: { badge: "🟢", label: "OK", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  stale: { badge: "🟡", label: "Stale", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  missing: { badge: "🔴", label: "Sem dados", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function AgentCard({ agent }: { agent: AgentMemory }) {
  const status = STATUS_CONFIG[agent.memoryStatus] ?? STATUS_CONFIG.missing;
  const emoji = AGENT_EMOJI[agent.name] ?? "🤖";

  return (
    <Card className="border border-border/40 hover:border-border/70 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>
            {emoji} {agent.name.charAt(0).toUpperCase() + agent.name.slice(1)}
          </span>
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded border font-semibold",
              status.color
            )}
          >
            {status.badge} {status.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Último commit</span>
          <span className="text-foreground font-mono">{agent.lastCommit ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Notion sincronizado</span>
          <span className={agent.notionSynced ? "text-emerald-400" : "text-red-400"}>
            {agent.notionSynced ? "✓ sim" : "✗ não"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

const MemoriaHealth = () => {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } =
    useNotionQuery<MemoryHealthResponse>("memory-health", "memory-health", 300_000);

  const agents = data?.agents ?? [];
  const systemState = data?.systemState;
  const syncVerify = data?.syncVerify;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">🧠 Memória &amp; Saúde</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Estado da memória de cada agente — commits, sync e status
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR") : "—"}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="border border-destructive/30 rounded-lg p-6 text-center text-sm text-destructive">
          Erro ao carregar dados de memória. Verifique GITHUB_TOKEN e NOTION_API_KEY.
        </div>
      )}

      {/* Agent Grid */}
      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.name} agent={agent} />
            ))}
          </div>

          {/* System State Card */}
          {systemState && (
            <Card className="border border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">📦 Estado do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Versão nox-mem</span>
                  <span className="font-mono font-semibold text-cyan-400">
                    v{systemState.noxMemVersion}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Total de chunks</span>
                  <span className="font-mono font-semibold">{systemState.totalChunks.toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Última atualização</span>
                  <span className="font-mono font-semibold">{systemState.lastUpdate}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sync Verify Card */}
          {syncVerify && (
            <Card className="border border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">🔄 Verificação de Sync</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Última execução</span>
                  <span className="font-mono font-semibold">{syncVerify.lastRun}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Problemas encontrados</span>
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      syncVerify.issues === 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {syncVerify.issues === 0 ? "✓ nenhum" : `⚠ ${syncVerify.issues}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MemoriaHealth;
