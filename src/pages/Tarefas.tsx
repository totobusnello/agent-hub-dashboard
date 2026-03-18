import { useNotionQuery } from "@/hooks/useNotionQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const COLUMNS = ["todo", "in_progress", "done"] as const;
const COLUMN_LABELS: Record<string, string> = {
  todo: "Aberto",
  in_progress: "Em Andamento",
  done: "Concluído",
};
const COLUMN_COLORS: Record<string, string> = {
  todo: "bg-muted-foreground",
  in_progress: "bg-yellow-400",
  done: "bg-emerald-400",
};
const PRIORITY_COLORS: Record<string, string> = {
  "🔴 Alta": "destructive", "Alta": "destructive",
  "🟡 Média": "secondary", "Média": "secondary",
  "🔵 Baixa": "outline", "Baixa": "outline",
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

const AGENT_EMOJI: Record<string, string> = {
  Nox: "🌙", Atlas: "🗺️", Boris: "📰", Cipher: "🔐", Forge: "⚡", Lex: "⚖️", Toto: "👤", Time: "👥",
};

const Tarefas = () => {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } =
    useNotionQuery<TarefasResponse>("tarefas", "tarefas", 60_000);

  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas & Pendências</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sincronizado com Notion · {data?.total ?? 0} tarefas ativas
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 rounded-lg p-6 text-center text-sm text-destructive">
          Erro ao carregar tarefas. Verifique a NOTION_API_KEY.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col);
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", COLUMN_COLORS[col])} />
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {COLUMN_LABELS[col]}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {items.map((task) => (
                    <a key={task.id} href={task.url} target="_blank" rel="noopener noreferrer">
                      <Card className="border-border/50 hover:border-border transition-colors cursor-pointer">
                        <CardContent className="p-3 space-y-2">
                          <p className="text-sm font-medium leading-tight">{task.title}</p>
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            {task.rawPriority && (
                              <Badge
                                variant={(PRIORITY_COLORS[task.rawPriority] as any) || "outline"}
                                className="text-[10px] h-4 px-1.5"
                              >
                                {task.rawPriority}
                              </Badge>
                            )}
                            {task.para && (
                              <span className="text-[11px] text-muted-foreground">
                                {AGENT_EMOJI[task.para] || "👤"} {task.para}
                              </span>
                            )}
                          </div>
                          {task.prazo && (
                            <p className="text-[10px] text-muted-foreground">
                              📅 {new Date(task.prazo).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                  {items.length === 0 && (
                    <div className="border border-dashed border-border/30 rounded-lg p-6 text-center text-xs text-muted-foreground">
                      Vazio
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
