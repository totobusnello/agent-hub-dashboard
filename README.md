# Agent Hub Dashboard

A real-time command center for your OpenClaw AI agent fleet. See every agent's live status, activity logs, cron health, goals, blockers, and more — in one dark, beautiful dashboard.

**Setup takes about 15 minutes across 3 steps.**

---

## What you get

| Feature | What it does |
|---|---|
| **Agent Fleet Grid** | Live status cards for every agent — active, idle, degraded, stale |
| **Neural Map** | Interactive graph of how your agents connect and feed each other |
| **System Terminal** | Real-time scrolling log of every agent event and output |
| **Cron Health** | See which scheduled jobs are on time, late, or missed |
| **Goals Kanban** | Drag-and-drop goal board with multi-agent assignment |
| **Todos & Blockers** | Task tracking and issue management per agent |
| **Revenue & Costs** | Financial KPI dashboard |
| **Sales Pipeline** | 6-stage deal kanban |

---

## How it works

```
Your OpenClaw workspace
        │
        │  heartbeat script (runs 3x/day via OpenClaw cron)
        ▼
   Supabase database  ◄──────── you manage goals, pipeline, blockers manually
        │
        │  React Query (polls every 10s)
        ▼
  Dashboard on Vercel  ──── sign in with email/password to view
```

OpenClaw is the write side. The dashboard only reads.

---

## Step 1 — Set up Supabase (5 min)

Supabase is a free database that sits between your OpenClaw instance and the dashboard.

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
   - Pick any name and region
   - Save the database password somewhere (you won't need it often)
   - Wait ~2 minutes for it to provision

2. Go to **SQL Editor** (left sidebar) → click **New query** → paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) from this repo → click **Run**
   - This creates all tables, views, and security policies in one shot
   - You should see "Success. No rows returned"

3. Go to **Authentication** (left sidebar) → **Users** → **Add user** → **Create new user**
   - Enter your email and a password — this is how you'll log in to the dashboard

4. Go to **Settings** (left sidebar) → **API**
   - Copy **Project URL** → save it (looks like `https://abcdefgh.supabase.co`)
   - Copy **anon public** key → save it (long JWT string)
   - Copy **service_role** key → save it separately (keep this secret — it has full DB access)

---

## Step 2 — Deploy the dashboard (2 min)

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub

2. Click **Import Git Repository** → find and select **agent-hub-dashboard** in the list
   - If you don't see it, click **Adjust GitHub App Permissions** and grant access to this repo

3. Before clicking Deploy, scroll down to **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Your Project URL from Step 1 |
   | `VITE_SUPABASE_ANON_KEY` | Your anon public key from Step 1 |

4. Click **Deploy** and wait ~1 minute

5. Open the `.vercel.app` URL Vercel gives you → sign in with the email/password you created in Step 1

Your dashboard is live. It'll show empty state until Step 3 connects your agents.

---

## Step 3 — Connect OpenClaw (5–10 min)

This is what makes the dashboard come alive. OpenClaw runs a heartbeat script 3x/day that reads your workspace and pushes agent status to Supabase.

1. Open your **OpenClaw TUI**

2. Open [`openclaw/OPENCLAW_SETUP.txt`](openclaw/OPENCLAW_SETUP.txt) from this repo, **copy the entire contents**, and **paste it as a message in OpenClaw**

3. OpenClaw's AI will automatically:
   - Explore your workspace and read your agent SOUL.md files
   - Write a custom `scripts/dashboard-heartbeat.py` for your specific agents
   - Create a `.env.dashboard` file for your Supabase credentials
   - Register the heartbeat cron job (runs at 8am, 2pm, 8pm)

4. When OpenClaw finishes, open `.env.dashboard` in your workspace and fill in your credentials:
   ```
   SUPABASE_URL=https://abcdefgh.supabase.co        ← your Project URL from Step 1
   SUPABASE_SERVICE_KEY=eyJ...                       ← your service_role key from Step 1
   ```
   > ⚠️ Use the **service_role** key here (not the anon key). They look similar — double-check the label.

5. Run the heartbeat once manually to verify:
   ```bash
   python3 scripts/dashboard-heartbeat.py
   ```
   You should see your agents listed and "Done!" at the end. Reload your dashboard — your agents will appear.

---

## Getting updates

When a new version is released:

1. Go to your project at [vercel.com](https://vercel.com)
2. Click **Deployments** → **Redeploy** on the latest entry
3. Done — no code changes needed on your end

---

## Troubleshooting

**Dashboard shows no agents after running the heartbeat**
- Check the heartbeat output for errors
- Make sure `SUPABASE_SERVICE_KEY` in `.env.dashboard` is the `service_role` key, not the `anon` key
- Check that your agents have `SOUL.md` files in `agents/{name}/SOUL.md`

**Can't log in to the dashboard**
- Confirm you added a user in Supabase → Authentication → Users
- Double-check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel → Settings → Environment Variables

**Agents show as "stale"**
- This means the heartbeat hasn't run yet, or the credentials in `.env.dashboard` are wrong
- Run `python3 scripts/dashboard-heartbeat.py` manually and check for errors

**OpenClaw cron isn't running**
- In OpenClaw TUI, run `openclaw cron list` to confirm the Dashboard Heartbeat job is registered
- Check the cron logs for errors
