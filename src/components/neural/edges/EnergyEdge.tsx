import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { nameToHue, normalizeStatus, type NormalizedStatus } from "../utils";

export interface EnergyEdgeData {
  sourceStatus: string;
  sourceName: string;
  [key: string]: unknown;
}

function getEdgeColor(ns: NormalizedStatus, hue: number): string {
  switch (ns) {
    case "error": return "hsl(0 62% 55%)";
    case "degraded": return "hsl(38 80% 55%)";
    default: return `hsl(${hue} 60% 55%)`;
  }
}

function getAnimationDuration(ns: NormalizedStatus): number {
  switch (ns) {
    case "running": return 1;
    case "active": return 2;
    case "error": return 0.6;
    default: return 3;
  }
}

function EnergyEdgeComponent(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, id } = props;
  const edgeData = (props.data ?? {}) as EnergyEdgeData;
  const sourceName = edgeData.sourceName ?? "";
  const sourceStatus = edgeData.sourceStatus ?? "unknown";

  const hue = nameToHue(sourceName);
  const ns = normalizeStatus(sourceStatus);
  const color = getEdgeColor(ns, hue);
  const duration = getAnimationDuration(ns);
  const opacity = ns === "paused" ? 0.15 : ns === "unknown" ? 0.2 : 0.6;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const gradientId = `energy-gradient-${id}`;
  const flowId = `energy-flow-${id}`;

  return (
    <>
      <defs>
        {/* Gradient along the edge */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={opacity * 0.4} />
          <stop offset="50%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.4} />
        </linearGradient>
      </defs>

      {/* Base edge — dim underline */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 1,
          opacity: opacity * 0.3,
        }}
      />

      {/* Animated energy flow — moving dash */}
      <path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeDasharray="8 12"
        strokeLinecap="round"
        className="neural-energy-flow"
        style={{
          animation: `neural-dash-flow ${duration}s linear infinite`,
        }}
      />

      {/* Glow layer */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={opacity * 0.1}
        filter="blur(3px)"
      />

      {/* Error shockwave on mount */}
      {ns === "error" && (
        <path
          id={flowId}
          d={edgePath}
          fill="none"
          stroke="hsl(0 62% 65%)"
          strokeWidth={3}
          strokeLinecap="round"
          className="neural-shockwave"
          style={{
            animation: "neural-shockwave 2s ease-out infinite",
          }}
        />
      )}
    </>
  );
}

export const EnergyEdge = memo(EnergyEdgeComponent);
