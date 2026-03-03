import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SystemsHealthBarProps {
  active: number;
  degraded: number;
  paused: number;
  total: number;
}

const segments = [
  { key: "active", label: "Healthy", color: "bg-success" },
  { key: "degraded", label: "Degraded", color: "bg-warning" },
  { key: "paused", label: "Paused", color: "bg-muted-foreground" },
] as const;

export function SystemsHealthBar({ active, degraded, paused, total }: SystemsHealthBarProps) {
  if (total === 0) return null;

  const counts: Record<string, number> = { active, degraded, paused };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap">
              Fleet Health
            </span>
            <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-muted/50">
              {segments.map(({ key, color }) => {
                const pct = (counts[key] / total) * 100;
                if (pct === 0) return null;
                return (
                  <motion.div
                    key={key}
                    className={color}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                );
              })}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          <div className="flex gap-3">
            <span className="text-success">{active} healthy</span>
            <span className="text-warning">{degraded} degraded</span>
            <span className="text-muted-foreground">{paused} paused</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
