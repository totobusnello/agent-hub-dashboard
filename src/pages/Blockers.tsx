import { useNotionQuery } from "@/hooks/useNotionQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertTriangle, Clock, PauseCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockerTask {
  id: string;
  title: string;
  status: string;
  priority: number;
  rawPriority: string | null;
  para: string | null;
  de: string | null;
  projeto: string | null;
  prazo: string | null;
  url: string;
  updatedAt: string;
}

interface BlockersResponse {
  tasks: BlockerTask[];
  total: number;
  updatedAt: string;
}

const AGENT_EMOJI: Record<string, string> = {
  Nox: "🌙", Atlas: "🗺️", Boris: "📰", Cipher: "🔐", Forge: "⚡", Lex: "⚖️", Toto: "👤", Time: "👥",
};

const PRIORITY_STYLE: Record<string, string> = {
  "🔴 Alta": "border-red-500/30 bg-red-500/5",
  "Alta": "border-red-500/30 bg-red-500/5",
  "🟡 Média": "border-yellow-500/30 bg-yellow-500/5",
  "Média": "border-yellow-500/30 bg-yellow-500/5",
  "🔵 Baixa": "border-border/50 bg-transparent",
  "Baixa": "border-border/50 bg-transparent",
};

const PRIORITY_BADGE: Record<string, string> = {
  "🔴 Alta": "bg-red-500/10 text-red-400 border-red-500/20",
  "Alta": "bg-red-500/10 text-red-400 border-red-500/20",
  "🟡 Média": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Média": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "🔵 Baixa": "bg-muted text-muted-foreground border-border",
  "Baixa": "bg-muted text-muted-foreground border-border",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "Aguardando Toto":  { label: "Aguardando você", icon: <AlertTriangle className="h-4 w-4 text-orange-400" />, color: "text-orange-400" },
  "Aguardando input": { label: "Aguardando input", icon: <Clock className="h-4 w-4 text-yellow-400" />, color: "text-yellow-400" },
  "Pausado":          { label: "Pausado", icon: <PauseCircle className="h-4 w-4 text-muted-foreground" />, color: "text-muted-foreground" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

const SECTIONS = ["Aguardando Toto", "Aguardando input", "Pausado"] as const;

const Blockers = () => {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } =
    useNotionQuery<BlockersResponse>("blockers", "blockers", 60_000);

  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blockers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tarefas travadas aguardando input · {data?.total ?? 0} pendências
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

      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 rounded-lg p-6 text-center text-sm text-destructive">
          Erro ao carregar blockers. Verifique a NOTION_API_KEY.
        </div>
      ) : tasks.length === 0 ? (
        <div className="border border-dashed border-border/30 rounded-xl p-12 text-center space-y-2">
          <p className="text-4xl">✅</p>
          <p className="text-sm font-medium">Sem blockers</p>
          <p className="text-xs text-muted-foreground">Nenhuma tarefa aguardando input no momento</p>
        </div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const items = tasks.filter(t => t.status === section);
            if (items.length === 0) return null;
            const config = STATUS_CONFIG[section];
            return (
              <div key={section}>
                <div className="flex items-center gap-2 mb-3">
                  {config.icon}
                  <h3 className={cn("text-sm font-medium", config.color)}>{config.label}</h3>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{items.length}</Badge>
                </div>
                <div className="grid gap-2">
                  {items.map((task) => (
                    <a key={task.id} href={task.url} target="_blank" rel="noopener noreferrer">
                      <Card className={cn(
                        "border transition-all hover:shadow-sm group",
                        task.rawPriority ? PRIORITY_STYLE[task.rawPriority] : "border-border/50"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium leading-tight">{task.title}</p>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                          </div>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {task.rawPriority && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                                PRIORITY_BADGE[task.rawPriority] || "bg-muted text-muted-foreground border-border"
                              )}>
                                {task.rawPriority}
                              </span>
                            )}
                            {task.para && (
                              <span className="text-[11px] text-muted-foreground">
                                {AGENT_EMOJI[task.para] || "👤"} {task.para}
                              </span>
                            )}
                            {task.prazo && (
                              <span className="text-[10px] text-muted-foreground">
                                📅 {new Date(task.prazo).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {timeAgo(task.updatedAt)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Blockers;
