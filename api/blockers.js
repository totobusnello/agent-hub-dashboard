const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DB_TAREFAS = "31d8e29911ab81c88379fed013991e7e";

function extractText(prop) {
  if (!prop) return null;
  if (prop.type === "title") return prop.title?.map(t => t.plain_text).join("") || null;
  if (prop.type === "rich_text") return prop.rich_text?.map(t => t.plain_text).join("") || null;
  if (prop.type === "select") return prop.select?.name || null;
  if (prop.type === "date") return prop.date?.start || null;
  return null;
}

const PRIORITY_MAP = {
  "🔴 Alta": 1, "Alta": 1,
  "🟡 Média": 2, "Média": 2,
  "🔵 Baixa": 3, "Baixa": 3,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  if (!NOTION_API_KEY) return res.status(500).json({ error: "NOTION_API_KEY not set" });

  try {
    // Buscar tarefas "Aguardando Toto" + "Aguardando input"
    const body = {
      page_size: 50,
      sorts: [{ property: "Prioridade", direction: "ascending" }],
      filter: {
        or: [
          { property: "Status", select: { equals: "Aguardando Toto" } },
          { property: "Status", select: { equals: "Aguardando input" } },
          { property: "Status", select: { equals: "Pausado" } },
        ]
      }
    };

    const r = await fetch(`https://api.notion.com/v1/databases/${DB_TAREFAS}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    if (!data.results) return res.status(500).json({ error: data.message || "Notion error" });

    const tasks = data.results.map(page => {
      const p = page.properties;
      const rawStatus = extractText(p.Status);
      const rawPriority = extractText(p.Prioridade);
      return {
        id: page.id,
        title: extractText(p.Tarefa) || "(sem título)",
        status: rawStatus,
        priority: PRIORITY_MAP[rawPriority] || 99,
        rawPriority,
        para: extractText(p.Para),   // agente que criou o blocker
        de: extractText(p.De),
        projeto: extractText(p.Projeto),
        prazo: extractText(p.Prazo),
        url: page.url,
        updatedAt: page.last_edited_time,
      };
    });

    tasks.sort((a, b) => a.priority - b.priority);

    res.status(200).json({
      tasks,
      total: tasks.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
