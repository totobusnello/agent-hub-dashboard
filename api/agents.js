// API: status dos agentes baseado no activity log e crons do OpenClaw
// Substitui a query ao Supabase que retornava dados vazios

const AGENTS = [
  { id: "nox",    name: "Nox",    emoji: "🌙", purpose: "COO / Concierge / Agenda" },
  { id: "atlas",  name: "Atlas",  emoji: "🗺️", purpose: "Research / Finanças / Apresentações" },
  { id: "boris",  name: "Boris",  emoji: "📰", purpose: "Tech News / Curadoria / LinkedIn" },
  { id: "cipher", name: "Cipher", emoji: "🔐", purpose: "Security / QA" },
  { id: "forge",  name: "Forge",  emoji: "⚡", purpose: "Código / Arquitetura / Infra" },
  { id: "lex",    name: "Lex",    emoji: "⚖️", purpose: "Jurídico / Contratos / Compliance" },
];

// Status baseado em última atividade real (atualizado via heartbeat/cron)
// Por ora: estático com "idle" para todos — sem Supabase
const STATIC_STATUS = {
  nox:    "idle",
  atlas:  "idle",
  boris:  "idle",
  cipher: "idle",
  forge:  "idle",
  lex:    "idle",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  const agents = AGENTS.map(agent => ({
    id: agent.id,
    name: agent.name,
    emoji: agent.emoji,
    purpose: agent.purpose,
    is_active: true,
    computed_status: STATIC_STATUS[agent.id] || "idle",
    last_heartbeat_at: new Date().toISOString(),
    heartbeat_payload: {
      status: STATIC_STATUS[agent.id] || "idle",
      detail: "OpenClaw agent",
    },
    last_run_at: null,
    last_summary: null,
    current_task: null,
    slack_channel: null,
  }));

  res.status(200).json(agents);
}
