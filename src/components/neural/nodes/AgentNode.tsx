import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { nameToHue, normalizeStatus, statusGlowColor, type NormalizedStatus } from "../utils";

export interface AgentNodeData {
  label: string;
  status: string;
  emoji: string;
  lastHeartbeat: string | null;
  lastSummary: string | null;
  [key: string]: unknown;
}

const ringAnimations: Record<NormalizedStatus, object> = {
  running: {
    rotate: 360,
    transition: { repeat: Infinity, duration: 3, ease: "linear" },
  },
  active: {
    opacity: [0.4, 0.85, 0.4],
    scale: [1, 1.08, 1],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
  },
  degraded: {
    opacity: [0.3, 0.7, 0.3],
    transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
  },
  error: {
    opacity: [1, 0.2, 1, 0.2, 1],
    transition: { repeat: Infinity, duration: 1.5, times: [0, 0.1, 0.2, 0.3, 1] },
  },
  paused: {},
  unknown: {
    opacity: [0.15, 0.3, 0.15],
    transition: { repeat: Infinity, duration: 4, ease: "easeInOut" },
  },
};

const statusChipColors: Record<NormalizedStatus, string> = {
  running: "bg-success/20 text-success border-success/30",
  active: "bg-success/20 text-success border-success/30",
  degraded: "bg-warning/20 text-warning border-warning/30",
  error: "bg-destructive/20 text-destructive border-destructive/30",
  paused: "bg-muted text-muted-foreground border-border",
  unknown: "bg-muted text-muted-foreground border-border",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function AgentNodeComponent({ data }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const nodeData = data as unknown as AgentNodeData;
  const { label, status, emoji, lastHeartbeat, lastSummary } = nodeData;
  const hue = nameToHue(label);
  const ns = normalizeStatus(status);
  const glowColor = statusGlowColor(ns);
  const orbSize = 56;

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />

      <motion.div
        animate={{ scale: hovered ? 1.15 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative"
        style={{ width: orbSize + 16, height: orbSize + 16 }}
      >
        {/* Outer glow field */}
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{
            background: glowColor,
            opacity: ns === "paused" ? 0.05 : 0.15,
          }}
        />

        {/* Animated status ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: ns === "running"
              ? `conic-gradient(from 0deg, transparent 0deg, ${glowColor} 90deg, transparent 180deg)`
              : "none",
            border: ns !== "running" ? `2px solid ${glowColor}` : "none",
            opacity: ns === "paused" ? 0.3 : 0.8,
          }}
          animate={ringAnimations[ns]}
        />

        {/* Inner gradient orb */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 8,
            background: `radial-gradient(circle at 35% 35%, hsl(${hue} 70% 65% / 0.5), hsl(${hue} 60% 30% / 0.7) 60%, hsl(${hue} 50% 15% / 0.9))`,
            boxShadow: `inset 0 0 12px hsl(${hue} 60% 40% / 0.3), 0 0 8px hsl(${hue} 60% 50% / 0.2)`,
          }}
        />

        {/* Emoji */}
        {emoji && (
          <span
            className="absolute inset-0 flex items-center justify-center select-none"
            style={{ fontSize: orbSize * 0.42 }}
          >
            {emoji}
          </span>
        )}
      </motion.div>

      {/* Name label */}
      <div className="mt-1 text-[10px] font-medium text-foreground/90 text-center max-w-[100px] leading-tight truncate">
        {label}
      </div>

      {/* Status chip */}
      <div className={`mt-0.5 text-[8px] font-mono tracking-wider px-1.5 py-0 rounded border ${statusChipColors[ns]}`}>
        {ns.toUpperCase()}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-6 z-50 px-3 py-2 rounded-lg border border-white/10 bg-black/90 backdrop-blur-md text-[10px] text-foreground/80 min-w-[160px] max-w-[220px] pointer-events-none"
        >
          {lastHeartbeat && (
            <p className="text-muted-foreground">
              Last heartbeat: <span className="text-foreground/70">{timeAgo(lastHeartbeat)}</span>
            </p>
          )}
          {lastSummary && (
            <p className="mt-1 text-foreground/60 line-clamp-3">{lastSummary}</p>
          )}
          {!lastHeartbeat && !lastSummary && (
            <p className="text-muted-foreground">No recent activity</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
