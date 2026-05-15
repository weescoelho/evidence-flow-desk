import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import type { MultiBranchScopeState } from "../hooks/use-multi-branch-scope";
import { filterBranchNames } from "../lib/branch-filter";
import type { CommitRow } from "../types/git";
import { useGitStore } from "../store/git-store";
import { BranchSelectRow } from "./branch-list-internals";

type ScopeCommitsStepProps = {
  scope: MultiBranchScopeState;
};

/**
 * Passo «Escopo e commits» — seleção multi-branch e ancestral comum automático.
 */
export function ScopeCommitsStep({ scope }: ScopeCommitsStepProps) {
  const { data, loading, error, noBranchesSelected, flattenedCommits } = scope;

  const repositoryPath = useGitStore((s) => s.repositoryPath);
  const branches = useGitStore((s) => s.branches);
  const headDisplay = useGitStore((s) => s.headDisplay);
  const detached = useGitStore((s) => s.detached);
  const branchFilter = useGitStore((s) => s.branchFilter);
  const setBranchFilter = useGitStore((s) => s.setBranchFilter);
  const selectedBranches = useGitStore((s) => s.selectedBranches);
  const toggleBranch = useGitStore((s) => s.toggleBranch);

  const [commitFilter, setCommitFilter] = useState("");

  const filtered = useMemo(
    () => filterBranchNames(branches.map((b) => b.name), branchFilter),
    [branches, branchFilter],
  );
  const branchMap = new Map(branches.map((b) => [b.name, b]));

  const filteredCommits = useMemo(() => {
    const commits = flattenedCommits;
    const q = commitFilter.trim().toLowerCase();
    if (!q) return commits;
    return commits.filter((c) => matchesCommitSearch(c, q));
  }, [flattenedCommits, commitFilter]);

  return (
    <section
      aria-label="Escopo e commits das branches seleccionadas"
      className={cn(
        "flex w-full flex-col gap-[18px] rounded-xl border bg-white p-6 font-mono text-[#18181B]",
        "border-[#E4E4E7]",
      )}
    >
      {!repositoryPath ? (
        <p className="text-[12px] text-[#71717A]">
          Selecione um repositório no passo anterior para escolher as branches do
          documento.
        </p>
      ) : (
        <p className="text-[12px] leading-snug text-[#71717A]">
          Marque uma ou mais branches. O ancestral comum é calculado
          automaticamente; commits e ficheiros são agregados a partir desse ponto
          até ao tip de cada branch.
        </p>
      )}

      {repositoryPath && branches.length === 0 ? (
        <p className="text-[11px] text-[#71717A]">
          Nenhuma branch local. HEAD:{" "}
          <span className="text-[#18181B]">{headDisplay}</span>
          {detached ? " (detached)" : ""}
        </p>
      ) : null}

      {repositoryPath && branches.length > 0 ? (
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
          {noBranchesSelected ? (
            <p
              role="status"
              className="text-[12px] font-semibold text-destructive"
              data-testid="no-branches-warning"
            >
              Seleccione pelo menos uma branch para compor o escopo.
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
                  <BranchSelectRow
                    key={name}
                    name={name}
                    isHead={isHead}
                    selected={selectedBranches.includes(name)}
                    onToggle={() => toggleBranch(name)}
                  />
                );
              })
            )}
          </ul>
        </>
      ) : null}

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
            disabled={!filteredCommits.length}
            aria-label="Filtrar mensagem ou hash de commit"
            className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-[#18181B] outline-none placeholder:text-[#71717A] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {repositoryPath && !noBranchesSelected && data && !error ? (
        <p className="text-[12px] font-normal text-[#71717A]">
          Commits (agregados, sem duplicar):{" "}
          <span className="font-semibold text-[#18181B]">
            {filteredCommits.length}
          </span>
          {data.commonAncestorHash ? (
            <span className="block pt-1 text-[11px]">
              Ancestral comum:{" "}
              <code className="text-[#18181B]">
                {data.commonAncestorHash.slice(0, 7)}
              </code>
            </span>
          ) : null}
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

      {data && repositoryPath && !noBranchesSelected && !loading && !error ? (
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
                  : "Nenhum commit no escopo calculado."}
              </p>
            ) : (
              filteredCommits.map((c) => (
                <ScopeCommitTableRow key={c.hash} commit={c} />
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

function ScopeCommitTableRow({ commit: c }: { commit: CommitRow }) {
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
      </div>
    </div>
  );
}
