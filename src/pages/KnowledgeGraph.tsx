import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchKG, fetchKGPath, KGEntity, KGRelation } from "@/lib/nox-api";
// Layout provided by ProtectedRoute in App.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitBranch, Search, ArrowRight } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  person: "#60a5fa",
  project: "#34d399",
  agent: "#a78bfa",
  tool: "#fb923c",
  concept: "#9ca3af",
  organization: "#fbbf24",
};

const TYPE_BADGE: Record<string, string> = {
  person: "bg-blue-500/20 text-blue-300",
  project: "bg-green-500/20 text-green-300",
  agent: "bg-violet-500/20 text-violet-300",
  tool: "bg-orange-500/20 text-orange-300",
  concept: "bg-gray-500/20 text-gray-300",
  organization: "bg-yellow-500/20 text-yellow-300",
};

interface Node {
  id: number;
  name: string;
  type: string;
  mentions: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function ForceGraph({ entities, relations, highlightPath }: {
  entities: KGEntity[];
  relations: KGRelation[];
  highlightPath: Set<string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const top50 = entities.slice(0, 50);
    const W = 800, H = 500;
    nodesRef.current = top50.map((e, i) => ({
      ...e,
      x: W / 2 + Math.cos(i * 0.5) * (150 + Math.random() * 100),
      y: H / 2 + Math.sin(i * 0.5) * (120 + Math.random() * 80),
      vx: 0, vy: 0,
    }));

    const nodeMap = new Map(nodesRef.current.map(n => [n.name, n]));
    const edges = relations.filter(r => nodeMap.has(r.source) && nodeMap.has(r.target));

    function tick() {
      const nodes = nodesRef.current;
      const centerX = W / 2, centerY = H / 2;

      for (const n of nodes) {
        n.vx += (centerX - n.x) * 0.001;
        n.vy += (centerY - n.y) * 0.001;
        for (const o of nodes) {
          if (n === o) continue;
          const dx = n.x - o.x, dy = n.y - o.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 800 / (dist * dist);
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
      }

      for (const e of edges) {
        const s = nodeMap.get(e.source), t = nodeMap.get(e.target);
        if (!s || !t) continue;
        const dx = t.x - s.x, dy = t.y - s.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - 120) * 0.005;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
        t.vx -= (dx / dist) * force;
        t.vy -= (dy / dist) * force;
      }

      for (const n of nodes) {
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x = Math.max(30, Math.min(W - 30, n.x + n.vx));
        n.y = Math.max(30, Math.min(H - 30, n.y + n.vy));
      }

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      for (const e of edges) {
        const s = nodeMap.get(e.source), t = nodeMap.get(e.target);
        if (!s || !t) continue;
        const isHighlighted = highlightPath.has(s.name) && highlightPath.has(t.name);
        const isSelected = selected && (s.name === selected || t.name === selected);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = isHighlighted ? "#f59e0b" : isSelected ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.08)";
        ctx.lineWidth = isHighlighted ? 2.5 : isSelected ? 1.5 : 0.5;
        ctx.stroke();
      }

      for (const n of nodes) {
        const r = Math.max(4, Math.min(20, Math.sqrt(n.mentions) * 2));
        const isHighlighted = highlightPath.has(n.name);
        const isSelected2 = n.name === selected;
        const color = TYPE_COLORS[n.type] || "#9ca3af";

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHighlighted || isSelected2 ? color : color + "80";
        ctx.fill();

        if (isHighlighted || isSelected2) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        if (r > 6 || isHighlighted || isSelected2) {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(n.name, n.x, n.y - r - 4);
        }
      }

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [entities, relations, selected, highlightPath]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const clicked = nodesRef.current.find(n => {
      const r = Math.max(4, Math.min(20, Math.sqrt(n.mentions) * 2));
      return Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2) < r + 5;
    });
    setSelected(clicked ? clicked.name : null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const hovered = nodesRef.current.find(n => {
      const r = Math.max(4, Math.min(20, Math.sqrt(n.mentions) * 2));
      return Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2) < r + 5;
    });
    setTooltip(hovered ? { x: e.clientX - rect.left, y: e.clientY - rect.top - 30, text: `${hovered.name} (${hovered.type}) — ${hovered.mentions} mentions` } : null);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full rounded-lg bg-black/30 border border-white/5 cursor-crosshair"
        style={{ maxHeight: 500 }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />
      {tooltip && (
        <div className="absolute pointer-events-none px-2 py-1 rounded bg-black/80 text-xs font-mono border border-white/10" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeGraphPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["nox-kg"],
    queryFn: fetchKG,
    refetchInterval: 60000,
  });

  const [pathFrom, setPathFrom] = useState("");
  const [pathTo, setPathTo] = useState("");
  const [pathResult, setPathResult] = useState<Array<{ entity: string; relation: string }> | null>(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const highlightPath = new Set(pathResult?.map(p => p.entity) || []);

  async function findPathHandler() {
    if (!pathFrom || !pathTo) return;
    setPathLoading(true);
    try {
      const result = await fetchKGPath(pathFrom, pathTo);
      setPathResult(result.path);
    } catch { setPathResult(null); }
    setPathLoading(false);
  }

  const filteredEntities = data?.entities.filter(e => !typeFilter || e.type === typeFilter) || [];
  const types = [...new Set(data?.entities.map(e => e.type) || [])];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <GitBranch className="h-6 w-6 text-green-400" />
          <h1 className="text-2xl font-bold">Knowledge Graph</h1>
          {data && (
            <Badge variant="outline" className="ml-auto font-mono text-xs">
              {data.entities.length} entities · {data.relations.length} relations
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading knowledge graph...</div>
          </div>
        ) : data && (
          <>
            <ForceGraph entities={data.entities} relations={data.relations} highlightPath={highlightPath} />

            {/* Path Finder */}
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="h-4 w-4" /> Path Finder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <Input placeholder="From entity..." value={pathFrom} onChange={e => setPathFrom(e.target.value)} className="bg-white/5 border-white/10" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input placeholder="To entity..." value={pathTo} onChange={e => setPathTo(e.target.value)} className="bg-white/5 border-white/10" />
                  <Button onClick={findPathHandler} disabled={pathLoading} size="sm" variant="outline">
                    {pathLoading ? "..." : "Find"}
                  </Button>
                </div>
                {pathResult && (
                  <div className="mt-3 font-mono text-sm space-y-1">
                    {pathResult.map((step, i) => (
                      <span key={i}>
                        {i > 0 && <span className="text-amber-400"> —[{step.relation}]→ </span>}
                        <span className="text-white font-medium">{step.entity}</span>
                      </span>
                    ))}
                  </div>
                )}
                {pathResult === null && pathFrom && pathTo && !pathLoading && (
                  <p className="mt-2 text-xs text-muted-foreground">No path found.</p>
                )}
              </CardContent>
            </Card>

            {/* Entity List */}
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-sm">Entities</CardTitle>
                  <div className="flex gap-1 ml-auto">
                    <Badge variant={typeFilter === null ? "default" : "outline"} className="cursor-pointer text-[10px]" onClick={() => setTypeFilter(null)}>
                      all
                    </Badge>
                    {types.map(t => (
                      <Badge key={t} variant={typeFilter === t ? "default" : "outline"} className={`cursor-pointer text-[10px] ${typeFilter === t ? "" : TYPE_BADGE[t] || ""}`} onClick={() => setTypeFilter(typeFilter === t ? null : t)}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {filteredEntities.slice(0, 60).map(e => (
                    <div key={e.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[e.type] }} />
                      <span className="text-sm truncate">{e.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto font-mono">{e.mentions}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
