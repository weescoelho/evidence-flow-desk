import { FolderSearch } from "lucide-react";

import { cn } from "@/lib/utils";

import { useGitRepository } from "../hooks/use-git-repository";
import { useGitStore } from "../store/git-store";

function pathBasename(repositoryPath: string): string {
  const parts = repositoryPath.split(/[/\\]/).filter(Boolean);
  return parts.length > 0 ? (parts[parts.length - 1] ?? repositoryPath) : repositoryPath;
}

/** Alinhado a `design.pen` (`Hbs1b` › `TCmQ4`) e secção 8 em `docs/UI-COMPONENTS.md`. */
export function RepositorySection() {
  const { chooseFolder, openFromRecent, reloadRecent } = useGitRepository();
  const validationError = useGitStore((s) => s.validationError);
  const errorCode = useGitStore((s) => s.errorCode);
  const recentRepos = useGitStore((s) => s.recentRepos);
  const repositoryPath = useGitStore((s) => s.repositoryPath);
  const headDisplay = useGitStore((s) => s.headDisplay);

  return (
    <section
      aria-labelledby="repo-path-field-label"
      className={cn(
        "flex w-full flex-col gap-[18px] rounded-xl border bg-white p-6 font-mono",
        "border-[#E4E4E7] text-[#18181B]",
      )}
    >
      <p id="repo-path-field-label" className="text-[13px] font-semibold">
        Caminho do repositório
      </p>

      {/* `mBSbh` — pathf + Explorar */}
      <div className="flex w-full items-center gap-3">
        <div
          className={cn(
            "flex h-11 min-w-0 flex-1 items-center rounded-[10px] border px-3.5",
            "border-[#E4E4E7] bg-[#F4F4F5]",
          )}
          aria-live="polite"
        >
          <span
            className={cn(
              "min-w-0 truncate text-[13px]",
              repositoryPath ? "text-[#18181B]" : "text-[#71717A]",
            )}
            title={repositoryPath ?? undefined}
          >
            {repositoryPath ?? "Selecione uma pasta válida através de «Explorar»"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void chooseFolder()}
          className={cn(
            "flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] border px-[18px]",
            "border-[#E4E4E7] bg-[#F4F4F5] text-[13px] font-semibold text-[#18181B]",
            "transition-colors hover:bg-[#ECECEE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35",
          )}
        >
          <FolderSearch size={18} className="shrink-0 text-[#18181B]" aria-hidden />
          Explorar
        </button>
      </div>

      {validationError ? (
        <div
          role="alert"
          className="rounded-[10px] border border-destructive/35 bg-destructive/10 px-3 py-2 text-[12px] text-destructive"
          data-error-code={errorCode ?? ""}
        >
          {validationError}
        </div>
      ) : null}

      {/* `xOmOD` */}
      <div className="flex flex-col gap-2.5">
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-[12px] font-semibold text-[#71717A]">Recentes</span>
          <button
            type="button"
            onClick={() => void reloadRecent()}
            className="text-[11px] font-semibold text-[#71717A] underline underline-offset-2 hover:text-[#18181B]"
          >
            Atualizar
          </button>
        </div>
        {recentRepos.length === 0 ? (
          <p className="text-[11px] text-[#71717A]">
            Nenhum repositório recente. Explore uma pasta Git válida para preencher
            a lista.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recentRepos.map((p) => {
              const isCurrent =
                !!repositoryPath && p === repositoryPath;
              const meta =
                isCurrent && headDisplay
                  ? `Git válido • ${headDisplay}`
                  : "Git válido";
              return (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => void openFromRecent(p)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 rounded-[10px] border border-[#E4E4E7] bg-white px-3.5 py-3 text-left",
                      "transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35",
                    )}
                  >
                    <span
                      className="min-w-0 truncate text-[13px] font-normal text-[#18181B]"
                      title={p}
                    >
                      {pathBasename(p)}
                    </span>
                    <span className="shrink-0 text-[11px] font-normal text-[#71717A]">
                      {meta}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
