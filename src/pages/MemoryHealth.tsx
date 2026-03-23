import { useQuery } from "@tanstack/react-query";
import { fetchHealth, fetchAgents, NoxHealth, AgentProfile } from "@/lib/nox-api";
// Layout provided by ProtectedRoute in App.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Database, Activity, Server, Cpu, Search, GitBranch } from "lucide-react";

function ServiceDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${active ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]"}`} />
  );
}

function StatCard({ title, value, subtitle, icon: Icon }: { title: string; value: string | number; subtitle?: string; icon: React.ElementType }) {
  return (
    <Card className="glass border-white/10">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  );
}

function VectorBar({ embedded, total }: { embedded: number; total: number }) {
  const pct = total > 0 ? Math.round((embedded / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Vector Coverage</span>
        <span className="font-mono">{embedded}/{total} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  team: "bg-blue-500/20 text-blue-300",
  daily: "bg-green-500/20 text-green-300",
  other: "bg-gray-500/20 text-gray-300",
  decision: "bg-amber-500/20 text-amber-300",
  lesson: "bg-purple-500/20 text-purple-300",
  project: "bg-cyan-500/20 text-cyan-300",
  pending: "bg-orange-500/20 text-orange-300",
  person: "bg-pink-500/20 text-pink-300",
  feedback: "bg-teal-500/20 text-teal-300",
  digest: "bg-indigo-500/20 text-indigo-300",
};

export default function MemoryHealth() {
  const { data: health, isLoading } = useQuery<NoxHealth>({
    queryKey: ["nox-health"],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  });

  const { data: agents } = useQuery<AgentProfile[]>({
    queryKey: ["nox-agents"],
    queryFn: fetchAgents,
    refetchInterval: 60000,
  });

  if (isLoading || !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading memory health...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-violet-400" />
          <h1 className="text-2xl font-bold">Memory Health</h1>
          <Badge variant="outline" className="ml-auto font-mono text-xs">
            nox-mem v3.0.0
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Chunks" value={health.chunks.total} icon={Database} />
          <StatCard title="DB Size" value={`${health.dbSizeMB} MB`} icon={Cpu} />
          <StatCard title="KG Entities" value={health.knowledgeGraph.entities} subtitle={`${health.knowledgeGraph.relations} relations`} icon={GitBranch} />
          <StatCard title="Consolidation" value={health.consolidation.done} subtitle={health.consolidation.failed > 0 ? `${health.consolidation.failed} failed` : "0 failed"} icon={Activity} />
        </div>

        {/* Vector + Services Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4" /> Hybrid Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <VectorBar embedded={health.vectorCoverage.embedded} total={health.vectorCoverage.total} />
              <p className="text-xs text-muted-foreground">
                FTS5 BM25 + Gemini embeddings (3072d) + RRF ranking
              </p>
              <p className="text-xs text-muted-foreground">
                Last consolidation: {health.consolidation.last || "never"}
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="h-4 w-4" /> Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(health.services).map(([name, active]) => (
                  <div key={name} className="flex items-center gap-2">
                    <ServiceDot active={active} />
                    <span className="text-sm font-mono">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chunk Types */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Chunk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {health.chunks.types.map(t => (
                <Badge key={t.chunk_type} className={TYPE_COLORS[t.chunk_type] || "bg-gray-500/20 text-gray-300"}>
                  {t.chunk_type}: {t.c}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Breakdown */}
        {agents && agents.length > 0 && (
          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Agent Memory Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-white/5">
                      <th className="text-left py-2 pr-4">Agent</th>
                      <th className="text-right py-2 pr-4">Chunks</th>
                      <th className="text-left py-2 pr-4">Strength</th>
                      <th className="text-left py-2 pr-4">Top Types</th>
                      <th className="text-right py-2">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(a => (
                      <tr key={a.agent} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 pr-4 font-mono font-medium">{a.agent}</td>
                        <td className="py-2 pr-4 text-right font-mono">{a.totalChunks}</td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{a.uniqueStrength}</td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-1">
                            {a.topTypes.slice(0, 3).map(t => (
                              <Badge key={t.type} variant="outline" className="text-[10px] py-0">
                                {t.type}:{t.count}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono text-xs text-muted-foreground">
                          {a.lastActivity || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
