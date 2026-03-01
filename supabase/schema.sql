-- ============================================================
-- TrenchClaw Command Center — Full Database Schema
-- Run against your Supabase project (Postgres 15+)
-- ============================================================

-- 0. Extensions
create extension if not exists pgcrypto;

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 1a. agents
create table public.agents (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  emoji         text default '🤖',
  purpose       text,
  slack_channel text,
  model         text,
  expected_cadence_minutes int, -- how often this agent should run
  status_override jsonb,        -- { status, reason, set_at, expires_at }
  created_at    timestamptz not null default now()
);

-- 1b. agent_runs
create table public.agent_runs (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references public.agents(id) on delete cascade,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  trigger_type  text not null default 'manual' check (trigger_type in ('cron','manual','webhook')),
  outcome       text check (outcome in ('success','partial','error')),
  summary       text,
  error_message text
);
create index idx_agent_runs_agent on public.agent_runs(agent_id, started_at desc);

-- 1c. agent_activity (APPEND-ONLY)
create table public.agent_activity (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.agents(id) on delete cascade,
  run_id      uuid references public.agent_runs(id) on delete set null,
  event_type  text not null check (event_type in ('output','log','error','status_change','metric')),
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index idx_activity_agent on public.agent_activity(agent_id, created_at desc);
create index idx_activity_run   on public.agent_activity(run_id);

-- 1d. agent_api_keys
create table public.agent_api_keys (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.agents(id) on delete cascade,
  key_hash    text not null,          -- sha256 hex of the plain key
  label       text default 'default',
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  last_used_at timestamptz
);
create index idx_api_keys_agent on public.agent_api_keys(agent_id);

-- 1e. cron_jobs
create table public.cron_jobs (
  id                      uuid primary key default gen_random_uuid(),
  agent_id                uuid references public.agents(id) on delete set null,
  name                    text not null,
  schedule                text not null, -- cron expression
  expected_cadence_minutes int not null default 60,
  last_run_at             timestamptz,
  next_expected_at        timestamptz,
  enabled                 boolean not null default true,
  created_at              timestamptz not null default now()
);

-- 1f. blockers
create table public.blockers (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid references public.agents(id) on delete set null,
  title       text not null,
  description text,
  severity    text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status      text not null default 'open' check (status in ('open','investigating','resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- 1g. goals (kanban)
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'backlog' check (status in ('backlog','in_progress','done','blocked')),
  priority    int not null default 0,
  agent_id    uuid references public.agents(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1h. slack_channels
create table public.slack_channels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  webhook_url text,
  agent_id    uuid references public.agents(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- 1i. cost_entries
create table public.cost_entries (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid references public.agents(id) on delete set null,
  amount      numeric(12,2) not null,
  currency    text not null default 'USD',
  category    text,
  description text,
  period_start date,
  period_end   date,
  created_at  timestamptz not null default now()
);

-- 1j. revenue_entries
create table public.revenue_entries (
  id          uuid primary key default gen_random_uuid(),
  source      text not null,
  amount      numeric(12,2) not null,
  currency    text not null default 'USD',
  description text,
  recorded_at date not null default current_date,
  created_at  timestamptz not null default now()
);

-- 1k. pipeline_items
create table public.pipeline_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  stage       text not null default 'lead' check (stage in ('lead','contacted','proposal','negotiation','closed_won','closed_lost')),
  value       numeric(12,2),
  currency    text not null default 'USD',
  agent_id    uuid references public.agents(id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1l. todos
create table public.todos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null unique,
  description text,
  status      text not null default 'todo' check (status in ('todo','in_progress','done','blocked')),
  priority    int not null default 0,
  agent_id    uuid references public.agents(id) on delete set null,
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Unique constraints for heartbeat upserts
alter table public.agents add constraint agents_name_unique unique (name);
alter table public.cron_jobs add constraint cron_jobs_name_unique unique (name);
alter table public.blockers add constraint blockers_title_unique unique (title);

-- ============================================================
-- 2. VIEWS
-- ============================================================

-- 2a. agent_current_status — computed from latest run + override
create or replace view public.agent_current_status as
select
  a.id,
  a.name,
  a.emoji,
  a.purpose,
  a.expected_cadence_minutes,
  a.status_override,
  lr.last_run_at,
  lr.last_outcome,
  case
    -- manual override takes precedence (if not expired)
    when a.status_override is not null
         and (a.status_override->>'expires_at' is null
              or (a.status_override->>'expires_at')::timestamptz > now())
      then a.status_override->>'status'
    -- no runs ever
    when lr.last_run_at is null then 'unknown'
    -- latest run errored
    when lr.last_outcome = 'error' then 'errored'
    -- stale: no run within 2× expected cadence
    when a.expected_cadence_minutes is not null
         and lr.last_run_at < now() - (a.expected_cadence_minutes * 2 || ' minutes')::interval
      then 'stale'
    -- otherwise healthy
    else 'active'
  end as computed_status,
  lr.last_summary
from public.agents a
left join lateral (
  select
    r.started_at as last_run_at,
    r.outcome    as last_outcome,
    r.summary    as last_summary
  from public.agent_runs r
  where r.agent_id = a.id
  order by r.started_at desc
  limit 1
) lr on true;

-- 2b. cron_health — lateness tracking
create or replace view public.cron_health as
select
  c.*,
  case
    when c.next_expected_at is null then 0
    else greatest(0, extract(epoch from now() - c.next_expected_at))
  end as lateness_seconds,
  case
    when c.next_expected_at is null or now() <= c.next_expected_at then 'on_time'
    when extract(epoch from now() - c.next_expected_at) < 300 then 'on_time'    -- <5 min
    when extract(epoch from now() - c.next_expected_at) < 1800 then 'late'      -- 5-30 min
    else 'missed'                                                                -- >30 min
  end as health_status
from public.cron_jobs c
where c.enabled = true;

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

-- 3a. Validate an agent API key, return agent_id or null
create or replace function public.validate_agent_key(raw_key text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hashed text;
  found_agent_id uuid;
begin
  hashed := encode(digest(raw_key, 'sha256'), 'hex');
  select ak.agent_id into found_agent_id
  from public.agent_api_keys ak
  where ak.key_hash = hashed
    and ak.revoked_at is null;
  -- bump last_used_at
  if found_agent_id is not null then
    update public.agent_api_keys
    set last_used_at = now()
    where key_hash = hashed and revoked_at is null;
  end if;
  return found_agent_id;
end;
$$;

-- 3b. Generate a new API key for an agent (returns plain key)
create or replace function public.generate_agent_key(p_agent_id uuid, p_label text default 'default')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  plain_key text;
  hashed text;
begin
  plain_key := 'tc_' || encode(gen_random_bytes(32), 'hex');
  hashed := encode(digest(plain_key, 'sha256'), 'hex');
  insert into public.agent_api_keys (agent_id, key_hash, label)
  values (p_agent_id, hashed, p_label);
  return plain_key;
end;
$$;

-- ============================================================
-- 4. ROW-LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.agents          enable row level security;
alter table public.agent_runs      enable row level security;
alter table public.agent_activity  enable row level security;
alter table public.agent_api_keys  enable row level security;
alter table public.cron_jobs       enable row level security;
alter table public.blockers        enable row level security;
alter table public.goals           enable row level security;
alter table public.slack_channels  enable row level security;
alter table public.cost_entries    enable row level security;
alter table public.revenue_entries enable row level security;
alter table public.pipeline_items  enable row level security;
alter table public.todos           enable row level security;

-- Admin policies: authenticated users get full access
-- (In production, add role checks; for single-admin this is fine)
create policy "admin_all" on public.agents          for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.agent_runs      for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.agent_activity  for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.agent_api_keys  for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.cron_jobs       for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.blockers        for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.goals           for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.slack_channels  for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.cost_entries    for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.revenue_entries for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.pipeline_items  for all using (auth.role() = 'authenticated');
create policy "admin_all" on public.todos           for all using (auth.role() = 'authenticated');

-- Service-role insert policies for agent_activity and agent_runs
-- (Edge functions use service_role key, so RLS is bypassed there.
--  These policies exist for defense-in-depth.)
create policy "agent_insert_activity" on public.agent_activity
  for insert with check (true);
create policy "agent_insert_runs" on public.agent_runs
  for insert with check (true);
