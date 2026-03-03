import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function cronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return cron;
  const [min, hour, dom, mon, dow] = parts;

  // Every N minutes in hour range: */30 7-23 * * *
  if (min.startsWith("*/") && hour.includes("-") && dom === "*" && mon === "*" && dow === "*") {
    const interval = min.slice(2);
    const [start, end] = hour.split("-").map(Number);
    return `Every ${interval}m, ${formatHour(start)}–${formatHour(end)}`;
  }

  // Specific hours: 0 7,11,15 * * *
  if (min === "0" && hour.includes(",") && dom === "*" && mon === "*" && dow === "*") {
    const hours = hour.split(",").map(Number);
    return `${hours.length}x daily (${hours.map(formatHour).join(", ")})`;
  }

  // Weekly: 0 9 * * 0
  if (min === "0" && !hour.includes(",") && dom === "*" && mon === "*" && dow !== "*") {
    const days = dow.split(",").map((d) => DAYS[Number(d)] ?? d);
    return `${days.join(", ")} at ${formatHour(Number(hour))}`;
  }

  // Daily at fixed time: 0 7 * * *
  if (min === "0" && !hour.includes(",") && !hour.includes("-") && dom === "*" && mon === "*" && dow === "*") {
    return `Daily at ${formatHour(Number(hour))}`;
  }

  return cron;
}

const CronHealth = () => {
  const { data, isLoading } = useSupabaseQuery("cron-health", "cron_health");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cron Health</h1>
        <p className="text-muted-foreground text-sm mt-1">Scheduled job lateness tracking</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs">Job</TableHead>
                <TableHead className="text-xs">Schedule</TableHead>
                <TableHead className="text-xs">Last Run</TableHead>
                <TableHead className="text-xs">Lateness</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No cron jobs configured
                  </TableCell>
                </TableRow>
              )}
              {data?.map((job: any) => (
                <TableRow key={job.id} className="border-border/50">
                  <TableCell className="text-sm font-medium">{job.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground" title={job.schedule}>
                    {cronToHuman(job.schedule)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {job.lateness_seconds > 0
                      ? `${Math.round(job.lateness_seconds / 60)}m`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.health_status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CronHealth;
