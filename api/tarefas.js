const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DB_TAREFAS = "31d8e29911ab81c88379fed013991e7e";

// Status espelhados do Notion — sem remapeamento
const DONE_STATUSES = new Set(["Concluída", "Concluído", "Cancelada"]);

const PRIORITY_MAP = {
  "🔴 Alta": 1, "Alta": 1,
  "🟡 Média": 2, "Média": 2,
  "🔵 Baixa": 3, "Baixa": 3,
};

function extractText(prop) {
  if (!prop) return null;
  if (prop.type === "title") return prop.title?.map(t => t.plain_text).join("") || null;
  if (prop.type === "rich_text") return prop.rich_text?.map(t => t.plain_text).join("") || null;
  if (prop.type === "select") return prop.select?.name || null;
  if (prop.type === "date") return prop.date?.start || null;
  return null;
}

async function queryNotion(cursor = null) {
  const body = {
    page_size: 100,
    sorts: [{ property: "Prioridade", direction: "ascending" }],
    filter: {
      property: "Status",
      select: { does_not_equal: "Cancelada" }
    }
  };
  if (cursor) body.start_cursor = cursor;

  const res = await fetch(`https://api.notion.com/v1/databases/${DB_TAREFAS}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  if (!NOTION_API_KEY) return res.status(500).json({ error: "NOTION_API_KEY not set" });

  try {
    let allResults = [];
    let cursor = null;
    do {
      const data = await queryNotion(cursor);
      if (data.results) allResults = allResults.concat(data.results);
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);

    const tasks = allResults.map(page => {
      const p = page.properties;
      const rawStatus = extractText(p.Status);
      const rawPriority = extractText(p.Prioridade);
      return {
        id: page.id,
        title: extractText(p.Tarefa) || "(sem título)",
        status: rawStatus || "Pendente",  // campo status = rawStatus (sem remapeamento)
        rawStatus: rawStatus || "Pendente",
        priority: PRIORITY_MAP[rawPriority] || 99,
        rawPriority,
        para: extractText(p.Para),
        de: extractText(p.De),
        projeto: extractText(p.Projeto),
        prazo: extractText(p.Prazo),
        url: page.url,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
      };
    });

    tasks.sort((a, b) => a.priority - b.priority);
    res.status(200).json({ tasks, total: tasks.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
