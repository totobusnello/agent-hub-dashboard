import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain } from "lucide-react";

interface Memory {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  agent_id: string | null;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
}

const categoryColors: Record<string, string> = {
  decision: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  lesson: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  context: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  default: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<string, string> = {
  decision: "Decisão",
  lesson: "Aprendizado",
  context: "Contexto",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const MemoriaDecisoes = () => {
  const { data: memories, isLoading } = useSupabaseQuery<Memory>(
    "memories",
    "memories",
    { order: { column: "created_at", ascending: false } }
  );
  const { data: agents } = useSupabaseQuery<Agent>("agents-list", "agents");

  const agentMap = new Map(agents?.map((a) => [a.id, a]) ?? []);

  const grouped = (memories ?? []).reduce<Record<string, Memory[]>>((acc, m) => {
    const cat = m.category ?? "context";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Memória & Decisões</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Decisões técnicas, aprendizados e contexto acumulado pelo time
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : memories && memories.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {categoryLabels[category] ?? category}
                </h2>
                <Badge variant="secondary" className="text-[10px]">
                  {items.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((mem) => {
                  const agent = mem.agent_id ? agentMap.get(mem.agent_id) : null;
                  const colorClass = categoryColors[category] ?? categoryColors.default;
                  return (
                    <Card key={mem.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold leading-snug">{mem.title}</p>
                          <Badge className={`text-[10px] shrink-0 ${colorClass}`}>
                            {categoryLabels[category] ?? category}
                          </Badge>
                        </div>
                        {mem.content && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {mem.content}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          {agent ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{agent.emoji}</span>
                              <span className="text-[11px] text-muted-foreground">{agent.name}</span>
                            </div>
                          ) : (
                            <span />
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(mem.created_at)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border/30 rounded-lg p-12 text-center">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma memória registrada ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">
            As memórias e decisões do time aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
};

export default MemoriaDecisoes;
