const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const REPOS = [
  "totobusnello/nox-workspace",
  "totobusnello/agent-hub-dashboard",
];

async function getCommits(repo) {
  const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!r.ok) return [];
  const data = await r.json();
  return data.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    author: c.commit.author.name,
    date: c.commit.author.date,
    url: c.html_url,
    repo,
  }));
}

async function getVercelDeploys() {
  if (!VERCEL_TOKEN) return [];
  const r = await fetch(
    "https://api.vercel.com/v6/deployments?projectId=prj_6ibydZQhaeokendHo9OpslVjAwIR&limit=5",
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  if (!r.ok) return [];
  const data = await r.json();
  return (data.deployments || []).map((d) => ({
    id: d.uid,
    url: `https://${d.url}`,
    state: d.state,
    createdAt: new Date(d.createdAt).toISOString(),
    name: d.name,
  }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");

  try {
    const [commitsArrays, deploys] = await Promise.all([
      Promise.all(REPOS.map(getCommits)),
      getVercelDeploys(),
    ]);

    // Mesclar commits de todos os repos ordenados por data
    const commits = commitsArrays
      .flat()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);

    res.status(200).json({
      commits,
      deploys,
      repos: REPOS,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
