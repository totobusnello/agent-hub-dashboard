#!/usr/bin/env python3
"""
Agent Hub Dashboard — Heartbeat Script
=======================================
Auto-discovers agents from your OpenClaw workspace and pushes live state
to Supabase. The dashboard reads from Supabase and renders everything live.

No pip dependencies — uses Python stdlib only.

SETUP:
  Fill in your Supabase credentials in .env.dashboard (workspace root):
    SUPABASE_URL=https://your-project-ref.supabase.co
    SUPABASE_SERVICE_KEY=your_service_role_key

SCHEDULE:
  Runs via OpenClaw cron 3x/day. See openclaw/OPENCLAW_SETUP.txt for
  the paste block that sets everything up automatically.
"""

import os
import re
import json
import glob
import time
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

# ── Workspace & credentials ───────────────────────────────────────────────────

# Script lives at scripts/dashboard-heartbeat.py → workspace is parent
WORKSPACE = str(Path(__file__).resolve().parent.parent)

# Load .env.dashboard from workspace root
_env_path = os.path.join(WORKSPACE, ".env.dashboard")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.")
    print(f"  Edit {_env_path} and add your Supabase credentials.")
    exit(1)


# ── Supabase REST helpers ─────────────────────────────────────────────────────

def _rest(method, table, data=None, params="", extra_headers=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if params:
        url += f"?{params}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode()
            return json.loads(content) if content.strip() else []
    except urllib.error.HTTPError as e:
        print(f"  ⚠ HTTP {e.code} on {method} {table}: {e.read().decode()[:200]}")
        return []


def upsert(table, rows):
    if not rows:
        return []
    return _rest("POST", table, rows,
                 extra_headers={"Prefer": "resolution=merge-duplicates,return=representation"})


def patch(table, where, data):
    _rest("PATCH", table, data, where, extra_headers={"Prefer": "return=minimal"})


def insert(table, rows):
    if not rows:
        return
    _rest("POST", table, rows, extra_headers={"Prefer": "return=minimal"})


# ── Parse helpers ─────────────────────────────────────────────────────────────

def _first_heading(text):
    m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    return m.group(1).strip() if m else None


def _first_emoji(text):
    m = re.search(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", text)
    return m.group(0) if m else "🤖"


def _section(text, name):
    m = re.search(rf"##\s+{re.escape(name)}\s*\n(.*?)(?=\n##|\Z)", text,
                  re.DOTALL | re.IGNORECASE)
    return m.group(1).strip() if m else None


def _field(text, name):
    m = re.search(rf"\*?\*?{re.escape(name)}\*?\*?\s*[:\-]\s*([^\n]+)", text, re.IGNORECASE)
    return m.group(1).strip() if m else None


def _file_age_hours(path):
    """Age in hours of the newest file under path, or None."""
    if not os.path.isdir(path):
        return None
    files = [f for f in glob.glob(os.path.join(path, "**", "*"), recursive=True)
             if os.path.isfile(f)]
    if not files:
        return None
    newest = max(os.path.getmtime(f) for f in files)
    return (time.time() - newest) / 3600


def _now():
    return datetime.now(timezone.utc).isoformat()


# ── Agent discovery ───────────────────────────────────────────────────────────

def discover_agents():
    """Scan agents/*/SOUL.md and return list of agent metadata dicts."""
    agents_dir = os.path.join(WORKSPACE, "agents")
    if not os.path.isdir(agents_dir):
        print(f"  No agents/ directory found at {agents_dir}")
        return []

    agents = []
    for entry in sorted(os.listdir(agents_dir)):
        agent_path = os.path.join(agents_dir, entry)
        soul_path = os.path.join(agent_path, "SOUL.md")
        if not os.path.isdir(agent_path) or not os.path.exists(soul_path):
            continue

        soul = open(soul_path).read()
        name = _first_heading(soul) or entry
        purpose = _section(soul, "Purpose") or _section(soul, "Identity") or _section(soul, "Role") or ""
        purpose = purpose.split("\n")[0].split(".")[0].strip()[:200]
        model = _field(soul, "Model") or _field(soul, "model") or "claude"

        agents.append({
            "dir": entry,
            "name": name,
            "emoji": _first_emoji(soul),
            "purpose": purpose,
            "model": model,
            "path": agent_path,
        })

    return agents


# ── Cron & known-issues ───────────────────────────────────────────────────────

def load_openclaw_crons():
    """Read OpenClaw's cron registry. Returns dict of {name: cron_data}."""
    cron_path = os.path.expanduser("~/.openclaw/cron/jobs.json")
    if not os.path.exists(cron_path):
        return {}
    try:
        return json.load(open(cron_path))
    except Exception:
        return {}


def load_known_issues():
    """Load manual agent status overrides from agents/known-issues.json."""
    path = os.path.join(WORKSPACE, "agents", "known-issues.json")
    if not os.path.exists(path):
        return {}
    try:
        return json.load(open(path)).get("agent_issues", {})
    except Exception:
        return {}


# ── Status computation ────────────────────────────────────────────────────────

_SEVERITY = ["active", "running", "idle", "degraded", "paused", "blocked", "errored"]


def compute_heartbeat(agent, cron_jobs, known_issues):
    """Build the heartbeat_payload dict for one agent."""
    name = agent["name"]
    dir_name = agent["dir"]

    # Match cron jobs by agent dir/name substring
    matching = {k: v for k, v in cron_jobs.items()
                if dir_name.lower() in k.lower() or name.lower() in k.lower()}

    # Base status from crons
    if matching:
        if any(v.get("status") == "error" for v in matching.values()):
            base_status = "degraded"
        elif any(v.get("status") == "ok" for v in matching.values()):
            base_status = "active"
        else:
            base_status = "idle"
    else:
        base_status = "idle"

    payload = {
        "status": base_status,
        "heartbeat_source": "openclaw-cron",
    }

    # Output/memory freshness
    output_age = _file_age_hours(os.path.join(agent["path"], "output"))
    memory_age = _file_age_hours(os.path.join(agent["path"], "memory"))
    if output_age is not None:
        payload["last_output_hours_ago"] = round(output_age, 1)
    if memory_age is not None:
        payload["last_memory_hours_ago"] = round(memory_age, 1)

    # Cron degraded_reasons / healthy_crons
    if matching:
        bad = [f"{k}: {v.get('last_error', 'error')}"
               for k, v in matching.items() if v.get("status") == "error"]
        good = [k for k, v in matching.items() if v.get("status") != "error"]
        if bad:
            payload["degraded_reasons"] = bad
        if good:
            payload["healthy_crons"] = good

    # Overlay known-issues (only escalate, never downgrade)
    known = known_issues.get(name, {})
    if known:
        known_status = known.get("status", base_status)
        base_idx = _SEVERITY.index(base_status) if base_status in _SEVERITY else 0
        known_idx = _SEVERITY.index(known_status) if known_status in _SEVERITY else 0
        if known_idx >= base_idx:
            payload["status"] = known_status
        for field in ["detail", "blockers", "workaround", "recent_wins", "last_output",
                      "cost_to_unblock", "potential_fix", "pending_decisions",
                      "next_milestone", "capabilities", "data_summary", "has_data",
                      "total_outputs", "tools", "output_type", "revenue_model"]:
            if field in known:
                payload[field] = known[field]

    return payload


# ── Cron job rows ─────────────────────────────────────────────────────────────

def build_cron_rows(agent_ids, cron_jobs):
    rows = []
    for cron_name, cron_data in cron_jobs.items():
        # Match to agent
        agent_id = None
        for agent_name, uid in agent_ids.items():
            if agent_name.lower() in cron_name.lower():
                agent_id = uid
                break

        row = {
            "name": cron_name,
            "schedule": cron_data.get("schedule", ""),
            "expected_cadence_minutes": cron_data.get("expected_cadence_minutes", 1440),
            "enabled": True,
        }
        if cron_data.get("last_run_at"):
            row["last_run_at"] = cron_data["last_run_at"]
        if cron_data.get("next_run_at") or cron_data.get("next_expected_at"):
            row["next_expected_at"] = cron_data.get("next_run_at") or cron_data.get("next_expected_at")
        if agent_id:
            row["agent_id"] = agent_id
        rows.append(row)
    return rows


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"[{_now()}] Dashboard heartbeat starting...")

    cron_jobs = load_openclaw_crons()
    known_issues = load_known_issues()
    agents = discover_agents()

    if not agents:
        print("  No agents discovered. Are SOUL.md files present in agents/*/SOUL.md?")
        return

    print(f"  Discovered: {[a['name'] for a in agents]}")

    # Build agent rows
    agent_rows = [
        {"name": a["name"], "emoji": a["emoji"], "purpose": a["purpose"],
         "model": a["model"], "is_active": True}
        for a in agents
    ]

    # Upsert agents, get back IDs
    result = upsert("agents", agent_rows)
    agent_ids = {row["name"]: row["id"] for row in result} if result else {}
    print(f"  Agents synced ({len(agent_ids)})")

    # Update heartbeat payloads
    for agent in agents:
        uid = agent_ids.get(agent["name"])
        if not uid:
            continue
        payload = compute_heartbeat(agent, cron_jobs, known_issues)
        patch("agents", f"id=eq.{uid}",
              {"last_heartbeat_at": _now(), "heartbeat_payload": payload})

        # Log a heartbeat activity event
        insert("agent_activity", [{
            "agent_id": uid,
            "event_type": "log",
            "payload": {
                "message": f"Heartbeat — status: {payload['status']}",
                "status": payload["status"],
            }
        }])
    print(f"  Heartbeats + activity events written")

    # Sync cron jobs
    cron_rows = build_cron_rows(agent_ids, cron_jobs)
    if cron_rows:
        upsert("cron_jobs", cron_rows)
        print(f"  Cron jobs synced ({len(cron_rows)})")

    print(f"  Done!")


if __name__ == "__main__":
    main()
