import { useNotionQuery } from "@/hooks/useNotionQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, GitCommit, Rocket, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  repo: string;
}

interface Deploy {
  id: string;
  url: string;
  state: string;
  createdAt: string;
  name: string;
}

interface UpdatesResponse {
  commits: Commit[];
  deploys: Deploy[];
  repos: string[];
  updatedAt: string;
}

const REPO_LABELS: Record<string, string> = {
  "totobusnello/nox-workspace": "nox-workspace",
  "totobusnello/agent-hub-dashboard": "dashboard",
};

const REPO_COLORS: Record<string, string> = {
  "totobusnello/nox-workspace": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "totobusnello/agent-hub-dashboard": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const DEPLOY_STATE_COLORS: Record<string, string> = {
  READY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  BUILDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
  INITIALIZING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

function formatCommitMsg(msg: string): string {
  // Remove prefixes like "feat:", "fix:", "docs:" para mostrar só o conteúdo
  return msg.replace(/^(feat|fix|docs|chore|refactor|style|test|build|ci|perf|revert)(\(.+?\))?:\s*/i, "");
}

function getCommitType(msg: string): { label: string; color: string } {
  if (/^feat/i.test(msg)) return { label: "feat", color: "text-cyan-400" };
  if (/^fix/i.test(msg)) return { label: "fix", color: "text-red-400" };
  if (/^docs/i.test(msg)) return { label: "docs", color: "text-yellow-400" };
  if (/^chore/i.test(msg)) return { label: "chore", color: "text-muted-foreground" };
  if (/^refactor/i.test(msg)) return { label: "refactor", color: "text-purple-400" };
  return { label: "update", color: "text-muted-foreground" };
}

const UpdateSistema = () => {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } =
    useNotionQuery<UpdatesResponse>("updates", "updates", 120_000);

  const commits = data?.commits ?? [];
  const deploys = data?.deploys ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Update de Sistema</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Commits recentes e deploys do time
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR") : "—"}
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : isError ? (
        <div className="border border-destructive/30 rounded-lg p-6 text-center text-sm text-destructive">
          Erro ao carregar updates. Verifique GITHUB_TOKEN.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Commits — 2/3 da tela */}
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-cyan-400" />
                  Commits recentes
                  <span className="text-muted-foreground font-normal">({commits.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-0">
                {commits.map((commit) => {
                  const type = getCommitType(commit.message);
                  const msg = formatCommitMsg(commit.message);
                  return (
                    <a
                      key={`${commit.sha}-${commit.date}`}
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors group"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground mt-0.5 w-12 shrink-0">{commit.sha}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-[10px] font-medium", type.color)}>{type.label}</span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0 rounded border",
                            REPO_COLORS[commit.repo] || "bg-muted text-muted-foreground border-border"
                          )}>
                            {REPO_LABELS[commit.repo] || commit.repo}
                          </span>
                        </div>
                        <p className="text-sm leading-tight truncate">{msg}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{commit.author} · {timeAgo(commit.date)}</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </a>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Deploys — 1/3 da tela */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-cyan-400" />
                  Deploys recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deploys.map((deploy) => (
                  <a
                    key={deploy.id}
                    href={deploy.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg border border-border/40 hover:border-border transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                        DEPLOY_STATE_COLORS[deploy.state] || "bg-muted text-muted-foreground border-border"
                      )}>
                        {deploy.state}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{deploy.url.replace("https://", "")}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(deploy.createdAt)}</p>
                  </a>
                ))}
                {deploys.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum deploy recente</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateSistema;
