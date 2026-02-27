// supabase/functions/ingest/index.ts
// Handles /ingest/* routes — authenticated via per-agent API key (X-Agent-Key header)
// Agents can only INSERT into agent_runs and agent_activity for their own agent_id.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-agent-key",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function validateAgentKey(
  supabase: ReturnType<typeof createClient>,
  rawKey: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("validate_agent_key", {
    raw_key: rawKey,
  });
  if (error || !data) return null;
  return data as string; // agent_id uuid
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // --- Auth: validate X-Agent-Key ---
  const agentKey = req.headers.get("x-agent-key");
  if (!agentKey) {
    return json({ error: "Missing X-Agent-Key header" }, 401);
  }
  const agentId = await validateAgentKey(supabase, agentKey);
  if (!agentId) {
    return json({ error: "Invalid or revoked API key" }, 403);
  }

  // --- Routing ---
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/ingest\/?/, "").replace(/\/$/, "");

  try {
    // POST /ingest/runs — start a new run
    if (req.method === "POST" && path === "runs") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("agent_runs")
        .insert({
          agent_id: agentId,
          trigger_type: body.trigger_type || "manual",
        })
        .select("id, started_at")
        .single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    // PUT /ingest/runs/:id — complete a run
    if (req.method === "PUT" && path.startsWith("runs/")) {
      const runId = path.split("/")[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from("agent_runs")
        .update({
          finished_at: new Date().toISOString(),
          outcome: body.outcome,
          summary: body.summary,
          error_message: body.error_message,
        })
        .eq("id", runId)
        .eq("agent_id", agentId) // agents can only update their own runs
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    // POST /ingest/activity — append activity entry
    if (req.method === "POST" && path === "activity") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("agent_activity")
        .insert({
          agent_id: agentId,
          run_id: body.run_id,
          event_type: body.event_type || "log",
          payload: body.payload || {},
        })
        .select("id, created_at")
        .single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    // POST /ingest/blockers — agent reports a blocker
    if (req.method === "POST" && path === "blockers") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("blockers")
        .insert({
          agent_id: agentId,
          title: body.title,
          description: body.description,
          severity: body.severity || "medium",
        })
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
