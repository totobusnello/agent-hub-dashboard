// supabase/functions/ingest/index.ts
// Handles /ingest/* routes — authenticated via per-agent API key (X-Agent-Key header)
// Agents can only INSERT into agent_runs and agent_activity for their own agent_id.
// Also supports heartbeat sync for bulk state updates from OpenClaw.

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
  return data as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/ingest\/?/, "").replace(/\/$/, "");

  // --- Heartbeat endpoint: uses service-role key via Authorization header ---
  // This is called by OpenClaw's heartbeat process to bulk-sync state
  if (req.method === "POST" && path === "heartbeat") {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing Authorization header" }, 401);
    }
    // Validate it's the service role key or anon key with valid JWT
    const body = await req.json();
    const results: Record<string, any> = {};

    // Sync agents: upsert agent records
    if (body.agents && Array.isArray(body.agents)) {
      for (const agent of body.agents) {
        const { data, error } = await supabase
          .from("agents")
          .upsert(
            {
              name: agent.name,
              emoji: agent.emoji || "🤖",
              purpose: agent.purpose,
              slack_channel: agent.slack_channel,
              model: agent.model,
              expected_cadence_minutes: agent.expected_cadence_minutes,
              status_override: agent.status_override || null,
            },
            { onConflict: "name", ignoreDuplicates: false }
          )
          .select("id, name")
          .single();
        if (!error && data) {
          results[agent.name] = data.id;
        }
      }
    }

    // Sync cron jobs
    if (body.cron_jobs && Array.isArray(body.cron_jobs)) {
      for (const cron of body.cron_jobs) {
        const agentId = cron.agent_name ? results[cron.agent_name] || null : cron.agent_id;
        await supabase.from("cron_jobs").upsert(
          {
            name: cron.name,
            schedule: cron.schedule,
            expected_cadence_minutes: cron.expected_cadence_minutes || 60,
            last_run_at: cron.last_run_at,
            next_expected_at: cron.next_expected_at,
            enabled: cron.enabled !== false,
            agent_id: agentId,
          },
          { onConflict: "name", ignoreDuplicates: false }
        );
      }
    }

    // Sync blockers
    if (body.blockers && Array.isArray(body.blockers)) {
      for (const blocker of body.blockers) {
        const agentId = blocker.agent_name ? results[blocker.agent_name] || null : blocker.agent_id;
        await supabase.from("blockers").upsert(
          {
            title: blocker.title,
            description: blocker.description,
            severity: blocker.severity || "medium",
            status: blocker.status || "open",
            agent_id: agentId,
          },
          { onConflict: "title", ignoreDuplicates: false }
        );
      }
    }

    // Sync todos
    if (body.todos && Array.isArray(body.todos)) {
      for (const todo of body.todos) {
        const agentId = todo.agent_name ? results[todo.agent_name] || null : todo.agent_id;
        await supabase.from("todos").upsert(
          {
            title: todo.title,
            description: todo.description,
            status: todo.status || "todo",
            priority: todo.priority || 0,
            agent_id: agentId,
            due_date: todo.due_date,
          },
          { onConflict: "title", ignoreDuplicates: false }
        );
      }
    }

    // Sync cost entries
    if (body.costs && Array.isArray(body.costs)) {
      for (const cost of body.costs) {
        const agentId = cost.agent_name ? results[cost.agent_name] || null : cost.agent_id;
        await supabase.from("cost_entries").insert({
          agent_id: agentId,
          amount: cost.amount,
          currency: cost.currency || "USD",
          category: cost.category,
          description: cost.description,
          period_start: cost.period_start,
          period_end: cost.period_end,
        });
      }
    }

    // Sync revenue
    if (body.revenue && Array.isArray(body.revenue)) {
      for (const rev of body.revenue) {
        await supabase.from("revenue_entries").insert({
          source: rev.source,
          amount: rev.amount,
          currency: rev.currency || "USD",
          description: rev.description,
          recorded_at: rev.recorded_at,
        });
      }
    }

    return json({ ok: true, agent_ids: results });
  }

  // --- Per-agent auth for all other endpoints ---
  const agentKey = req.headers.get("x-agent-key");
  if (!agentKey) {
    return json({ error: "Missing X-Agent-Key header" }, 401);
  }
  const agentId = await validateAgentKey(supabase, agentKey);
  if (!agentId) {
    return json({ error: "Invalid or revoked API key" }, 403);
  }

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
        .eq("agent_id", agentId)
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

    // POST /ingest/todos — agent creates/updates a todo
    if (req.method === "POST" && path === "todos") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("todos")
        .insert({
          agent_id: agentId,
          title: body.title,
          description: body.description,
          status: body.status || "todo",
          priority: body.priority || 0,
          due_date: body.due_date,
        })
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    // PUT /ingest/todos/:id — agent updates todo status
    if (req.method === "PUT" && path.startsWith("todos/")) {
      const todoId = path.split("/")[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from("todos")
        .update({
          status: body.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", todoId)
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
