import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const columns = ["backlog", "in_progress", "done", "blocked"] as const;
const columnLabels: Record<string, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};
const columnColors: Record<string, string> = {
  backlog: "bg-muted-foreground",
  in_progress: "bg-accent",
  done: "bg-primary",
  blocked: "bg-destructive",
};

const Goals = () => {
  const { data: goals, isLoading } = useSupabaseQuery("goals", "goals", {
    order: { column: "priority", ascending: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Goals</h1>
        <p className="text-muted-foreground text-sm mt-1">Strategic objectives kanban</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const items = goals?.filter((g: any) => g.status === col) ?? [];
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${columnColors[col]}`} />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {columnLabels[col]}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {items.map((goal: any) => (
                    <Card key={goal.id} className="border-border/50">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{goal.title}</p>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {goal.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <div className="border border-dashed border-border/30 rounded-lg p-4 text-center text-xs text-muted-foreground font-mono">
                      Empty
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

export default Goals;
