import type { CommitRow, MultiBranchScopeSummary } from "../types/git";

/** Une commits de todas as branches do escopo, sem duplicar por hash, ordenados do mais recente ao mais antigo. */
export function flattenScopeCommits(data: MultiBranchScopeSummary): CommitRow[] {
  const rows = data.branches.flatMap((b) => b.commits);
  rows.sort((a, b) => b.committedAtUnix - a.committedAtUnix);
  const seen = new Set<string>();
  const out: CommitRow[] = [];
  for (const c of rows) {
    if (!seen.has(c.hash)) {
      seen.add(c.hash);
      out.push(c);
    }
  }
  return out;
}
