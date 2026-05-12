import { useId } from "react";

import { useGitStore } from "../store/git-store";

function BranchRow({
  name,
  isHead,
  onPickBase,
  onPickCompare,
}: {
  name: string;
  isHead: boolean;
  onPickBase: () => void;
  onPickCompare: () => void;
}) {
  return (
    <li
      className={
        isHead
          ? "flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-2 py-1.5"
          : "flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1.5"
      }
      data-current={isHead ? "true" : "false"}
    >
      <span className="min-w-0 flex-1 truncate text-xs font-mono text-foreground">
        {name}
      </span>
      {isHead ? (
        <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
          HEAD
        </span>
      ) : null}
      <div className="flex gap-1">
        <button
          type="button"
          className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
          onClick={onPickBase}
        >
          Base
        </button>
        <button
          type="button"
          className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
          onClick={onPickCompare}
        >
          Comparar
        </button>
      </div>
    </li>
  );
}

export function BranchList() {
  const branchesHeadingId = useId();
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

  const filtered = filteredBranchNames();
  const branchMap = new Map(branches.map((b) => [b.name, b]));

  const sameCompare =
    baseBranch &&
    compareBranch &&
    baseBranch.length > 0 &&
    baseBranch === compareBranch;

  if (!repositoryPath) {
    return (
      <section className="rounded-lg border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
        Selecione um repositório para listar branches locais.
      </section>
    );
  }

  if (branches.length === 0) {
    return (
      <section
        aria-live="polite"
        className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground"
      >
        Nenhuma branch local encontrada neste repositório.
        <p className="mt-2 font-mono text-[11px] text-foreground">
          HEAD: {headDisplay}
          {detached ? " (detached)" : ""}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={branchesHeadingId}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2
          id={branchesHeadingId}
          className="text-sm font-semibold text-foreground"
        >
          Branches locais
        </h2>
        <p className="text-xs text-muted-foreground">
          HEAD atual:{" "}
          <span className="font-mono text-foreground">
            {headDisplay}
            {detached ? " (detached)" : ""}
          </span>
        </p>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Filtrar por nome
        <input
          value={branchFilter}
          onChange={(ev) => setBranchFilter(ev.target.value)}
          placeholder="Substring (sem distinguir maiúsculas)"
          className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </label>
      {sameCompare ? (
        <p
          role="status"
          className="text-xs font-medium text-destructive"
          data-testid="compare-same-warning"
        >
          A ref base e a de comparação são iguais. Escolha duas referências
          distintas (branch, tag, commit, etc.).
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Além das branches abaixo, pode indicar{" "}
        <span className="font-medium text-foreground">tags</span> (ex.:{" "}
        <span className="font-mono">v1.0.0</span>),{" "}
        <span className="font-medium text-foreground">commits</span> ou
        expressões aceitas pelo Git (ex.:{" "}
        <span className="font-mono">main~2</span>).
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>Base (ref Git)</span>
          <input
            type="text"
            data-testid="scope-base-ref"
            value={baseBranch ?? ""}
            onChange={(ev) => {
              const v = ev.target.value.trim();
              setBaseBranch(v.length ? v : null);
            }}
            list={`${branchesHeadingId}-scope-base`}
            placeholder="ex.: main, v1.0.0, abc1234"
            autoComplete="off"
            className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <datalist id={`${branchesHeadingId}-scope-base`}>
            {branches.map((b) => (
              <option key={b.name} value={b.name} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>Comparar (ref Git)</span>
          <input
            type="text"
            data-testid="scope-compare-ref"
            value={compareBranch ?? ""}
            onChange={(ev) => {
              const v = ev.target.value.trim();
              setCompareBranch(v.length ? v : null);
            }}
            list={`${branchesHeadingId}-scope-compare`}
            placeholder="ex.: feature-x, HEAD"
            autoComplete="off"
            className="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <datalist id={`${branchesHeadingId}-scope-compare`}>
            {branches.map((b) => (
              <option key={`c-${b.name}`} value={b.name} />
            ))}
          </datalist>
        </label>
      </div>
      <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <li
            className="text-xs text-muted-foreground"
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
    </section>
  );
}
