# Agent Hub Dashboard (TotoClaw Command Center)

## Project
Dashboard for monitoring a fleet of AI agents. React SPA with Vercel serverless functions as API layer.
**No authentication** — dashboard is fully public (removed 2026-04-13).

## Deployment
- **Platform**: Vercel (scope: `lab-4591s-projects`)
- **Production URL**: https://agent-hub-dashboard-coral.vercel.app
- **Deploy command**: `npx vercel --yes --prod --scope lab-4591s-projects`
- **Project ID**: `prj_6ibydZQhaeokendHo9OpslVjAwIR`
- **Framework**: Vite (auto-detected)
- **Region**: iad1 (Washington, D.C.)

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- Supabase (Postgres — data only, **auth removed**)
- TanStack React Query for data fetching
- Framer Motion for animations
- @dnd-kit for drag-and-drop
- Vercel Serverless Functions (`api/`) for Notion proxy

## Architecture
```
Browser → Vite SPA (React)
           ├── /api/tarefas.js    → Notion API (DB: 31d8e29911ab81c88379fed013991e7e)
           ├── /api/agents.js     → Notion/Supabase
           ├── /api/blockers.js   → Notion API
           ├── /api/crons.js      → Notion API
           ├── /api/memoria.js    → Notion API
           ├── /api/memory-health.js → Notion API
           ├── /api/updates.js    → Notion API
           └── Supabase client    → Direct queries (agents, heartbeats)
```

## Environment Variables (Vercel)
- `VITE_SUPABASE_URL` — Supabase project URL (client-side)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (client-side)
- `NOTION_API_KEY` — Notion integration token (server-side, used by `api/` functions)
- `GITHUB_TOKEN` — GitHub API (server-side)
- `VERCEL_TOKEN` — Vercel API (server-side)

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npx tsc --noEmit` — type check
- `npm run lint` — ESLint
- `npm test` — run vitest

## Key Files
- `src/pages/Index.tsx` — Main command center (agent fleet grid)
- `src/pages/Tarefas.tsx` — Tarefas kanban (mirrors Notion statuses)
- `src/pages/Blockers.tsx` — Blocker cards by severity
- `src/pages/CronHealth.tsx` — Cron job lateness table
- `src/pages/UpdateSistema.tsx` — System updates
- `src/pages/MemoriaDecisoes.tsx` — Memory & decisions
- `src/pages/MemoriaHealth.tsx` — Memory health
- `src/pages/MemoryHealth.tsx` — Memory health (v2)
- `src/pages/KnowledgeGraph.tsx` — Knowledge graph visualization
- `src/pages/AgentIntel.tsx` — Agent intelligence search
- `src/pages/SystemPaper.tsx` — System paper with real-time charts
- `src/components/AppSidebar.tsx` — Navigation sidebar (no auth, no sign-out)
- `src/components/DashboardLayout.tsx` — Layout wrapper with cinematic mode
- `src/hooks/useNotionQuery.ts` — Generic Notion API query hook (fetches `/api/{endpoint}`)
- `src/hooks/useSupabaseQuery.ts` — Generic Supabase query hook
- `src/integrations/supabase/client.ts` — Supabase client (warns instead of throwing on missing env)
- `api/tarefas.js` — Serverless function: queries Notion tarefas database
- `src/index.css` — CSS variables, glassmorphism, glow effects, animations
- `tailwind.config.ts` — Theme colors, custom keyframes

## Notion Integration
- **Tarefas DB ID**: `31d8e29911ab81c88379fed013991e7e`
- **Status columns (must match Notion exactly)**:
  - `Pendente` — backlog / default fallback for unknown statuses
  - `Em andamento` — actively being worked on
  - `Aguardando input` — waiting for external input
  - `Aguardando Toto` — waiting for Toto's action
  - `Concluído` — done
- **Properties used**: Tarefa (title), Status (select), Prioridade (select), Para (select), De (select), Projeto (select), Prazo (date)
- **If Notion adds new statuses**: update `COLUMNS` and `COLUMN_CONFIG` in `src/pages/Tarefas.tsx`

## Database (Supabase)
- Schema defined in `supabase/schema.sql`
- Use Supabase MCP (`execute_sql` for reads, `apply_migration` for DDL)
- Key tables: `agents`, `goals`, `goal_agents`, `todos`, `blockers`, `cron_jobs`, `pipeline_items`, `revenue_entries`, `cost_entries`
- Key views: `agent_current_status` (heartbeat-aware), `cron_health`
- RLS enabled on all tables — anon key has read access

## Conventions
- 2-space indentation
- Functional components with hooks
- Use existing shadcn/ui components from `src/components/ui/`
- Data fetching: `useNotionQuery` for Notion-backed pages, `useSupabaseQuery` for Supabase data
- Status colors: success (green), warning (orange), destructive (red), muted (gray)
- Visual style: dark theme, glassmorphism cards (`.glass`), glow effects, shimmer gradients
- Only show `is_active = true` agents in UI

## Recent Changes (2026-04-13)
- Removed Supabase Auth entirely (AuthProvider, ProtectedRoute, login page)
- All routes are now public — no password, no login
- `/auth` redirects to `/`
- AppSidebar: removed sign-out button, shows "TotoClaw" in footer
- Supabase client: `console.warn` instead of `throw` on missing env vars
- Tarefas kanban: fixed columns to match actual Notion statuses (Em andamento, Aguardando Toto instead of A fazer, Pausado)
