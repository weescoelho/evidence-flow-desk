import { useEffect, useState } from "react";

import { getRepositoryScopeSummary } from "../api/git.commands";
import { parseGitCommandError } from "../api/parse-git-error";
import type { RepositoryScopeSummary } from "../types/git";
import { useGitStore } from "../store/git-store";

function formatCommitDate(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ScopeSummary() {
  const headingId = "scope-summary-heading";
  const repositoryPath = useGitStore((s) => s.repositoryPath);
  const baseBranch = useGitStore((s) => s.baseBranch);
  const compareBranch = useGitStore((s) => s.compareBranch);
  const setBaseBranch = useGitStore((s) => s.setBaseBranch);
  const setCompareBranch = useGitStore((s) => s.setCompareBranch);

  const [data, setData] = useState<RepositoryScopeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sameBranch =
    baseBranch &&
    compareBranch &&
    baseBranch.length > 0 &&
    baseBranch === compareBranch;

  useEffect(() => {
    if (
      !repositoryPath ||
      !baseBranch ||
      !compareBranch ||
      sameBranch
    ) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getRepositoryScopeSummary(repositoryPath, baseBranch, compareBranch)
      .then((summary) => {
        if (!cancelled) {
          setData(summary);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          const ge = parseGitCommandError(e);
          setData(null);
          setError(
            ge?.message ??
              (e instanceof Error ? e.message : "Falha ao carregar o escopo."),
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repositoryPath, baseBranch, compareBranch, sameBranch]);

  if (!repositoryPath) {
    return null;
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
    >
      <h2
        id={headingId}
        className="text-sm font-semibold text-foreground"
      >
        Escopo (base → compare)
      </h2>
      {sameBranch ? (
        <p className="text-xs text-muted-foreground">
          Escolha duas refs Git distintas (branches, tags ou commits) para ver
          commits e alterações cumulativas (do ancestral comum até a ref de
          comparação).
        </p>
      ) : null}
      {loading ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Carregando análise…
        </p>
      ) : null}
      {error ? (
        <p
          className="text-xs text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      ) : null}
      {data && !sameBranch && !loading && !error ? (
        <div className="flex flex-col gap-6">
          {data.commitsTruncated ? (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Lista de commits truncada (limite de segurança). Refine o escopo
              nas próximas versões.
            </p>
          ) : null}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Commits ({data.commits.length})
            </h3>
            {data.commits.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum commit entre as refs selecionadas.
              </p>
            ) : (
              <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto text-xs">
                {data.commits.map((c) => (
                  <li
                    key={c.hash}
                    className="rounded-md border border-border bg-background px-2 py-1.5"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-mono text-[11px] text-primary">
                        {c.shortHash}
                      </span>
                      {c.conventionalType ? (
                        <span className="rounded bg-muted px-1 py-0 font-mono text-[10px] text-foreground">
                          {c.conventionalType}
                        </span>
                      ) : null}
                      <span className="text-[11px] text-muted-foreground">
                        {formatCommitDate(c.committedAtUnix)} · {c.authorName}
                      </span>
                      <div className="ml-auto flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                          onClick={() => setBaseBranch(c.hash)}
                        >
                          Usar como base
                        </button>
                        <button
                          type="button"
                          className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                          onClick={() => setCompareBranch(c.hash)}
                        >
                          Usar como comparar
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-foreground">
                      {c.summary}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Arquivos ({data.files.length})
            </h3>
            {data.files.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma alteração de arquivo no intervalo.
              </p>
            ) : (
              <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto font-mono text-[11px]">
                {data.files.map((f) => (
                  <li
                    key={`${f.path}-${f.status}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-1 last:border-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {f.path}
                      {f.status === "renamed" &&
                      f.pathBefore &&
                      f.pathAfter &&
                      f.pathBefore !== f.pathAfter ? (
                        <span className="ml-1 text-muted-foreground">
                          ← {f.pathBefore}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {f.status}
                      {f.linesAdded + f.linesRemoved > 0
                        ? ` · +${f.linesAdded} −${f.linesRemoved}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
