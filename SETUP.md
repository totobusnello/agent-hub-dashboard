# Setup Guide

Three steps. Under 15 minutes.

---

## Step 1 — Create your Supabase database

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** → paste the full contents of [`supabase/schema.sql`](supabase/schema.sql) → click **Run**
3. Go to **Authentication → Users** → click **Add User** → set your email and password (this is your dashboard login)
4. Go to **Settings → API** → copy your **Project URL** and **anon public** key — you'll need both in Step 2

---

## Step 2 — Deploy the dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → connect your GitHub if prompted → select **agent-hub-dashboard**
3. Add these two environment variables:

   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |

4. Click **Deploy**

Once deployed, open your `.vercel.app` URL and sign in with the user you created in Step 1.

---

## Step 3 — Connect OpenClaw

1. Open your OpenClaw TUI
2. Copy the full contents of [`openclaw/OPENCLAW_SETUP.txt`](openclaw/OPENCLAW_SETUP.txt) and paste it as a message
3. OpenClaw will automatically:
   - Create `scripts/dashboard-heartbeat.py` (auto-discovers your agents from SOUL.md files)
   - Create `.env.dashboard` with credential placeholders
   - Register the heartbeat cron job (runs 3x/day)
4. Fill in your Supabase credentials in `.env.dashboard`:

   | Variable | Where to find it |
   |---|---|
   | `SUPABASE_URL` | Supabase → Settings → API → Project URL |
   | `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role key (**keep this secret**) |

On the next heartbeat run, your agents will appear in the dashboard automatically. To test immediately, run `python3 scripts/dashboard-heartbeat.py` from your workspace.

---

## Getting updates

Your dashboard deploys directly from this repo. When an update is released:

1. Go to your project on [vercel.com](https://vercel.com)
2. Open **Deployments** → click **Redeploy** on the latest deployment
3. Done — no code changes needed

---

## Troubleshooting

**No agents appearing in the dashboard**
- Check OpenClaw logs to confirm the heartbeat script ran without errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the `service_role` key, not the anon key (they look similar)

**Can't log in to the dashboard**
- Confirm you created a user in Supabase → Authentication → Users
- Double-check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel project settings

**Agents showing as stale**
- Set `expected_cadence_minutes` in your `AGENTS` config to match how often each agent actually runs
- A stale agent just means no heartbeat has been received in 2× that window
