# Architecture

How the Agent Hub Dashboard works — from agent runtime to live UI.

## Data Flow

```
OpenClaw Agents
      |
      | (every 15 min)
      v
dashboard.py heartbeat script
      |
      | POST /ingest/heartbeat
      v
Supabase Edge Function (/ingest)
      |
      | upserts / inserts
      v
Supabase Postgres
  - agents (status, heartbeat_payload)
  - agent_activity (append-only event log)
  - agent_relationships (neural topology)
  - cron_jobs, blockers, todos, costs, revenue
      |
      | React Query (polling every 10s)
      v
Dashboard React App
  - Command Center (agent grid / neural map / command split)
  - System Terminal (real-time event log)
  - Event Marquee (scrolling ticker)
  - Goals / Todos / Blockers / Cron / Revenue / Pipeline
```

## Source of Truth

**OpenClaw is the source.** The dashboard never writes agent state — it only reads.

- OpenClaw agents run on their own schedules
- A heartbeat script collects current state and pushes it to Supabase
- The dashboard queries Supabase and renders what it finds
- Manual operations (goals, pipeline) are managed directly in the dashboard

## Heartbeat Pattern

The heartbeat is a single `POST /ingest/heartbeat` call that bulk-syncs:

1. **Agent records** — upserted by `name` (unique). Includes emoji, purpose, model, status_override, expected_cadence_minutes
2. **Agent heartbeat** — updates `last_heartbeat_at` and `heartbeat_payload` JSONB on the agent record
3. **Activity events** — appended to `agent_activity` (never updated, never deleted)
4. **Agent relationships** — upserted to `agent_relationships` for neural map topology
5. **Cron jobs** — upserted by `name` with schedule, last_run_at, next_expected_at
6. **Blockers** — upserted by `title` with severity and status
7. **Todos** — upserted by `title` with status and priority
8. **Costs / Revenue** — inserted (not upserted) as new entries

## Status Lifecycle

Agent status is computed by the `agent_current_status` Postgres view. Priority chain:

```
1. Manual override (status_override JSONB, if not expired)
   ↓ (no override)
2. Heartbeat payload status (if heartbeat received in last 10 min)
   ↓ (stale heartbeat)
3. Stale (heartbeat older than 2x expected_cadence_minutes)
   ↓ (no heartbeat ever)
4. Latest run outcome (errored if last run failed)
   ↓ (no runs)
5. Unknown
```

Valid statuses: `active`, `running`, `idle`, `degraded`, `stale`, `errored`, `paused`, `unknown`

## Database Schema

### Core Tables

| Table | Purpose | Upsert Key |
|-------|---------|------------|
| `agents` | Agent registry and heartbeat state | `name` |
| `agent_activity` | Append-only event log | (insert only) |
| `agent_relationships` | Neural map topology edges | `(source_agent_id, target_agent_id)` |
| `agent_runs` | Run history with outcomes | (insert only) |
| `agent_api_keys` | Per-agent auth keys | (insert only) |
| `cron_jobs` | Scheduled task definitions | `name` |
| `blockers` | Issues and impediments | `title` |
| `todos` | Task tracking | `title` |
| `goals` | Strategic objectives (kanban) | (manual CRUD) |
| `goal_agents` | Goal-to-agent assignment (M:M) | `(goal_id, agent_id)` |
| `cost_entries` | Expense tracking | (insert only) |
| `revenue_entries` | Revenue tracking | (insert only) |
| `pipeline_items` | Sales pipeline stages | (manual CRUD) |

### Key Views

- **`agent_current_status`** — Joins agents + latest run + override logic to compute `computed_status`
- **`cron_health`** — Calculates `lateness_seconds` and `health_status` (on_time/late/missed)

## Event Log Model

The `agent_activity` table is **append-only**. Each row is one event:

```json
{
  "agent_id": "uuid",
  "event_type": "output | log | error | status_change | metric",
  "payload": {
    "message": "Published newsletter issue",
    "...any extra data"
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

Dashboard components that consume events:
- **System Terminal** — last 50 events across all agents
- **Event Marquee** — last 20 events as scrolling ticker
- **Last Event Ticker** — single most recent event in header
- **Agent Activity Meter** — event frequency bars per agent (12h window)
- **Agent Detail Drawer** — last 5 events for selected agent

## Neural Topology

The neural map visualizes agent-to-agent relationships as a directed graph.

**Data source:** `agent_relationships` table with `source_agent_id` → `target_agent_id`

**Layout:** Radial arrangement around a central "Core" node. Agents without incoming edges connect directly to Core.

**Visual encoding:**
- Node color/animation reflects `computed_status`
- Edge color reflects source agent status
- Overall background hue shifts based on fleet health (green/amber/red)

OpenClaw pushes relationship changes during heartbeat. Example:
```json
{
  "relationships": [
    { "source": "Scout", "target": "Analyst" },
    { "source": "Analyst", "target": "Builder" }
  ]
}
```

## Edge Functions

### `/ingest` (Agent-facing API)
- `POST /ingest/heartbeat` — Bulk sync from OpenClaw (service-role auth)
- `POST /ingest/runs` — Start a run (per-agent API key)
- `PUT /ingest/runs/:id` — Complete a run
- `POST /ingest/activity` — Append event
- `POST /ingest/blockers` — Report blocker
- `POST /ingest/todos` — Create todo

### `/admin` (Dashboard-facing API)
- CRUD operations for goals, agents, blockers, revenue, pipeline, todos
- Used by the dashboard UI for manual management

## Auth & Security

- **RLS enabled** on all tables
- **Authenticated users** get full read/write access (single-admin model)
- **Service-role key** used by edge functions (bypasses RLS)
- **Per-agent API keys** for individual agent authentication (sha256 hashed)
- **Anon key** used by the frontend for authenticated queries
