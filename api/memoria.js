const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DB_MEMORIA = "31d8e29911ab8163b718d7af565f2fcc";

function extractText(prop) {
  if (!prop) return null;
  if (prop.type === "title") return prop.title?.map(t => t.plain_text).join("") || null;
  if (prop.type === "rich_text") return prop.rich_text?.map(t => t.plain_text).join("") || null;
  if (prop.type === "select") return prop.select?.name || null;
  if (prop.type === "date") return prop.date?.start || null;
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");

  if (!NOTION_API_KEY) return res.status(500).json({ error: "NOTION_API_KEY not set" });

  try {
    const body = {
      page_size: 100,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    };

    const r = await fetch(`https://api.notion.com/v1/databases/${DB_MEMORIA}/query`, {
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

    const entries = data.results.map(page => {
      const p = page.properties;
      return {
        id: page.id,
        titulo: extractText(p.Título) || "(sem título)",
        categoria: extractText(p.Categoria),
        conteudo: extractText(p.Conteúdo),
        fonte: extractText(p.Fonte),
        data: extractText(p.Data),
        url: page.url,
        updatedAt: page.last_edited_time,
      };
    });

    res.status(200).json({ entries, total: entries.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
