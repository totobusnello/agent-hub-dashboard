// supabase/functions/admin/index.ts
// Handles /admin/* routes — authenticated via Supabase JWT (Authorization header)
// Full CRUD for the admin dashboard.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const supabase = createClient(supabaseUrl, serviceKey);
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth: require valid Supabase JWT ---
  const user = await getUser(req);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  // Use service role for DB ops (admin has full access)
  const supabase = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin\/?/, "").replace(/\/$/, "");
  const segments = path.split("/").filter(Boolean);

  try {
    // ---- AGENTS ----

    // GET /admin/agents — list with computed status
    if (req.method === "GET" && segments[0] === "agents" && segments.length === 1) {
      const { data, error } = await supabase
        .from("agent_current_status")
        .select("*");
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    // PUT /admin/agents/:id — update agent metadata / set override
    if (req.method === "PUT" && segments[0] === "agents" && segments.length === 2) {
      const agentId = segments[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from("agents")
        .update(body)
        .eq("id", agentId)
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    // GET /admin/agents/:id/runs — paginated runs
    if (req.method === "GET" && segments[0] === "agents" && segments[2] === "runs") {
      const agentId = segments[1];
      const page = parseInt(url.searchParams.get("page") || "0");
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const { data, error } = await supabase
        .from("agent_runs")
        .select("*")
        .eq("agent_id", agentId)
        .order("started_at", { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    // GET /admin/agents/:id/activity — activity feed
    if (req.method === "GET" && segments[0] === "agents" && segments[2] === "activity") {
      const agentId = segments[1];
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const { data, error } = await supabase
        .from("agent_activity")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    // POST /admin/agents/:id/keys — generate new API key
    if (req.method === "POST" && segments[0] === "agents" && segments[2] === "keys" && segments.length === 3) {
      const agentId = segments[1];
      const body = await req.json().catch(() => ({}));
      const { data, error } = await supabase.rpc("generate_agent_key", {
        p_agent_id: agentId,
        p_label: body.label || "default",
      });
      if (error) return json({ error: error.message }, 400);
      return json({ key: data }, 201);
    }

    // DELETE /admin/agents/:id/keys/:keyId — revoke key
    if (req.method === "DELETE" && segments[0] === "agents" && segments[2] === "keys" && segments.length === 4) {
      const keyId = segments[3];
      const { error } = await supabase
        .from("agent_api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", keyId);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    // ---- CRON HEALTH ----
    if (req.method === "GET" && segments[0] === "cron-health") {
      const { data, error } = await supabase
        .from("cron_health")
        .select("*");
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    // ---- GOALS (CRUD) ----
    if (segments[0] === "goals") {
      if (req.method === "GET") {
        const { data, error } = await supabase.from("goals").select("*").order("priority");
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("goals").insert(body).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data, 201);
      }
      if (req.method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.from("goals").update(body).eq("id", segments[1]).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "DELETE" && segments.length === 2) {
        const { error } = await supabase.from("goals").delete().eq("id", segments[1]);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }
    }

    // ---- BLOCKERS (CRUD) ----
    if (segments[0] === "blockers") {
      if (req.method === "GET") {
        const { data, error } = await supabase.from("blockers").select("*").order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("blockers").insert(body).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data, 201);
      }
      if (req.method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.from("blockers").update(body).eq("id", segments[1]).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "DELETE" && segments.length === 2) {
        const { error } = await supabase.from("blockers").delete().eq("id", segments[1]);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }
    }

    // ---- REVENUE (CRUD) ----
    if (segments[0] === "revenue") {
      if (req.method === "GET") {
        const { data, error } = await supabase.from("revenue_entries").select("*").order("recorded_at", { ascending: false });
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("revenue_entries").insert(body).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data, 201);
      }
      if (req.method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.from("revenue_entries").update(body).eq("id", segments[1]).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
    }

    // ---- COST ENTRIES (CRUD) ----
    if (segments[0] === "costs") {
      if (req.method === "GET") {
        const { data, error } = await supabase.from("cost_entries").select("*").order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("cost_entries").insert(body).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data, 201);
      }
    }

    // ---- PIPELINE (CRUD) ----
    if (segments[0] === "pipeline") {
      if (req.method === "GET") {
        const { data, error } = await supabase.from("pipeline_items").select("*").order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("pipeline_items").insert(body).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data, 201);
      }
      if (req.method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.from("pipeline_items").update(body).eq("id", segments[1]).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
    }

    // ---- TODOS (CRUD) ----
    if (segments[0] === "todos") {
      if (req.method === "GET") {
        const { data, error } = await supabase.from("todos").select("*").order("priority");
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase.from("todos").insert(body).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data, 201);
      }
      if (req.method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.from("todos").update({ ...body, updated_at: new Date().toISOString() }).eq("id", segments[1]).select().single();
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      if (req.method === "DELETE" && segments.length === 2) {
        const { error } = await supabase.from("todos").delete().eq("id", segments[1]);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
