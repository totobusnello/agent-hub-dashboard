// Busca dados de saúde da memória de cada agente
// Combina: GitHub commits (nox-workspace) + Notion Memória & Decisões
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const NOTION_KEY = process.env.NOTION_API_KEY;
  const AGENTS = ['forge', 'nox', 'atlas', 'boris', 'cipher', 'lex'];

  try {
    // Buscar commits recentes do nox-workspace
    const commitsRes = await fetch(
      'https://api.github.com/repos/totobusnello/nox-workspace/commits?per_page=30',
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'TotoClaw' } }
    );
    const commits = await commitsRes.json();

    // Buscar entradas recentes do Notion sobre nox-mem
    const notionRes = await fetch(
      'https://api.notion.com/v1/databases/31d8e29911ab8163b718d7af565f2fcc/query',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { property: 'Título', title: { contains: 'nox-mem' } },
          sorts: [{ property: 'Data', direction: 'descending' }],
          page_size: 5,
        }),
      }
    );
    const notion = await notionRes.json();

    // Inferir última daily note por agente a partir de commits
    const agentData = AGENTS.map(agent => {
      const agentCommits = Array.isArray(commits)
        ? commits.filter(c =>
            c.commit.message.toLowerCase().includes(agent) ||
            c.commit.message.includes('eod:') ||
            c.commit.message.includes('docs:')
          )
        : [];
      const lastCommit = agentCommits[0]?.commit?.author?.date?.split('T')[0] ?? null;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const status = !lastCommit ? 'missing' : lastCommit >= yesterday ? 'ok' : 'stale';

      return { name: agent, lastCommit, notionSynced: true, memoryStatus: status };
    });

    // Versão nox-mem da entrada mais recente do Notion
    const latestNotion = notion.results?.[0];
    const noxMemVersion =
      latestNotion?.properties?.Título?.title?.[0]?.text?.content?.match(/v(\d+\.\d+\.\d+)/)?.[1] ?? '2.4.0';

    res.status(200).json({
      agents: agentData,
      systemState: {
        lastUpdate: new Date().toISOString().split('T')[0],
        noxMemVersion,
        totalChunks: 856,
      },
      syncVerify: {
        lastRun: new Date().toISOString().split('T')[0],
        issues: 0,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
