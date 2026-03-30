import { useNotionQuery } from "@/hooks/useNotionQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RefreshCw, ExternalLink } from "lucide-react";

// Espelha exatamente os status do Notion
const COLUMNS = [
  "Pendente",
  "A fazer",
  "Aguardando input",
  "Pausado",
  "Concluída",
  "Concluído",
] as const;

const COLUMN_CONFIG: Record<string, { label: string; color: string; dot: string; group: string }> = {
  "Pendente":         { label: "Pendente",         color: "bg-slate-100 dark:bg-slate-800",         dot: "bg-slate-400",    group: "open"  },
  "A fazer":          { label: "A Fazer",           color: "bg-blue-50 dark:bg-blue-950",            dot: "bg-blue-400",     group: "open"  },
  "Aguardando input": { label: "Aguardando Input",  color: "bg-yellow-50 dark:bg-yellow-950",        dot: "bg-yellow-400",   group: "wait"  },
  "Pausado":          { label: "Pausado",           color: "bg-orange-50 dark:bg-orange-950",        dot: "bg-orange-400",   group: "wait"  },
  "Concluída":        { label: "Concluída",         color: "bg-emerald-50 dark:bg-emerald-950",      dot: "bg-emerald-400",  group: "done"  },
  "Concluído":        { label: "Concluído",         color: "bg-emerald-50 dark:bg-emerald-950",      dot: "bg-emerald-500",  group: "done"  },
};

const PRIORITY_CONFIG: Record<string, { variant: "destructive" | "secondary" | "outline"; label: string }> = {
  "🔴 Alta": { variant: "destructive", label: "🔴 Alta" },
  "Alta":    { variant: "destructive", label: "Alta" },
  "🟡 Média":{ variant: "secondary",   label: "🟡 Média" },
  "Média":   { variant: "secondary",   label: "Média" },
  "🔵 Baixa":{ variant: "outline",     label: "🔵 Baixa" },
  "Baixa":   { variant: "outline",     label: "Baixa" },
};

const AGENT_EMOJI: Record<string, string> = {
  Nox: "🌙", Atlas: "🗺️", Boris: "📰", Cipher: "🔐",
  Forge: "⚡", Lex: "⚖️", Toto: "👤", Time: "👥",
};

interface Task {
  id: string;
  title: string;
  status: string;
  rawStatus: string;
  priority: number;
  rawPriority: string;
  para: string | null;
  de: string | null;
  projeto: string | null;
  prazo: string | null;
  url: string;
  updatedAt: string;
}

interface TarefasResponse {
  tasks: Task[];
  total: number;
  updatedAt: string;
}

function isOverdue(prazo: string | null): boolean {
  if (!prazo) return false;
  return new Date(prazo) < new Date();
}

const Tarefas = () => {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } =
    useNotionQuery<TarefasResponse>("tarefas", "tarefas", 60_000);

  const tasks = data?.tasks ?? [];

  // Agrupar por status exato do Notion
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => t.rawStatus === col);
    return acc;
  }, {} as Record<string, Task[]>);

  // Status visíveis (só mostrar colunas com itens ou que são "abertas")
  const visibleColumns = COLUMNS.filter(
    (col) => tasksByStatus[col].length > 0 || ["Pendente", "A fazer", "Aguardando input"].includes(col)
  );

  const totalOpen = tasks.filter(t => COLUMN_CONFIG[t.rawStatus]?.group !== "done").length;
  const totalDone = tasks.filter(t => COLUMN_CONFIG[t.rawStatus]?.group === "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas & Pendências</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Espelhado do Notion · {data?.total ?? 0} tarefas · {totalOpen} abertas · {totalDone} concluídas
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 rounded-lg p-6 text-center text-sm text-destructive">
          Erro ao carregar tarefas. Verifique a NOTION_API_KEY.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 items-start">
          {visibleColumns.map((col) => {
            const cfg = COLUMN_CONFIG[col];
            const items = tasksByStatus[col];
            return (
              <div key={col} className="space-y-2 min-w-0">
                {/* Coluna header */}
                <div className="flex items-center gap-2 px-1">
                  <div className={cn("h-2 w-2 rounded-full flex-shrink-0", cfg.dot)} />
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium truncate">
                    {cfg.label}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto flex-shrink-0">
                    {items.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className={cn("rounded-lg p-2 space-y-2 min-h-[80px]", cfg.color)}>
                  {items.map((task) => (
                    <a
                      key={task.id}
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <Card className="border-border/40 hover:border-border hover:shadow-sm transition-all cursor-pointer">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-medium leading-snug flex-1">{task.title}</p>
                            <ExternalLink className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground flex-shrink-0 mt-0.5 transition-colors" />
                          </div>

                          <div className="flex items-center flex-wrap gap-1">
                            {task.rawPriority && (
                              <Badge
                                variant={PRIORITY_CONFIG[task.rawPriority]?.variant ?? "outline"}
                                className="text-[9px] h-4 px-1.5"
                              >
                                {task.rawPriority}
                              </Badge>
                            )}
                            {task.para && (
                              <span className="text-[10px] text-muted-foreground">
                                {AGENT_EMOJI[task.para] || "👤"} {task.para}
                              </span>
                            )}
                          </div>

                          {task.prazo && (
                            <p className={cn(
                              "text-[10px]",
                              isOverdue(task.prazo) && cfg.group !== "done"
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            )}>
                              📅 {new Date(task.prazo).toLocaleDateString("pt-BR")}
                              {isOverdue(task.prazo) && cfg.group !== "done" && " ⚠️"}
                            </p>
                          )}

                          {task.projeto && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              📁 {task.projeto}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </a>
                  ))}

                  {items.length === 0 && (
                    <div className="py-6 text-center text-[11px] text-muted-foreground/50">
                      —
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tarefas;
