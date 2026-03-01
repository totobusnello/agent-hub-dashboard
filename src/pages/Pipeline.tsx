import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const stages = ["lead", "contacted", "proposal", "negotiation", "closed_won", "closed_lost"] as const;
const stageLabels: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Won",
  closed_lost: "Lost",
};
const stageColors: Record<string, string> = {
  lead: "bg-muted-foreground",
  contacted: "bg-accent",
  proposal: "bg-accent",
  negotiation: "bg-warning",
  closed_won: "bg-primary",
  closed_lost: "bg-destructive",
};

const Pipeline = () => {
  const { data, isLoading } = useSupabaseQuery("pipeline", "pipeline_items", {
    order: { column: "created_at", ascending: false },
  });

  const totalValue = data
    ?.filter((p: any) => p.stage !== "closed_lost")
    .reduce((s: number, p: any) => s + Number(p.value || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Deal flow and revenue pipeline</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-mono">PIPELINE VALUE</p>
          <p className="text-xl font-mono font-bold text-primary">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stages.map((stage) => {
            const items = data?.filter((p: any) => p.stage === stage) ?? [];
            return (
              <div key={stage} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${stageColors[stage]}`} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {stageLabels[stage]}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <Card key={item.id} className="border-border/50">
                      <CardContent className="p-3">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        {item.value && (
                          <p className="text-[11px] font-mono text-primary mt-1">
                            ${Number(item.value).toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
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

export default Pipeline;
