import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const severityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-muted text-foreground",
  high: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const Blockers = () => {
  const { data, isLoading } = useSupabaseQuery("blockers", "blockers", {
    order: { column: "created_at", ascending: false },
  });
  const { data: agents } = useSupabaseQuery("agents-lookup", "agents", {
    select: "id,name,emoji",
  });

  const agentMap = new Map(agents?.map((a: any) => [a.id, a]) ?? []);

  const open = data?.filter((b: any) => b.status === "open") ?? [];
  const investigating = data?.filter((b: any) => b.status === "investigating") ?? [];
  const resolved = data?.filter((b: any) => b.status === "resolved") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blockers</h1>
        <p className="text-muted-foreground text-sm mt-1">Active impediments and resolved issues</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="space-y-6">
          <BlockerSection title="Open" items={open} dotColor="bg-destructive" agentMap={agentMap} />
          <BlockerSection title="Investigating" items={investigating} dotColor="bg-warning" agentMap={agentMap} />
          <BlockerSection title="Resolved" items={resolved} dotColor="bg-success" agentMap={agentMap} />
        </div>
      )}
    </div>
  );
};

function BlockerSection({ title, items, dotColor, agentMap }: { title: string; items: any[]; dotColor: string; agentMap: Map<string, any> }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-2 w-2 rounded-full", dotColor)} />
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>
        <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-4">None</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((b) => {
            const agent = b.agent_id ? agentMap.get(b.agent_id) : null;
            return (
              <Card key={b.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{b.title}</p>
                    <Badge variant="outline" className={cn("text-[10px] font-medium shrink-0", severityColors[b.severity])}>
                      {b.severity.toUpperCase()}
                    </Badge>
                  </div>
                  {b.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{b.description}</p>
                  )}
                  {agent && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {agent.emoji} {agent.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Blockers;
