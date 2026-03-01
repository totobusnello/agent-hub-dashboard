import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const CronHealth = () => {
  const { data, isLoading } = useSupabaseQuery("cron-health", "cron_health");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Cron Health</h1>
        <p className="text-muted-foreground text-sm mt-1">Scheduled job lateness tracking</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-mono text-xs">Job</TableHead>
                <TableHead className="font-mono text-xs">Schedule</TableHead>
                <TableHead className="font-mono text-xs">Last Run</TableHead>
                <TableHead className="font-mono text-xs">Lateness</TableHead>
                <TableHead className="font-mono text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground font-mono py-8">
                    No cron jobs configured
                  </TableCell>
                </TableRow>
              )}
              {data?.map((job: any) => (
                <TableRow key={job.id} className="border-border/50">
                  <TableCell className="font-mono text-sm">{job.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{job.schedule}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
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
