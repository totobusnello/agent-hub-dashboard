import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Crosshair } from "lucide-react";
import { AgentNode, type AgentNodeData } from "./nodes/AgentNode";
import { CoreNode } from "./nodes/CoreNode";
import { EnergyEdge, type EnergyEdgeData } from "./edges/EnergyEdge";
import { buildEdgesFromRelationships, normalizeStatus, computeOverallHealth, type AgentRelationship } from "./utils";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  purpose: string;
  is_active: boolean;
  computed_status: string;
  last_heartbeat_at: string | null;
  last_summary: string | null;
}

interface NeuralMapProps {
  agents: Agent[];
  fillHeight?: boolean;
}

const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
  coreNode: CoreNode,
};

const edgeTypes: EdgeTypes = {
  energyEdge: EnergyEdge,
};

const CORE_ID = "__core__";

function buildFlowData(agents: Agent[], relationships: AgentRelationship[]) {
  const centerX = 0;
  const centerY = 0;
  const radius = 320;

  // Core node
  const coreNode: Node = {
    id: CORE_ID,
    type: "coreNode",
    position: { x: centerX - 50, y: centerY - 60 },
    data: {},
    draggable: true,
  };

  // Agent nodes in radial layout
  const agentNodes: Node[] = agents.map((agent, i) => {
    const angle = (2 * Math.PI * i) / agents.length - Math.PI / 2;
    return {
      id: agent.name,
      type: "agentNode",
      position: {
        x: centerX + Math.cos(angle) * radius - 36,
        y: centerY + Math.sin(angle) * radius - 40,
      },
      data: {
        label: agent.name,
        status: agent.computed_status,
        emoji: agent.emoji,
        lastHeartbeat: agent.last_heartbeat_at,
        lastSummary: agent.last_summary,
      } satisfies AgentNodeData,
      draggable: true,
    };
  });

  // Build edges from real agent_relationships table
  const agentIdToName = new Map(agents.map(a => [a.id, a.name]));
  const statusMap = new Map(agents.map(a => [a.name, a.computed_status]));
  const rawEdges = buildEdgesFromRelationships(relationships, agentIdToName);

  // Connect core to all agents that don't have an incoming edge from another agent
  const hasIncoming = new Set(rawEdges.map(e => e.target));
  const agentNames = agents.map(a => a.name);
  const rootAgents = agentNames.filter(n => !hasIncoming.has(n));

  const flowEdges: Edge[] = [];

  // Core -> root agents
  for (const rootAgent of rootAgents) {
    flowEdges.push({
      id: `${CORE_ID}->${rootAgent}`,
      source: CORE_ID,
      target: rootAgent,
      type: "energyEdge",
      data: {
        sourceStatus: "active",
        sourceName: "TrenchClaw Core",
      } satisfies EnergyEdgeData,
    });
  }

  // Agent relationship edges
  for (const edge of rawEdges) {
    flowEdges.push({
      id: `${edge.source}->${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: "energyEdge",
      data: {
        sourceStatus: statusMap.get(edge.source) ?? "unknown",
        sourceName: edge.source,
      } satisfies EnergyEdgeData,
    });
  }

  return {
    nodes: [coreNode, ...agentNodes],
    edges: flowEdges,
  };
}

// Legend item component
function LegendItem({ color, label, animation }: { color: string; label: string; animation?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${animation ?? ""}`}
        style={{ background: color }}
      />
      <span className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">{label}</span>
    </div>
  );
}

function NeuralMapInner({ agents, fillHeight }: NeuralMapProps) {
  const { fitView } = useReactFlow();
  const { data: relationships } = useSupabaseQuery<AgentRelationship>(
    "agent-relationships",
    "agent_relationships"
  );

  const { nodes, edges } = useMemo(
    () => buildFlowData(agents, relationships ?? []),
    [agents, relationships]
  );

  const overallHealth = useMemo(() => {
    const statuses = agents.map(a => normalizeStatus(a.computed_status));
    return computeOverallHealth(statuses);
  }, [agents]);

  const healthFieldColor = overallHealth === "error"
    ? "hsl(0 62% 45% / 0.08)"
    : overallHealth === "degraded"
    ? "hsl(38 80% 50% / 0.06)"
    : "hsl(142 60% 45% / 0.05)";

  const handleRecenter = useCallback(() => {
    fitView({ padding: 0.3, duration: 600 });
  }, [fitView]);

  return (
    <div className="neural-border-glow relative w-full rounded-lg overflow-hidden" style={{ height: fillHeight ? "100%" : "calc(100vh - 220px)", minHeight: fillHeight ? 0 : 500 }}>
      {/* System Health Field background */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${healthFieldColor}, transparent 70%)`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 40%, hsl(0 0% 2% / 0.6) 100%)",
        }}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="neural-map-canvas"
        defaultEdgeOptions={{ animated: false }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="hsl(0 0% 15%)" gap={32} size={1} />
      </ReactFlow>

      {/* Recenter button */}
      <button
        onClick={handleRecenter}
        className="absolute top-3 right-3 z-20 p-2 rounded-lg glass border border-white/10 hover:border-cyan-400/30 text-muted-foreground hover:text-cyan-400 transition-all"
        title="Recenter"
      >
        <Crosshair className="h-4 w-4" />
      </button>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 px-3 py-2 rounded-lg glass border border-white/5 flex gap-3">
        <LegendItem color="hsl(142 60% 50%)" label="Active" animation="animate-pulse-glow text-success" />
        <LegendItem color="hsl(142 60% 50%)" label="Running" />
        <LegendItem color="hsl(38 80% 55%)" label="Degraded" />
        <LegendItem color="hsl(0 62% 55%)" label="Error" />
        <LegendItem color="hsl(0 0% 30%)" label="Paused" />
      </div>

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 scanlines" />
    </div>
  );
}

export function NeuralMap({ agents, fillHeight }: NeuralMapProps) {
  return (
    <ReactFlowProvider>
      <NeuralMapInner agents={agents} fillHeight={fillHeight} />
    </ReactFlowProvider>
  );
}
