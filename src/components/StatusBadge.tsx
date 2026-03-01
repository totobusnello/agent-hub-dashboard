import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { className: string; label: string }> = {
  active: { className: "bg-primary/20 text-primary border-primary/30", label: "ACTIVE" },
  errored: { className: "bg-destructive/20 text-destructive border-destructive/30", label: "ERROR" },
  stale: { className: "bg-warning/20 text-warning border-warning/30", label: "STALE" },
  unknown: { className: "bg-muted text-muted-foreground border-border", label: "UNKNOWN" },
  paused: { className: "bg-accent/20 text-accent border-accent/30", label: "PAUSED" },
  on_time: { className: "bg-primary/20 text-primary border-primary/30", label: "ON TIME" },
  late: { className: "bg-warning/20 text-warning border-warning/30", label: "LATE" },
  missed: { className: "bg-destructive/20 text-destructive border-destructive/30", label: "MISSED" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.unknown;
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] tracking-wider", config.className)}>
      {config.label}
    </Badge>
  );
}
