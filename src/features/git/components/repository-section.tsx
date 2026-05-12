import { FolderGit2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useGitRepository } from "../hooks/use-git-repository";
import { useGitStore } from "../store/git-store";

export function RepositorySection() {
  const { chooseFolder, openFromRecent, reloadRecent } = useGitRepository();
  const validationError = useGitStore((s) => s.validationError);
  const errorCode = useGitStore((s) => s.errorCode);
  const recentRepos = useGitStore((s) => s.recentRepos);
  const repositoryPath = useGitStore((s) => s.repositoryPath);

  return (
    <section
      aria-labelledby="repo-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
    >
      <h2
        id="repo-heading"
        className="text-sm font-semibold text-foreground"
      >
        Repositório
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void chooseFolder()}>
          <FolderGit2 className="size-4" aria-hidden />
          Escolher pasta
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-muted-foreground"
          onClick={() => void reloadRecent()}
        >
          Atualizar recentes
        </Button>
      </div>
      {repositoryPath ? (
        <p className="break-all text-xs text-muted-foreground">
          Aberto:{" "}
          <span className="font-medium text-foreground">{repositoryPath}</span>
        </p>
      ) : null}
      {validationError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          data-error-code={errorCode ?? ""}
        >
          {validationError}
        </div>
      ) : null}
      {recentRepos.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recentes
          </p>
          <ul className="flex flex-col gap-1">
            {recentRepos.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  className="w-full rounded-md border border-border bg-muted/40 px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                  onClick={() => void openFromRecent(p)}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhum repositório recente. Abra uma pasta Git válida para preencher a
          lista.
        </p>
      )}
    </section>
  );
}
