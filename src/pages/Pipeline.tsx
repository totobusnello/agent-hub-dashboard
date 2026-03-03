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
  contacted: "bg-foreground",
  proposal: "bg-foreground",
  negotiation: "bg-warning",
  closed_won: "bg-success",
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              Coming Soon
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Deal flow and revenue pipeline — agent-driven pipeline updates coming in a future release</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Pipeline Value</p>
          <p className="text-xl font-semibold tabular-nums">${totalValue.toLocaleString()}</p>
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
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {stageLabels[stage]}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <Card key={item.id} className="border-border/50">
                      <CardContent className="p-3">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        {item.value && (
                          <p className="text-[11px] tabular-nums text-muted-foreground mt-1">
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
