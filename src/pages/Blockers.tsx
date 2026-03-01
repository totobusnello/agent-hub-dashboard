import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const severityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent/20 text-accent border-accent/30",
  high: "bg-warning/20 text-warning border-warning/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

const Blockers = () => {
  const { data, isLoading } = useSupabaseQuery("blockers", "blockers", {
    order: { column: "created_at", ascending: false },
  });

  const open = data?.filter((b: any) => b.status === "open") ?? [];
  const investigating = data?.filter((b: any) => b.status === "investigating") ?? [];
  const resolved = data?.filter((b: any) => b.status === "resolved") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Blockers</h1>
        <p className="text-muted-foreground text-sm mt-1">Active impediments and resolved issues</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="space-y-6">
          <BlockerSection title="Open" items={open} dotColor="bg-destructive" />
          <BlockerSection title="Investigating" items={investigating} dotColor="bg-warning" />
          <BlockerSection title="Resolved" items={resolved} dotColor="bg-primary" />
        </div>
      )}
    </div>
  );
};

function BlockerSection({ title, items, dotColor }: { title: string; items: any[]; dotColor: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-2 w-2 rounded-full", dotColor)} />
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>
        <Badge variant="secondary" className="text-[10px] font-mono">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground font-mono pl-4">None</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((b) => (
            <Card key={b.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{b.title}</p>
                  <Badge variant="outline" className={cn("text-[10px] font-mono shrink-0", severityColors[b.severity])}>
                    {b.severity.toUpperCase()}
                  </Badge>
                </div>
                {b.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{b.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Blockers;
