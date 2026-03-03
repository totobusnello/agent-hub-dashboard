import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { className: string; label: string; dotColor?: string; dotAnimation?: string }> = {
  active: { className: "bg-success/10 text-success border-success/20", label: "ACTIVE", dotColor: "bg-success", dotAnimation: "animate-breathe-green" },
  running: { className: "bg-success/10 text-success border-success/20", label: "RUNNING", dotColor: "bg-success", dotAnimation: "animate-breathe-green" },
  idle: { className: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "IDLE", dotColor: "bg-blue-500", dotAnimation: "animate-pulse-glow text-blue-500" },
  degraded: { className: "bg-warning/10 text-warning border-warning/20", label: "DEGRADED", dotColor: "bg-warning", dotAnimation: "animate-breathe-amber" },
  errored: { className: "bg-destructive/10 text-destructive border-destructive/20", label: "ERROR", dotColor: "bg-destructive", dotAnimation: "animate-flicker-red" },
  stale: { className: "bg-warning/10 text-warning border-warning/20", label: "STALE", dotColor: "bg-warning", dotAnimation: "animate-breathe-amber" },
  paused: { className: "bg-muted text-muted-foreground border-border", label: "PAUSED" },
  retired: { className: "bg-muted text-muted-foreground border-border", label: "RETIRED" },
  unknown: { className: "bg-muted text-muted-foreground border-border", label: "UNKNOWN" },
  on_time: { className: "bg-success/10 text-success border-success/20", label: "ON TIME", dotColor: "bg-success", dotAnimation: "animate-breathe-green" },
  late: { className: "bg-warning/10 text-warning border-warning/20", label: "LATE", dotColor: "bg-warning", dotAnimation: "animate-breathe-amber" },
  missed: { className: "bg-destructive/10 text-destructive border-destructive/20", label: "MISSED", dotColor: "bg-destructive", dotAnimation: "animate-flicker-red" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.unknown;
  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium tracking-wider gap-1.5", config.className)}>
      {config.dotColor && (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor, config.dotAnimation)} />
      )}
      {config.label}
    </Badge>
  );
}
