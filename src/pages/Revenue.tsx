import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

const Revenue = () => {
  const { data: revenue, isLoading: rl } = useSupabaseQuery("revenue", "revenue_entries", {
    order: { column: "recorded_at", ascending: false },
  });
  const { data: costs, isLoading: cl } = useSupabaseQuery("costs", "cost_entries", {
    order: { column: "created_at", ascending: false },
  });

  const totalRevenue = revenue?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0;
  const totalCosts = costs?.reduce((s: number, c: any) => s + Number(c.amount), 0) ?? 0;
  const loading = rl || cl;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue & Costs</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial overview</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
          Coming Soon
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Automatic revenue and cost tracking via OpenClaw heartbeat is coming in a future update. Entries can be added manually in the meantime.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
                  <p className="text-xl font-semibold tabular-nums">${totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Costs</p>
                  <p className="text-xl font-semibold tabular-nums">${totalCosts.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className={`h-5 w-5 ${totalRevenue - totalCosts >= 0 ? "text-success" : "text-destructive"}`} />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Net</p>
                  <p className="text-xl font-semibold tabular-nums">${(totalRevenue - totalCosts).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Revenue Entries</h3>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenue?.map((r: any) => (
                    <TableRow key={r.id} className="border-border/50">
                      <TableCell className="text-sm">{r.source}</TableCell>
                      <TableCell className="text-sm tabular-nums text-foreground">${Number(r.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.recorded_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Cost Entries</h3>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs?.map((c: any) => (
                    <TableRow key={c.id} className="border-border/50">
                      <TableCell className="text-sm">{c.category || "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">${Number(c.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Revenue;
