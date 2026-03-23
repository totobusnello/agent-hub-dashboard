import { useQuery } from "@tanstack/react-query";
import { fetchHealth, fetchAgents, fetchKG, fetchCrossKG, NoxHealth, AgentProfile, KGEntity, KGRelation, CrossEntity } from "@/lib/nox-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from "recharts";
import { Brain, Database, Activity, Server, GitBranch, Sparkles, Clock, Shield, Zap, FileText } from "lucide-react";

const COLORS = {
  violet: "#8b5cf6", cyan: "#06b6d4", green: "#34d399", amber: "#fbbf24",
  blue: "#60a5fa", pink: "#f472b6", red: "#f87171", gray: "#64748b",
  teal: "#2dd4bf", indigo: "#818cf8", orange: "#fb923c",
};

const TYPE_COLORS: Record<string, string> = {
  team: COLORS.blue, daily: COLORS.green, other: COLORS.gray,
  decision: COLORS.amber, lesson: COLORS.violet, project: COLORS.cyan,
  pending: COLORS.orange, feedback: COLORS.teal, person: COLORS.pink, digest: COLORS.indigo,
};

const KG_TYPE_COLORS: Record<string, string> = {
  project: COLORS.green, tool: COLORS.orange, concept: COLORS.gray,
  person: COLORS.pink, organization: COLORS.amber, agent: COLORS.violet,
  location: COLORS.teal,
};

function Dot({ active }: { active: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${active ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" : "bg-red-400"}`} />;
}

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail?: string; icon: React.ElementType }) {
  return (
    <Card className="glass border-white/10">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold font-mono mt-0.5 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{value}</p>
            {detail && <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>}
          </div>
          <Icon className="h-6 w-6 text-muted-foreground/30" />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ num, title, icon: Icon }: { num: string; title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-4 pb-3 border-b border-white/5">
      <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">{num}</span>
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function ChunkPieChart({ types }: { types: Array<{ chunk_type: string; c: number }> }) {
  const data = types.map(t => ({ name: t.chunk_type, value: t.c }));
  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-2"><CardTitle className="text-sm">Chunk Distribution</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke="none">
              {data.map((entry) => <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || COLORS.gray} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#1a1f35", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, fontSize: 12 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AgentBarChart({ agents }: { agents: AgentProfile[] }) {
  const data = agents.map(a => {
    const row: Record<string, string | number> = { name: a.agent };
    for (const t of a.topTypes) row[t.type] = t.count;
    return row;
  });
  const allTypes = [...new Set(agents.flatMap(a => a.topTypes.map(t => t.type)))];

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-2"><CardTitle className="text-sm">Agent Memory Composition</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#1a1f35", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, fontSize: 12 }} />
            {allTypes.map(t => <Bar key={t} dataKey={t} stackId="a" fill={TYPE_COLORS[t] || COLORS.gray} />)}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function KGTypesChart({ entities }: { entities: KGEntity[] }) {
  const typeCounts = entities.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-2"><CardTitle className="text-sm">Knowledge Graph — Entity Types</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
            <Tooltip contentStyle={{ background: "#1a1f35", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map(entry => <Cell key={entry.name} fill={KG_TYPE_COLORS[entry.name] || COLORS.gray} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AgentRadarChart({ agents }: { agents: AgentProfile[] }) {
  const dims = ["daily", "lesson", "decision", "team", "other"];
  const top3 = agents.sort((a, b) => b.totalChunks - a.totalChunks).slice(0, 3);
  const data = dims.map(dim => {
    const row: Record<string, string | number> = { subject: dim };
    for (const a of top3) {
      row[a.agent] = a.topTypes.find(t => t.type === dim)?.count || 0;
    }
    return row;
  });
  const agentColors = [COLORS.violet, COLORS.green, COLORS.red];

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-2"><CardTitle className="text-sm">Agent Expertise Radar</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            {top3.map((a, i) => (
              <Radar key={a.agent} name={a.agent} dataKey={a.agent}
                stroke={agentColors[i]} fill={agentColors[i]} fillOpacity={0.1} />
            ))}
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const EVOLUTION = [
  { version: "v1.0", date: "Mar 14", chunks: 504, entities: 0, vectorized: 0 },
  { version: "v2.0", date: "Mar 17", chunks: 597, entities: 0, vectorized: 0 },
  { version: "v2.2", date: "Mar 20", chunks: 863, entities: 26, vectorized: 0 },
  { version: "v2.5", date: "Mar 22", chunks: 866, entities: 26, vectorized: 0 },
  { version: "v2.6", date: "Mar 22", chunks: 866, entities: 26, vectorized: 866 },
  { version: "v3.0", date: "Mar 23", chunks: 874, entities: 384, vectorized: 874 },
];

const DECISIONS = [
  { key: "dedup-strategy", v: "v2", desc: "Gemini cosine similarity (0.85 threshold), fallback keyword overlap (>60%)" },
  { key: "fallback-chain", v: "v1", desc: "Paid: Opus→Sonnet→Haiku→GPT-5.1→Gemini. Free: Nemotron→Groq→healers" },
  { key: "kg-ttl-policy", v: "v1", desc: "90-day expiry, -0.1 confidence/30d, prune threshold 0.3" },
  { key: "embedding-model", v: "v1", desc: "Gemini gemini-embedding-001 (3072d) over Ollama nomic-embed-text (768d)" },
  { key: "agent-paths", v: "v1", desc: "Isolated /root/.openclaw/agents/{name}/, OPENCLAW_WORKSPACE env var" },
  { key: "shared-memory-db", v: "v1", desc: "Separate shared-memory.db to avoid lock contention" },
  { key: "dashboard-vercel", v: "v1", desc: "Vercel deploy, zero Supabase for nox-mem data, HTTP API on :18800" },
  { key: "api-keys-policy", v: "v1", desc: "All keys in /root/.openclaw/.env (chmod 600), EnvironmentFile in systemd" },
  { key: "browser-relay", v: "v1", desc: "Chrome Extension → localhost:18792, LaunchAgent SSH tunnel" },
  { key: "memory-sync-schedule", v: "v1", desc: "23h consolidation (5min stagger), Sun 4am vectorize, 6h git backup" },
];

const SERVICES = [
  { name: "openclaw-gateway", desc: ":18789 WebSocket", key: "openclaw-gateway" },
  { name: "nox-mem-watcher", desc: "inotifywait loop", key: "nox-mem-watcher" },
  { name: "nox-mem-api", desc: ":18800 HTTP JSON", key: "nox-mem-api" },
  { name: "ollama", desc: "llama3.2:3b CPU", key: "ollama" },
  { name: "tailscaled", desc: "100.87.8.44", key: "tailscaled" },
];

export default function SystemPaper() {
  const { data: health } = useQuery<NoxHealth>({ queryKey: ["nox-health"], queryFn: fetchHealth, refetchInterval: 60000 });
  const { data: agents } = useQuery<AgentProfile[]>({ queryKey: ["nox-agents"], queryFn: fetchAgents, refetchInterval: 60000 });
  const { data: kg } = useQuery<{ entities: KGEntity[]; relations: KGRelation[] }>({ queryKey: ["nox-kg"], queryFn: fetchKG, refetchInterval: 120000 });
  const { data: crossKg } = useQuery<{ entities: CrossEntity[]; totalRelations: number }>({ queryKey: ["nox-cross-kg"], queryFn: fetchCrossKG, refetchInterval: 120000 });

  const totalAgentChunks = agents?.reduce((s, a) => s + a.totalChunks, 0) || 0;
  const vecPct = health ? Math.round((health.vectorCoverage.embedded / health.vectorCoverage.total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-2">
      {/* Hero */}
      <div className="pt-2 pb-6 border-b border-white/5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 mb-2">Technical Analysis — Live</p>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent leading-tight">
          OpenClaw Memory System
        </h1>
        <p className="text-muted-foreground mt-1">nox-mem v3.0.0 — Architecture, metrics, and intelligence analysis</p>
        <div className="flex gap-4 mt-3 text-[11px] font-mono text-muted-foreground">
          <span>Auto-refresh: 60s</span>
          <span>Author: Toto Busnello</span>
          <span>Platform: OpenClaw</span>
          {health && <Badge variant="outline" className="text-[10px] ml-auto"><Dot active={true} /> <span className="ml-1">LIVE</span></Badge>}
        </div>
      </div>

      {/* 01 Executive Summary */}
      <SectionHeader num="01" title="Executive Summary" icon={FileText} />
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Chunks" value={(health.chunks.total + totalAgentChunks).toLocaleString()} detail={`${health.chunks.total} workspace + ${totalAgentChunks} agents`} icon={Database} />
          <StatCard label="Knowledge Graph" value={health.knowledgeGraph.entities} detail={`${health.knowledgeGraph.relations} relations`} icon={GitBranch} />
          <StatCard label="Vector Coverage" value={`${vecPct}%`} detail={`${health.vectorCoverage.embedded}/${health.vectorCoverage.total}`} icon={Sparkles} />
          <StatCard label="Services" value={`${Object.values(health.services).filter(Boolean).length}/5`} detail="all active" icon={Server} />
        </div>
      )}

      {/* 02 Architecture */}
      <SectionHeader num="02" title="Architecture Overview" icon={Server} />
      <Card className="glass border-white/10">
        <CardContent className="pt-4">
          <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed overflow-x-auto whitespace-pre">{`
  ┌──────────────── HOSTINGER KVM4 VPS (Tailscale 100.87.8.44) ────────────────┐
  │                                                                             │
  │   ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐           │
  │   │  Gateway    │  │  nox-mem API │  │  Ollama  │  │  Watcher │           │
  │   │  :18789 WS  │  │  :18800 HTTP │  │ llama3.2 │  │ inotify  │           │
  │   └─────────────┘  └──────┬───────┘  └────┬─────┘  └──────────┘           │
  │                           │               │                                │
  │              ┌────────────┼───────────────┘                                │
  │              │            │                                                │
  │     ┌────────┴──────┐ ┌──┴────────┐ ┌───────────┐                         │
  │     │  SQLite 25MB  │ │ FTS5 874  │ │sqlite-vec │                         │
  │     │  schema v3    │ │ BM25+boost│ │ 3072d emb │                         │
  │     └───────────────┘ └───────────┘ └───────────┘                         │
  │              │                                                             │
  │     ┌────────┴──────────────────────────────────────┐                      │
  │     │  Knowledge Graph v2 (384 entities, 529 rels)  │                      │
  │     │  Cross-Agent Intelligence (6 agent DBs)       │                      │
  │     └───────────────────────────────────────────────┘                      │
  │                                                                             │
  │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
  │   │ Nox  │ │Boris │ │Forge │ │Atlas │ │Cipher│ │ Lex  │                  │
  │   │ 185  │ │ 148  │ │ 182  │ │  30  │ │  31  │ │  31  │                  │
  │   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
  └─────────────────────────────────────────────────────────────────────────────┘
                              ▼
              Dashboard (Vercel) — React + shadcn/ui`}</pre>
        </CardContent>
      </Card>

      {/* 03 Metrics */}
      <SectionHeader num="03" title="Memory System Metrics" icon={Database} />
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Workspace DB" value={`${health.dbSizeMB} MB`} detail={`${health.chunks.total} chunks`} icon={Database} />
          <StatCard label="Consolidated" value={health.consolidation.done} detail={`${health.consolidation.failed} failed`} icon={Activity} />
          <StatCard label="Cron Jobs" value="24" detail="active schedules" icon={Clock} />
          <StatCard label="Agent DBs" value={totalAgentChunks} detail="chunks across 6 agents" icon={Sparkles} />
        </div>
      )}
      {health && agents && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <ChunkPieChart types={health.chunks.types} />
          <AgentBarChart agents={agents} />
        </div>
      )}
      {agents && (
        <Card className="glass border-white/10 mt-3">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Agent Breakdown</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-[11px] uppercase tracking-wide border-b border-white/5">
                  <th className="text-left py-2">Agent</th><th className="text-left">Role</th><th className="text-right">Chunks</th><th className="text-left pl-4">Strength</th><th className="text-right">Last</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.agent} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="py-1.5 font-mono font-medium">{a.agent}</td>
                    <td className="text-muted-foreground text-xs">{a.uniqueStrength.split("&")[0].trim()}</td>
                    <td className="text-right font-mono">{a.totalChunks}</td>
                    <td className="pl-4"><div className="flex gap-1">{a.topTypes.slice(0, 3).map(t => <Badge key={t.type} variant="outline" className="text-[9px] py-0">{t.type}:{t.count}</Badge>)}</div></td>
                    <td className="text-right font-mono text-xs text-muted-foreground">{a.lastActivity || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 04 Knowledge Graph */}
      <SectionHeader num="04" title="Knowledge Graph v2" icon={GitBranch} />
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Entities" value={health.knowledgeGraph.entities} detail="LLM-extracted" icon={GitBranch} />
          <StatCard label="Relations" value={health.knowledgeGraph.relations} detail="with TTL decay" icon={Activity} />
          <StatCard label="Entity Types" value={kg ? new Set(kg.entities.map(e => e.type)).size : "—"} detail="vs 3 in regex v1" icon={Sparkles} />
          <StatCard label="Growth" value="15x" detail="26→384 entities" icon={Zap} />
        </div>
      )}
      {kg && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <KGTypesChart entities={kg.entities} />
          <Card className="glass border-white/10">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Top Entities</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 max-h-[240px] overflow-y-auto">
              {kg.entities.slice(0, 12).map(e => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: KG_TYPE_COLORS[e.type] || COLORS.gray }} />
                  <span className="text-sm font-mono flex-1 truncate">{e.name}</span>
                  <Badge variant="outline" className="text-[9px] py-0">{e.type}</Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">{e.mentions}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 05 Hybrid Search */}
      <SectionHeader num="05" title="Hybrid Search System" icon={Brain} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="glass border-blue-500/20">
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase tracking-wider text-blue-400 mb-2">Layer 1: FTS5 BM25</p>
            <p className="text-sm text-muted-foreground">Keyword matching with porter+unicode61 tokenizer. Type boost 2x (decision/lesson). Recency boost 1.5x (7d).</p>
          </CardContent>
        </Card>
        <Card className="glass border-violet-500/20">
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase tracking-wider text-violet-400 mb-2">Layer 2: Gemini Semantic</p>
            <p className="text-sm text-muted-foreground">gemini-embedding-001 (3072d). sqlite-vec cosine similarity. Task-typed: RETRIEVAL_QUERY.</p>
          </CardContent>
        </Card>
        <Card className="glass border-cyan-500/20">
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase tracking-wider text-cyan-400 mb-2">Layer 3: RRF Fusion</p>
            <p className="text-sm text-muted-foreground">Reciprocal Rank Fusion (k=60). Content-prefix dedup. Match type attribution.</p>
          </CardContent>
        </Card>
      </div>

      {/* 06 Agent Intelligence */}
      <SectionHeader num="06" title="Agent Intelligence" icon={Sparkles} />
      {agents && <AgentRadarChart agents={agents} />}

      {/* 07 Infrastructure */}
      <SectionHeader num="07" title="Infrastructure & Operations" icon={Shield} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="glass border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Services</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {SERVICES.map(s => (
              <div key={s.name} className="flex items-center gap-2">
                <Dot active={health?.services[s.key] ?? false} />
                <span className="text-sm font-mono">{s.name}</span>
                <span className="text-[11px] text-muted-foreground ml-auto">{s.desc}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cron Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Agent consolidation (6x)</span><span className="font-mono text-xs">23:00-23:25</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Workspace consolidation</span><span className="font-mono text-xs">23:30</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vectorize (Gemini)</span><span className="font-mono text-xs">Sun 04:00</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Health checks</span><span className="font-mono text-xs">*/5 min</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SQLite backup</span><span className="font-mono text-xs">02:00</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Git backup</span><span className="font-mono text-xs">*/6 hours</span></div>
          </CardContent>
        </Card>
      </div>

      {/* 08 Evolution */}
      <SectionHeader num="08" title="Evolution Timeline" icon={Activity} />
      <Card className="glass border-white/10">
        <CardContent className="pt-5">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={EVOLUTION}>
              <XAxis dataKey="version" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1a1f35", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="chunks" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.1} name="Chunks" />
              <Area type="monotone" dataKey="entities" stroke={COLORS.violet} fill={COLORS.violet} fillOpacity={0.1} name="KG Entities" />
              <Area type="monotone" dataKey="vectorized" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.1} name="Vectorized" />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 09 Decisions */}
      <SectionHeader num="09" title="Technical Decisions" icon={FileText} />
      <div className="space-y-2">
        {DECISIONS.map(d => (
          <Card key={d.key} className="glass border-white/10">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-violet-400 font-medium">{d.key}</span>
                <Badge variant="outline" className="text-[9px] py-0">{d.v}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] font-mono text-muted-foreground pt-8 pb-4 border-t border-white/5 mt-8">
        OpenClaw Memory System v3.0.0 — Live Technical Paper — totobusnello/nox-workspace
      </div>
    </div>
  );
}
