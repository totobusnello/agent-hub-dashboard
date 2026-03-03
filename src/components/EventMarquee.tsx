import { useLatestActivity } from "@/hooks/useAgentActivity";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  output: "border-l-success",
  log: "border-l-blue-500",
  error: "border-l-destructive",
  status_change: "border-l-cyan-400",
  metric: "border-l-violet-400",
};

export function EventMarquee() {
  const { data: events } = useLatestActivity(20);
  const recent = events ?? [];

  if (recent.length === 0) return null;

  const pills = recent.map((e) => (
    <span
      key={e.id}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 border-l-2 whitespace-nowrap",
        typeColors[e.event_type] || "border-l-muted-foreground"
      )}
    >
      <span className="text-[10px]">{e.agent_emoji}</span>
      <span className="text-[10px] font-mono text-muted-foreground">{e.message}</span>
    </span>
  ));

  return (
    <div className="relative overflow-hidden rounded-md glass border-white/5 h-7 flex items-center group">
      <div
        className="inline-flex animate-marquee group-hover:[animation-play-state:paused]"
      >
        {/* Duplicate for seamless loop */}
        <div className="inline-flex">{pills}</div>
        <div className="inline-flex">{pills}</div>
      </div>
    </div>
  );
}
