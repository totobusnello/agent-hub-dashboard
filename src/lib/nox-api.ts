const NOX_API = import.meta.env.VITE_NOX_API_URL || "http://100.87.8.44:18800";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${NOX_API}${path}`);
  if (!res.ok) throw new Error(`nox-api ${path}: ${res.status}`);
  return res.json();
}

export interface NoxHealth {
  chunks: { total: number; types: Array<{ chunk_type: string; c: number }> };
  consolidation: { done: number; failed: number; last: string | null };
  vectorCoverage: { embedded: number; total: number };
  knowledgeGraph: { entities: number; relations: number };
  services: Record<string, boolean>;
  dbSizeMB: number;
}

export interface AgentProfile {
  agent: string;
  totalChunks: number;
  topTypes: Array<{ type: string; count: number }>;
  topTopics: string[];
  lastActivity: string | null;
  uniqueStrength: string;
}

export interface KGEntity {
  id: number;
  name: string;
  type: string;
  mentions: number;
}

export interface KGRelation {
  source: string;
  relation: string;
  target: string;
  confidence: number;
}

export interface SearchResult {
  score: number;
  source_file: string;
  chunk_type: string;
  chunk_text: string;
  source_date: string | null;
  match_type: string;
}

export interface CrossEntity {
  name: string;
  type: string;
  agents: string[];
  totalMentions: number;
}

export const fetchHealth = () => fetchJSON<NoxHealth>("/api/health");
export const fetchAgents = () => fetchJSON<AgentProfile[]>("/api/agents");
export const fetchKG = () => fetchJSON<{ entities: KGEntity[]; relations: KGRelation[] }>("/api/kg");
export const fetchCrossKG = () => fetchJSON<{ entities: CrossEntity[]; totalRelations: number }>("/api/cross-kg");
export const fetchSearch = (q: string, limit = 10) => fetchJSON<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`);
export const fetchKGPath = (from: string, to: string) => fetchJSON<{ path: Array<{ entity: string; relation: string }> | null }>(`/api/kg/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
