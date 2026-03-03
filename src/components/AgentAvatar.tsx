import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  name: string;
  status: string;
  size?: number;
  emoji?: string;
}

// Deterministic hue from agent name
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 360) + 360) % 360;
}

type NormalizedStatus = "running" | "active" | "degraded" | "error" | "paused" | "unknown";

function normalizeStatus(status: string): NormalizedStatus {
  switch (status) {
    case "running": return "running";
    case "active": case "idle": return "active";
    case "degraded": case "stale": return "degraded";
    case "errored": return "error";
    case "paused": case "retired": return "paused";
    default: return "unknown";
  }
}

const ringAnimations: Record<NormalizedStatus, object> = {
  running: {
    rotate: 360,
    transition: { repeat: Infinity, duration: 3, ease: "linear" },
  },
  active: {
    opacity: [0.5, 0.9, 0.5],
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
  },
  degraded: {
    opacity: [0.4, 0.8, 0.4],
    transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
  },
  error: {
    opacity: [1, 0.3, 1, 0.3, 1],
    transition: { repeat: Infinity, duration: 1.5, times: [0, 0.1, 0.2, 0.3, 1] },
  },
  paused: {},
  unknown: {
    opacity: [0.2, 0.35, 0.2],
    transition: { repeat: Infinity, duration: 4, ease: "easeInOut" },
  },
};

const statusRingColor: Record<NormalizedStatus, string> = {
  running: "hsl(142 60% 50%)",
  active: "hsl(142 60% 50%)",
  degraded: "hsl(38 80% 55%)",
  error: "hsl(0 62% 55%)",
  paused: "hsl(0 0% 30%)",
  unknown: "hsl(0 0% 25%)",
};

const dotColor: Record<NormalizedStatus, string> = {
  running: "bg-success",
  active: "bg-success",
  degraded: "bg-warning",
  error: "bg-destructive",
  paused: "bg-muted-foreground/40",
  unknown: "bg-muted-foreground/20",
};

const dotAnimation: Record<NormalizedStatus, string> = {
  running: "animate-breathe-green",
  active: "animate-pulse-glow text-success",
  degraded: "animate-breathe-amber",
  error: "animate-flicker-red",
  paused: "",
  unknown: "",
};

export function AgentAvatar({ name, status, size = 34, emoji }: AgentAvatarProps) {
  const hue = nameToHue(name);
  const ns = normalizeStatus(status);
  const ringColor = statusRingColor[ns];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer animated ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: ns === "running"
            ? `conic-gradient(from 0deg, transparent 0deg, ${ringColor} 90deg, transparent 180deg)`
            : "none",
          border: ns !== "running" ? `1.5px solid ${ringColor}` : "none",
          opacity: ns === "paused" ? 0.3 : 0.7,
        }}
        animate={ringAnimations[ns]}
      />

      {/* Inner gradient orb */}
      <div
        className="absolute rounded-full"
        style={{
          inset: 3,
          background: `radial-gradient(circle at 35% 35%, hsl(${hue} 70% 65% / 0.4), hsl(${hue} 60% 30% / 0.6) 60%, hsl(${hue} 50% 15% / 0.8))`,
        }}
      />

      {/* Emoji centered */}
      {emoji && (
        <span
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{ fontSize: size * 0.45 }}
        >
          {emoji}
        </span>
      )}

      {/* Heartbeat dot — bottom-right */}
      <span
        className={cn(
          "absolute w-2 h-2 rounded-full border border-background",
          dotColor[ns],
          dotAnimation[ns]
        )}
        style={{ bottom: -1, right: -1 }}
      />
    </div>
  );
}
