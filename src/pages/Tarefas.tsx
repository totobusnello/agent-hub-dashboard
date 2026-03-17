import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const columns = ["todo", "in_progress", "done", "blocked"] as const;
const columnLabels: Record<string, string> = {
  todo: "Aberto",
  in_progress: "Em Andamento",
  done: "Concluído",
  blocked: "Bloqueado",
};
const columnColors: Record<string, string> = {
  todo: "bg-muted-foreground",
  in_progress: "bg-foreground",
  done: "bg-success",
  blocked: "bg-destructive",
};

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  agent_id: string | null;
  due_date: string | null;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
}

const Tarefas = () => {
  const { data: todos, isLoading } = useSupabaseQuery<Todo>("todos", "todos", {
    order: { column: "priority", ascending: true },
  });
  const { data: agents } = useSupabaseQuery<Agent>("agents-list", "agents");

  const agentMap = new Map(agents?.map((a) => [a.id, a]) ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tarefas & Pendências</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Board de tarefas — acompanhe o que cada agente está endereçando
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const items = todos?.filter((t) => t.status === col) ?? [];
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", columnColors[col])} />
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                    {columnLabels[col]}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {items.map((todo) => {
                    const agent = todo.agent_id ? agentMap.get(todo.agent_id) : null;
                    return (
                      <Card key={todo.id} className="border-border/50">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium">{todo.title}</p>
                          {todo.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {todo.description}
                            </p>
                          )}
                          {agent && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="text-sm">{agent.emoji}</span>
                              <span className="text-[11px] text-muted-foreground">
                                {agent.name}
                              </span>
                            </div>
                          )}
                          {todo.due_date && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Prazo: {todo.due_date}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="border border-dashed border-border/30 rounded-lg p-4 text-center text-xs text-muted-foreground">
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
