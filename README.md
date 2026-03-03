# Agent Hub Dashboard

Real-time command center for monitoring your AI agent fleet. Built for [OpenClaw](https://openclaw.ai) users who want full visibility into what their agents are doing.

See [SETUP.md](SETUP.md) for the full setup guide (3 steps, ~15 minutes).

## Features

- **Agent Fleet Grid** -- Live status cards for every agent with heartbeat tracking
- **Neural Map** -- Interactive graph visualization of agent-to-agent relationships
- **System Terminal** -- Real-time scrolling log of agent activity events
- **Goals Kanban** -- Drag-and-drop board with multi-agent assignment
- **Todos & Blockers** -- Task and issue tracking by agent
- **Cron Health** -- Lateness monitoring with human-readable schedules
- **Revenue & Costs** -- Financial KPIs and entry tracking
- **Sales Pipeline** -- 6-stage deal kanban

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + Edge Functions)
- TanStack React Query
- @xyflow/react (Neural Map)
- @dnd-kit (drag-and-drop)
- Framer Motion (animations)

## Quick Start

See [SETUP.md](SETUP.md) for the full setup guide.

```bash
# 1. Clone and install
git clone <this-repo>
cd agent-hub-dashboard
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Run
npm run dev
```

## How It Works

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full integration contract.

**TL;DR:** Your OpenClaw instance runs a heartbeat script every 15 minutes that pushes agent state to Supabase. The dashboard reads from Supabase and renders everything live.

```
OpenClaw --> heartbeat script --> Supabase --> Dashboard
```

## Commands

```bash
npm run dev      # Start dev server (localhost:8080)
npm run build    # Production build
npx tsc --noEmit # Type check
npm run lint     # ESLint
npm test         # Run tests
```
