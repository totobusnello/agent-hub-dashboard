# Agent Hub Dashboard (TrenchClaw Command Center)

## Project
Dashboard for monitoring a fleet of AI agents. React SPA backed by Supabase (project: `gqwnubwygmbanzwjhyoc`).

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- Supabase (Postgres + Auth + RLS)
- TanStack React Query for data fetching
- Framer Motion for animations
- @dnd-kit for drag-and-drop

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npx tsc --noEmit` — type check
- `npm run lint` — ESLint
- `npm test` — run vitest

## Key Files
- `src/pages/Index.tsx` — Main command center (agent fleet grid)
- `src/pages/Goals.tsx` — Goals kanban with drag-and-drop
- `src/pages/Todos.tsx` — Todo kanban
- `src/pages/Blockers.tsx` — Blocker cards by severity
- `src/pages/CronHealth.tsx` — Cron job lateness table
- `src/pages/Revenue.tsx` — Revenue/cost tracking
- `src/pages/Pipeline.tsx` — Sales pipeline kanban
- `src/components/AppSidebar.tsx` — Navigation sidebar
- `src/components/StatusBadge.tsx` — Status indicator with pulsing dots
- `src/components/GoalFormModal.tsx` — Goal create/edit dialog
- `src/components/DashboardLayout.tsx` — Layout wrapper with dot-grid bg
- `src/hooks/useSupabaseQuery.ts` — Generic Supabase query hook
- `src/hooks/useGoals.ts` — Goals CRUD with join table support
- `src/index.css` — CSS variables, glassmorphism, glow effects, animations
- `tailwind.config.ts` — Theme colors, custom keyframes
- `supabase/schema.sql` — Full DB schema (source of truth for documentation)

## Database
- Schema defined in `supabase/schema.sql`
- Use Supabase MCP (`execute_sql` for reads, `apply_migration` for DDL)
- Key tables: `agents`, `goals`, `goal_agents`, `todos`, `blockers`, `cron_jobs`, `pipeline_items`, `revenue_entries`, `cost_entries`
- Key views: `agent_current_status` (heartbeat-aware), `cron_health`
- RLS enabled on all tables — authenticated users get full access

## Conventions
- 2-space indentation
- Functional components with hooks
- Use existing shadcn/ui components from `src/components/ui/`
- Data fetching: `useSupabaseQuery` for simple queries, direct Supabase client + React Query for joins
- Status colors: success (green), warning (orange), destructive (red), muted (gray)
- Visual style: dark theme, glassmorphism cards (`.glass`), glow effects, shimmer gradients
- Only show `is_active = true` agents in UI
