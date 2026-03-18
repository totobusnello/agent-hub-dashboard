import { useNotionQuery } from "@/hooks/useNotionQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MemoryEntry {
  id: string;
  titulo: string;
  categoria: string | null;
  conteudo: string | null;
  fonte: string | null;
  data: string | null;
  url: string;
  updatedAt: string;
}

interface MemoriaResponse {
  entries: MemoryEntry[];
  total: number;
  updatedAt: string;
}

const CATEGORIA_COLORS: Record<string, string> = {
  "Decisão": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Lição": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Insight": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Aprendizado": "bg-green-500/10 text-green-400 border-green-500/20",
  "Sistema Openclaw": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Pendência": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Correção": "bg-red-500/10 text-red-400 border-red-500/20",
  "Registro": "bg-muted text-muted-foreground border-border",
  "Contexto": "bg-muted text-muted-foreground border-border",
};

const ALL_CATS = ["Todos", "Decisão", "Lição", "Insight", "Aprendizado", "Sistema Openclaw", "Pendência", "Correção", "Registro", "Contexto"];

const MemoriaDecisoes = () => {
  const [filter, setFilter] = useState("Todos");
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } =
    useNotionQuery<MemoriaResponse>("memoria", "memoria", 120_000);

  const entries = (data?.entries ?? []).filter(
    (e) => filter === "Todos" || e.categoria === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Memória & Decisões</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Decisões, lições e contexto do time · {data?.total ?? 0} entradas
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {ALL_CATS.filter(cat => cat === "Todos" || (data?.entries ?? []).some(e => e.categoria === cat)).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-3 py-1 rounded-full text-xs border transition-colors",
              filter === cat
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 rounded-lg p-6 text-center text-sm text-destructive">
          Erro ao carregar memória. Verifique a NOTION_API_KEY.
        </div>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => (
            <a key={entry.id} href={entry.url} target="_blank" rel="noopener noreferrer">
              <Card className="border-border/50 hover:border-border transition-colors cursor-pointer">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-tight">{entry.titulo}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.categoria && (
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                          CATEGORIA_COLORS[entry.categoria] || CATEGORIA_COLORS["Registro"]
                        )}>
                          {entry.categoria}
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.conteudo && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{entry.conteudo}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {entry.fonte && <span>📌 {entry.fonte}</span>}
                    {entry.data && <span>📅 {new Date(entry.data).toLocaleDateString("pt-BR")}</span>}
                    {!entry.data && (
                      <span>🕐 {new Date(entry.updatedAt).toLocaleDateString("pt-BR")}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
          {entries.length === 0 && (
            <div className="border border-dashed border-border/30 rounded-lg p-8 text-center text-sm text-muted-foreground">
              Nenhuma entrada encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoriaDecisoes;
