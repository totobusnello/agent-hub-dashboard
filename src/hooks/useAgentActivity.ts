import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityEvent {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_emoji: string;
  event_type: "output" | "log" | "error" | "status_change" | "metric";
  message: string;
  timestamp: Date;
}

interface RawActivity {
  id: string;
  agent_id: string;
  event_type: string;
  payload: { message?: string; [key: string]: any };
  created_at: string;
  agents: { name: string; emoji: string } | null;
}

function toActivityEvent(row: RawActivity): ActivityEvent {
  return {
    id: row.id,
    agent_id: row.agent_id,
    agent_name: row.agents?.name ?? "Unknown",
    agent_emoji: row.agents?.emoji ?? "🤖",
    event_type: row.event_type as ActivityEvent["event_type"],
    message: row.payload?.message ?? "",
    timestamp: new Date(row.created_at),
  };
}

/** Fetch recent activity across all agents */
export function useLatestActivity(limit = 50) {
  return useQuery({
    queryKey: ["agent-activity-latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_activity")
        .select("id, agent_id, event_type, payload, created_at, agents(name, emoji)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as RawActivity[]).map(toActivityEvent).reverse();
    },
    refetchInterval: 10_000,
  });
}

/** Fetch recent activity for a specific agent */
export function useAgentActivity(agentId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ["agent-activity", agentId, limit],
    queryFn: async () => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from("agent_activity")
        .select("id, agent_id, event_type, payload, created_at, agents(name, emoji)")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as RawActivity[]).map(toActivityEvent).reverse();
    },
    enabled: !!agentId,
    refetchInterval: 10_000,
  });
}

/** Fetch activity counts bucketed by hour for sparklines */
export function useActivitySparkline(agentId: string | undefined, hours = 12) {
  return useQuery({
    queryKey: ["agent-activity-sparkline", agentId, hours],
    queryFn: async () => {
      if (!agentId) return [];
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("agent_activity")
        .select("created_at")
        .eq("agent_id", agentId)
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Bucket into `hours` time slots
      const now = Date.now();
      const bucketSize = (hours * 60 * 60 * 1000) / hours;
      const buckets = Array(hours).fill(0);
      for (const row of data ?? []) {
        const age = now - new Date(row.created_at).getTime();
        const idx = Math.min(hours - 1, Math.floor((hours * 60 * 60 * 1000 - age) / bucketSize));
        if (idx >= 0 && idx < hours) buckets[idx]++;
      }
      return buckets.map((v) => ({ v }));
    },
    enabled: !!agentId,
    refetchInterval: 60_000,
  });
}
