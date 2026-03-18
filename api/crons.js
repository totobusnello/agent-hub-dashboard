const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DB_HEALTH = "31d8e29911ab81e4b63bcc562eca5965";

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
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  if (!NOTION_API_KEY) return res.status(500).json({ error: "NOTION_API_KEY not set" });

  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${DB_HEALTH}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ property: "Serviço", direction: "ascending" }],
      }),
    });

    const data = await r.json();
    if (!data.results) return res.status(500).json({ error: data.message || "Notion error" });

    const services = data.results.map(page => {
      const p = page.properties;
      const status = extractText(p.Status) || "";
      const isHealthy = status.includes("✅") || status === "OK" || status === "Ativo";
      const isDegraded = status.includes("⚠️") || status === "Atenção";
      const isDown = status.includes("🔴") || status === "Erro" || status === "Fora";

      return {
        id: page.id,
        servico: extractText(p.Serviço) || "(sem nome)",
        status,
        statusClass: isDown ? "error" : isDegraded ? "warning" : isHealthy ? "ok" : "unknown",
        detalhes: extractText(p.Detalhes),
        ultimoCheck: extractText(p["Último check"]),
        url: page.url,
      };
    });

    const summary = {
      ok: services.filter(s => s.statusClass === "ok").length,
      warning: services.filter(s => s.statusClass === "warning").length,
      error: services.filter(s => s.statusClass === "error").length,
      unknown: services.filter(s => s.statusClass === "unknown").length,
    };

    res.status(200).json({ services, summary, total: services.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
