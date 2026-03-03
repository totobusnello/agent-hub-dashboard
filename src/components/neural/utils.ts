/** Neural Map utilities: hashing, normalization, edge mapping */

export type NormalizedStatus = "running" | "active" | "degraded" | "error" | "paused" | "unknown";

export function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 360) + 360) % 360;
}

export function normalizeStatus(status: string): NormalizedStatus {
  switch (status) {
    case "running": return "running";
    case "active": case "idle": return "active";
    case "degraded": case "stale": return "degraded";
    case "errored": return "error";
    case "paused": case "retired": return "paused";
    default: return "unknown";
  }
}

export interface AgentRelationship {
  source_agent_id: string;
  target_agent_id: string;
  relationship_type: string;
}

export function buildEdgesFromRelationships(
  relationships: AgentRelationship[],
  agentIdToName: Map<string, string>
): { source: string; target: string }[] {
  const edges: { source: string; target: string }[] = [];
  for (const rel of relationships) {
    const srcName = agentIdToName.get(rel.source_agent_id);
    const tgtName = agentIdToName.get(rel.target_agent_id);
    if (srcName && tgtName) {
      edges.push({ source: srcName, target: tgtName });
    }
  }
  return edges;
}

export function statusGlowColor(status: NormalizedStatus): string {
  switch (status) {
    case "running": return "hsl(142 60% 50%)";
    case "active": return "hsl(142 60% 50%)";
    case "degraded": return "hsl(38 80% 55%)";
    case "error": return "hsl(0 62% 55%)";
    case "paused": return "hsl(0 0% 30%)";
    case "unknown": return "hsl(0 0% 25%)";
  }
}

export function computeOverallHealth(statuses: NormalizedStatus[]): "healthy" | "degraded" | "error" {
  if (statuses.some(s => s === "error")) return "error";
  if (statuses.some(s => s === "degraded")) return "degraded";
  return "healthy";
}
