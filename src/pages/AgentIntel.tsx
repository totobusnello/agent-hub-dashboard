import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents, fetchCrossKG, fetchSearch, AgentProfile, CrossEntity, SearchResult } from "@/lib/nox-api";
// Layout provided by ProtectedRoute in App.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Users, Search, Zap } from "lucide-react";

const AGENT_COLORS: Record<string, string> = {
  nox: "from-violet-600 to-violet-400",
  atlas: "from-blue-600 to-blue-400",
  boris: "from-green-600 to-green-400",
  cipher: "from-amber-600 to-amber-400",
  forge: "from-red-600 to-red-400",
  lex: "from-cyan-600 to-cyan-400",
};

function AgentCard({ profile }: { profile: AgentProfile }) {
  const total = profile.topTypes.reduce((s, t) => s + t.count, 0);
  return (
    <Card className="glass border-white/10 hover:border-white/20 transition-colors">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${AGENT_COLORS[profile.agent] || "from-gray-600 to-gray-400"} flex items-center justify-center text-white text-xs font-bold`}>
              {profile.agent[0].toUpperCase()}
            </div>
            <div>
              <p className="font-mono font-medium">{profile.agent}</p>
              <p className="text-[10px] text-muted-foreground">{profile.totalChunks} chunks</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {profile.lastActivity || "—"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" />
          <p className="text-xs text-muted-foreground">{profile.uniqueStrength}</p>
        </div>

        {/* Type bar */}
        <div className="h-2 rounded-full overflow-hidden flex bg-white/5">
          {profile.topTypes.map(t => {
            const pct = total > 0 ? (t.count / total) * 100 : 0;
            const colors: Record<string, string> = {
              team: "bg-blue-500", daily: "bg-green-500", other: "bg-gray-500",
              decision: "bg-amber-500", lesson: "bg-purple-500", project: "bg-cyan-500",
              pending: "bg-orange-500",
            };
            return (
              <div key={t.type} className={`${colors[t.type] || "bg-gray-500"} transition-all`} style={{ width: `${pct}%` }} title={`${t.type}: ${t.count}`} />
            );
          })}
        </div>
        <div className="flex gap-1 flex-wrap">
          {profile.topTypes.slice(0, 4).map(t => (
            <span key={t.type} className="text-[10px] text-muted-foreground">{t.type}:{t.count}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SearchSection() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await fetchSearch(query, 8);
      setResults(r);
    } catch { setResults([]); }
    setLoading(false);
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="h-4 w-4" /> Hybrid Memory Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search across all memory..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="bg-white/5 border-white/10"
          />
          <button onClick={handleSearch} disabled={loading} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
            {loading ? "..." : "Search"}
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px] py-0">{r.match_type}</Badge>
                  <span className="font-mono text-muted-foreground">{r.source_file}</span>
                  <span className="ml-auto text-muted-foreground">{r.score}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {r.chunk_text.substring(0, 200)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AgentIntel() {
  const { data: agents } = useQuery<AgentProfile[]>({
    queryKey: ["nox-agents"],
    queryFn: fetchAgents,
    refetchInterval: 60000,
  });

  const { data: crossKG } = useQuery({
    queryKey: ["nox-cross-kg"],
    queryFn: fetchCrossKG,
    refetchInterval: 120000,
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-amber-400" />
          <h1 className="text-2xl font-bold">Agent Intelligence</h1>
        </div>

        {/* Agent Cards */}
        {agents && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(a => <AgentCard key={a.agent} profile={a} />)}
          </div>
        )}

        {/* Search */}
        <SearchSection />

        {/* Cross-Agent Knowledge */}
        {crossKG && crossKG.entities.length > 0 && (
          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Cross-Agent Knowledge
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {crossKG.entities.length} entities · {crossKG.totalRelations} relations
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {crossKG.entities.slice(0, 20).map((e: CrossEntity, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-1 px-2 rounded hover:bg-white/5">
                    <span className="font-mono text-sm font-medium w-40 truncate">{e.name}</span>
                    <Badge variant="outline" className="text-[10px] py-0">{e.type}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{e.totalMentions} mentions</span>
                    <div className="flex gap-1 ml-auto">
                      {e.agents.map(a => (
                        <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground font-mono">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
