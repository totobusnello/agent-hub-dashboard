import { useNotionQuery } from "@/hooks/useNotionQuery";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  servico: string;
  status: string;
  statusClass: "ok" | "warning" | "error" | "unknown";
  detalhes: string | null;
  ultimoCheck: string | null;
  url: string;
}

interface CronsResponse {
  services: Service[];
  summary: { ok: number; warning: number; error: number; unknown: number };
  total: number;
  updatedAt: string;
}

const STATUS_ICON = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
  unknown: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
};

const STATUS_BG = {
  ok: "border-emerald-500/20 bg-emerald-500/5",
  warning: "border-yellow-500/20 bg-yellow-500/5",
  error: "border-red-500/20 bg-red-500/5",
  unknown: "border-border bg-muted/30",
};

const CronHealth = () => {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } =
    useNotionQuery<CronsResponse>("crons", "crons", 60_000);

  const services = data?.services ?? [];
  const summary = data?.summary ?? { ok: 0, warning: 0, error: 0, unknown: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cron Health</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Status dos serviços e automações · sincronizado com Notion
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

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Saudável", count: summary.ok, color: "text-emerald-400" },
            { label: "Atenção", count: summary.warning, color: "text-yellow-400" },
            { label: "Erro", count: summary.error, color: "text-red-400" },
            { label: "Desconhecido", count: summary.unknown, color: "text-muted-foreground" },
          ].map(({ label, count, color }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className={cn("text-2xl font-bold", color)}>{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 rounded-lg p-6 text-center text-sm text-destructive">
          Erro ao carregar serviços. Verifique a NOTION_API_KEY.
        </div>
      ) : (
        <div className="grid gap-2">
          {services.map((svc) => (
            <a key={svc.id} href={svc.url} target="_blank" rel="noopener noreferrer">
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:opacity-80",
                STATUS_BG[svc.statusClass]
              )}>
                {STATUS_ICON[svc.statusClass]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{svc.servico}</p>
                  {svc.detalhes && (
                    <p className="text-xs text-muted-foreground truncate">{svc.detalhes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">{svc.status}</p>
                  {svc.ultimoCheck && (
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(svc.ultimoCheck).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
          {services.length === 0 && (
            <div className="border border-dashed border-border/30 rounded-lg p-8 text-center text-sm text-muted-foreground">
              Nenhum serviço cadastrado no Notion
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CronHealth;
