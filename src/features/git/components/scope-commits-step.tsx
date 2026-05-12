import { ChevronDown, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import type { RepositoryScopeSummaryState } from "../hooks/use-repository-scope-summary";
import type { CommitRow } from "../types/git";
import { useGitStore } from "../store/git-store";
import { BranchRow } from "./branch-list-internals";

type ScopeCommitsStepProps = {
  scope: RepositoryScopeSummaryState;
};

type EscopoModoUi = "branch-diff" | "sha-tag";

/**
 * Passo «Escopo e commits» — alinha a `design.pen` (`ANhm2`, `q7G5y`, `MTuKf`, `m1RW9`, `VB0GU`)
 * e `docs/UI-COMPONENTS.md` §9.
 */
export function ScopeCommitsStep({ scope }: ScopeCommitsStepProps) {
  const baseId = useId();
  const { data, loading, error, sameBranch } = scope;

  const repositoryPath = useGitStore((s) => s.repositoryPath);
  const branches = useGitStore((s) => s.branches);
  const headDisplay = useGitStore((s) => s.headDisplay);
  const detached = useGitStore((s) => s.detached);
  const branchFilter = useGitStore((s) => s.branchFilter);
  const setBranchFilter = useGitStore((s) => s.setBranchFilter);
  const filteredBranchNames = useGitStore((s) => s.filteredBranchNames);
  const baseBranch = useGitStore((s) => s.baseBranch);
  const compareBranch = useGitStore((s) => s.compareBranch);
  const setBaseBranch = useGitStore((s) => s.setBaseBranch);
  const setCompareBranch = useGitStore((s) => s.setCompareBranch);

  const [commitFilter, setCommitFilter] = useState("");
  const [modo, setModo] = useState<EscopoModoUi>("branch-diff");

  const filtered = filteredBranchNames();
  const branchMap = new Map(branches.map((b) => [b.name, b]));

  const filteredCommits = useMemo(() => {
    const commits = data?.commits ?? [];
    const q = commitFilter.trim().toLowerCase();
    if (!q) return commits;
    return commits.filter((c) => matchesCommitSearch(c, q));
  }, [data?.commits, commitFilter]);

  const showBranchPicker = modo === "branch-diff";

  return (
    <section
      aria-label="Escopo e commits no intervalo Git"
      className={cn(
        "flex w-full flex-col gap-[18px] rounded-xl border bg-white p-6 font-mono text-[#18181B]",
        "border-[#E4E4E7]",
      )}
    >
      {/* `PJISO` — refs */}
      {!repositoryPath ? (
        <p className="text-[12px] text-[#71717A]">
          Selecione um repositório no passo anterior para definir base e comparação.
        </p>
      ) : (
        <div className="grid w-full gap-4 md:grid-cols-2 md:gap-8">
          <div className="flex min-w-0 flex-col gap-2">
            <label
              htmlFor={`${baseId}-ref-base`}
              className="text-[12px] font-semibold text-[#71717A]"
            >
              Branch base
            </label>
            <div className="relative">
              <input
                id={`${baseId}-ref-base`}
                type="text"
                data-testid="scope-base-ref"
                value={baseBranch ?? ""}
                onChange={(ev) => {
                  const v = ev.target.value.trim();
                  setBaseBranch(v.length ? v : null);
                }}
                list={`${baseId}-dl-base`}
                placeholder="main, tag ou SHA…"
                autoComplete="off"
                className={cn(
                  "h-[42px] w-full rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5]",
                  "pr-10 pl-3 text-[13px] outline-none placeholder:text-[#71717A]",
                  "focus-visible:ring-2 focus-visible:ring-[#5946DB]/35",
                )}
              />
              <datalist id={`${baseId}-dl-base`}>
                {branches.map((b) => (
                  <option key={b.name} value={b.name} />
                ))}
              </datalist>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-[18px] -translate-y-1/2 text-[#71717A]"
                aria-hidden
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label
              htmlFor={`${baseId}-ref-compare`}
              className="text-[12px] font-semibold text-[#71717A]"
            >
              Branch comparada
            </label>
            <div className="relative">
              <input
                id={`${baseId}-ref-compare`}
                type="text"
                data-testid="scope-compare-ref"
                value={compareBranch ?? ""}
                onChange={(ev) => {
                  const v = ev.target.value.trim();
                  setCompareBranch(v.length ? v : null);
                }}
                list={`${baseId}-dl-compare`}
                placeholder="feature-x, HEAD…"
                autoComplete="off"
                className={cn(
                  "h-[42px] w-full rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5]",
                  "pr-10 pl-3 text-[13px] outline-none placeholder:text-[#71717A]",
                  "focus-visible:ring-2 focus-visible:ring-[#5946DB]/35",
                )}
              />
              <datalist id={`${baseId}-dl-compare`}>
                {branches.map((b) => (
                  <option key={`c-${b.name}`} value={b.name} />
                ))}
              </datalist>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-[18px] -translate-y-1/2 text-[#71717A]"
                aria-hidden
              />
            </div>
          </div>
        </div>
      )}

      {/* `MTuKf` */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Modo de escopo">
        <button
          type="button"
          aria-pressed={modo === "branch-diff"}
          onClick={() => setModo("branch-diff")}
          className={cn(
            "rounded-full px-[14px] py-2 font-mono text-[12px] font-semibold transition-colors",
            modo === "branch-diff"
              ? "bg-[#5946DB] text-[#F6F5FF]"
              : "text-[#71717A] hover:bg-[#F4F4F5]",
          )}
        >
          Diff de branches
        </button>
        <button
          type="button"
          aria-pressed={modo === "sha-tag"}
          onClick={() => setModo("sha-tag")}
          className={cn(
            "rounded-full px-[14px] py-2 font-mono text-[12px] font-semibold transition-colors",
            modo === "sha-tag"
              ? "bg-[#5946DB] text-[#F6F5FF]"
              : "text-[#71717A] hover:bg-[#F4F4F5]",
          )}
        >
          SHA / tag
        </button>
        <button
          type="button"
          disabled
          title="Fora do MVP atual"
          aria-disabled="true"
          className="cursor-not-allowed rounded-full px-[14px] py-2 font-mono text-[12px] font-semibold text-[#71717A] opacity-45"
        >
          PR / MR
        </button>
      </div>

      {/* Lista de branches (apenas modo diff) */}
      {repositoryPath && branches.length === 0 ? (
        <p className="text-[11px] text-[#71717A]">
          Nenhuma branch local. HEAD:{" "}
          <span className="text-[#18181B]">{headDisplay}</span>
          {detached ? " (detached)" : ""}
        </p>
      ) : null}

      {repositoryPath && showBranchPicker && branches.length > 0 ? (
        <>
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#71717A]">
            Filtrar branches
            <input
              value={branchFilter}
              onChange={(ev) => setBranchFilter(ev.target.value)}
              placeholder="Substring (sem maiúsculas)"
              className={cn(
                "h-[40px] rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px]",
                "text-[#18181B] outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35",
              )}
            />
          </label>
          {sameBranch ? (
            <p
              role="status"
              className="text-[12px] font-semibold text-destructive"
              data-testid="compare-same-warning"
            >
              A ref base e a de comparação são iguais. Escolha duas referências
              distintas (branch, tag, commit…).
            </p>
          ) : null}
          <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <li
                className="text-[11px] text-[#71717A]"
                data-testid="empty-filter"
              >
                Nenhuma branch coincide com o filtro.
              </li>
            ) : (
              filtered.map((name) => {
                const row = branchMap.get(name);
                const isHead = row?.isHead ?? false;
                return (
                  <BranchRow
                    key={name}
                    name={name}
                    isHead={isHead}
                    onPickBase={() => setBaseBranch(name)}
                    onPickCompare={() => setCompareBranch(name)}
                  />
                );
              })
            )}
          </ul>
        </>
      ) : null}

      {repositoryPath &&
      modo === "sha-tag" &&
      !sameBranch &&
      (baseBranch || compareBranch) ? (
        <p className="text-[11px] text-[#71717A]">
          Indique refs completas nos campos acima (tags ou SHAs são resolvidas pelo Git ao
          carregar).
        </p>
      ) : null}

      {/* `m1RW9` */}
      <div className="flex flex-wrap gap-3">
        <div
          className={cn(
            "flex h-10 min-w-[200px] max-w-full shrink-0 items-center gap-2.5 rounded-[10px] border px-3 md:w-[280px]",
            "border-[#E4E4E7] bg-white sm:max-w-[280px]",
          )}
        >
          <Search size={18} className="shrink-0 text-[#71717A]" aria-hidden />
          <input
            type="search"
            value={commitFilter}
            onChange={(e) => setCommitFilter(e.target.value)}
            placeholder="Filtrar mensagem ou hash"
            disabled={!data?.commits?.length}
            aria-label="Filtrar mensagem ou hash de commit"
            className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-[#18181B] outline-none placeholder:text-[#71717A] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Linha tipo `kNpe3` */}
      {repositoryPath &&
      baseBranch &&
      compareBranch &&
      !sameBranch &&
      data &&
      !error ? (
        <p className="text-[12px] font-normal text-[#71717A]">
          Commits no intervalo:{" "}
          <span className="font-semibold text-[#18181B]">{filteredCommits.length}</span>
          {data.commitsTruncated ? (
            <span className="text-amber-600 dark:text-amber-400">
              {" "}
              · lista truncada por limite de segurança
            </span>
          ) : null}
        </p>
      ) : null}

      {loading ? (
        <p className="text-[12px] text-[#71717A]" aria-live="polite">
          A carregar commits e alterações…
        </p>
      ) : null}
      {error ? (
        <p className="text-[12px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {/* `VB0GU` */}
      {data && repositoryPath && !sameBranch && !loading && !error ? (
        <div
          className={cn(
            "flex max-h-[min(420px,52vh)] w-full flex-col overflow-hidden rounded-[10px]",
            "border border-[#E4E4E7] bg-white",
          )}
        >
          <div
            role="row"
            className="flex border-b border-[#E4E4E7] px-3.5 py-3 font-mono text-[11px] font-semibold text-[#71717A]"
          >
            <span className="min-w-[4.5rem] flex-[2]">Tipo</span>
            <span className="min-w-0 flex-[5]">Mensagem</span>
            <span className="min-w-0 shrink-0 flex-[2] font-mono">Hash</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {filteredCommits.length === 0 ? (
              <p className="px-3.5 py-4 font-mono text-[12px] text-[#71717A]">
                {commitFilter.trim()
                  ? "Nenhum commit corresponde ao filtro."
                  : "Nenhum commit entre as refs seleccionadas."}
              </p>
            ) : (
              filteredCommits.map((c) => (
                <ScopeCommitTableRow
                  key={c.hash}
                  commit={c}
                  onUseAsBase={() => setBaseBranch(c.hash)}
                  onUseAsCompare={() => setCompareBranch(c.hash)}
                />
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function matchesCommitSearch(c: CommitRow, q: string): boolean {
  const haystack = `${c.summary} ${c.message} ${c.hash} ${c.shortHash}`.toLowerCase();
  return haystack.includes(q);
}

function ScopeCommitTableRow({
  commit: c,
  onUseAsBase,
  onUseAsCompare,
}: {
  commit: CommitRow;
  onUseAsBase: () => void;
  onUseAsCompare: () => void;
}) {
  const label = c.conventionalType?.trim().length ? c.conventionalType : "—";
  return (
    <div
      role="row"
      className="flex flex-wrap items-center gap-y-2 border-b border-[#E4E4E7] px-3.5 py-3 last:border-b-0 sm:flex-nowrap"
    >
      <div className="flex min-w-[4.5rem] flex-[2] items-start">
        <span className="inline-flex rounded-md bg-[#F4F4F5] px-2 py-1 font-mono text-[11px] font-semibold text-[#18181B]">
          {label}
        </span>
      </div>
      <span
        className="min-w-0 flex-[5] font-mono text-[13px] font-normal leading-snug text-[#18181B] sm:pr-3"
        title={c.summary}
      >
        {c.summary || c.message.slice(0, 120)}
      </span>
      <div className="flex min-w-0 flex-[2] items-center gap-2 sm:justify-between">
        <span className="font-mono text-[12px] text-[#71717A]" title={c.hash}>
          {c.shortHash}
        </span>
        <span className="flex shrink-0 gap-1">
          <button
            type="button"
            className={cn(
              "rounded-[6px] border border-[#E4E4E7] px-2 py-0.5 font-mono text-[10px] font-medium",
              "text-[#71717A] hover:bg-[#F4F4F5]",
            )}
            onClick={onUseAsBase}
          >
            Base
          </button>
          <button
            type="button"
            className={cn(
              "rounded-[6px] border border-[#E4E4E7] px-2 py-0.5 font-mono text-[10px] font-medium",
              "text-[#71717A] hover:bg-[#F4F4F5]",
            )}
            onClick={onUseAsCompare}
          >
            Comparar
          </button>
        </span>
      </div>
    </div>
  );
}
