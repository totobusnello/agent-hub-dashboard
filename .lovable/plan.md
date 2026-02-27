

# TrenchClaw Command Center — Refined Architecture

## Overview
Incorporating the user's architectural refinements: append-only activity log, computed agent status, split API with per-agent auth, agent runs tracking, and cron lateness detection.

---

## 1. Database Schema Refinements

### `agents` table
- Core metadata only: name, emoji, purpose, slack_channel, model, created_at
- **No mutable `status` column** — status is computed from latest run + optional `status_override`
- `status_override` (nullable) — manual override with reason and timestamp, takes precedence over computed status

### `agent_runs` table (NEW)
- Groups related activity into a single logical "run"
- Fields: id, agent_id, started_at, finished_at, trigger_type (cron/manual/webhook), outcome (success/partial/error), summary, error_message
- Each run has many activity entries

### `agent_activity` table (APPEND-ONLY)
- Immutable log — inserts only, no updates or deletes
- Fields: id, agent_id, run_id (FK to agent_runs), event_type (output/log/error/status_change), payload (JSONB), created_at
- RLS: insert-only for agent keys, read-only for admin
- A database view `agent_current_status` computes each agent's live status from their latest run outcome + any active override

### `cron_jobs` table (EXPANDED)
- Added: `expected_cadence_minutes`, `last_run_at`, `next_expected_at`
- A computed `lateness_seconds` field (or view) = NOW() - next_expected_at when positive
- Status derived: on_time / late / missed (configurable thresholds)
- Dashboard shows lateness warnings with visual indicators

### `agent_api_keys` table (NEW)
- Per-agent revocable API keys
- Fields: id, agent_id, key_hash (bcrypt/sha256 of the key), label, created_at, revoked_at, last_used_at
- Plain key shown once on creation, only hash stored
- Revocation is soft-delete (set revoked_at), key stops working immediately

### Other tables remain as planned
- `blockers`, `goals` (kanban), `slack_channels`, `revenue_entries`, `pipeline_items`, `profiles`

---

## 2. Split API Architecture

### `/ingest/*` endpoints (Agent-authenticated via API key)
- **POST /ingest/runs** — Agent starts a new run, returns run_id
- **PUT /ingest/runs/:id** — Agent completes a run (set outcome, finished_at)
- **POST /ingest/activity** — Append activity entry (linked to run_id)
- **POST /ingest/blockers** — Agent reports a blocker
- Auth: API key in `X-Agent-Key` header → validated against `agent_api_keys` table (not revoked, hash matches)
- Agent identity derived from the key's linked agent_id — agents can only write their own data

### `/admin/*` endpoints (User-authenticated via Supabase JWT)
- **GET /admin/agents** — List all agents with computed status
- **PUT /admin/agents/:id** — Update agent metadata, set/clear status override
- **GET /admin/agents/:id/runs** — List runs for an agent (paginated)
- **GET /admin/agents/:id/activity** — Activity feed for an agent
- **POST /admin/agents/:id/keys** — Generate new API key for agent (returns plain key once)
- **DELETE /admin/agents/:id/keys/:keyId** — Revoke an API key
- **GET /admin/cron-health** — Cron jobs with lateness info
- **CRUD /admin/goals** — Kanban board items
- **CRUD /admin/blockers** — Blocker management
- **CRUD /admin/revenue** — Revenue/budget entries
- Auth: Supabase JWT verified via `getClaims()`, scoped to your user ID

---

## 3. Computed Status Logic
- Database view `agent_current_status`:
  - If `status_override` is set and not expired → use override
  - Else → derive from latest `agent_runs` entry: success=active, error=errored, no runs in 2x cadence=stale
- Dashboard reads from this view — single source of truth
- Override UI: click agent → "Set manual status" with reason field and optional expiry

## 4. Cron Lateness Tracking
- Each cron job has `expected_cadence_minutes` (e.g., 60 for hourly)
- View computes: `lateness = NOW() - (last_run_at + cadence)`
- Thresholds: green (<5min late), yellow (5-30min), red (>30min or missed)
- Dashboard cron health page shows lateness column with color-coded badges

## 5. Security Model
- All tables have RLS enabled
- `agent_activity`: INSERT allowed when API key valid for that agent_id (via edge function, not direct DB access)
- All other tables: full access only for authenticated admin user
- Agent API keys never stored in plain text — hashed on creation
- Edge functions handle key validation before writing to append-only tables

## 6. Frontend (unchanged from prior plan)
- Auth login page, sidebar navigation
- Agent grid with computed status from the view
- Agent detail → runs list → activity drill-down
- Cron health with lateness indicators
- Kanban board, blocker board, revenue dashboard, Slack map, pipeline view
- API key management UI per agent (generate/revoke)

