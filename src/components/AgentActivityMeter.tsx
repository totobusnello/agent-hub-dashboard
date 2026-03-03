import { useMemo } from "react";
import { useAgentActivity } from "@/hooks/useAgentActivity";

interface AgentActivityMeterProps {
  agentId: string;
}

export function AgentActivityMeter({ agentId }: AgentActivityMeterProps) {
  const { data: events } = useAgentActivity(agentId, 50);

  const bars = useMemo(() => {
    if (!events || events.length === 0) return Array(8).fill(0.15);
    const now = Date.now();
    // Split last 12 hours into 8 buckets of 1.5h each
    const windowMs = 12 * 60 * 60 * 1000;
    const bucketMs = windowMs / 8;
    const buckets = Array(8).fill(0);
    events.forEach((e) => {
      const age = now - e.timestamp.getTime();
      if (age < windowMs) {
        const bucket = Math.min(7, Math.floor((windowMs - age) / bucketMs));
        buckets[bucket]++;
      }
    });
    // Normalize to 0-1 range
    const max = Math.max(1, ...buckets);
    return buckets.map((v) => Math.max(0.15, v / max));
  }, [events]);

  return (
    <div className="flex items-end gap-[2px] h-3">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm bg-cyan-500/60 transition-all duration-500"
          style={{ height: `${height * 100}%` }}
        />
      ))}
    </div>
  );
}
