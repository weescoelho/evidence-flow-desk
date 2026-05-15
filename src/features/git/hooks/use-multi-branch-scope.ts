import { useEffect, useMemo, useState } from "react";

import { usePendingEvidenceNarrativesStore } from "@/features/document/store/pending-evidence-narratives-store";

import { getMultiBranchScopeSummary } from "../api/git.commands";
import { parseGitCommandError } from "../api/parse-git-error";
import { flattenScopeCommits } from "../lib/flatten-scope-commits";
import { buildTechnicalSummary } from "../lib/technical-summary";
import type { CommitRow, MultiBranchScopeSummary } from "../types/git";
import { useGitStore } from "../store/git-store";

export type MultiBranchScopeState = {
  repositoryPath: string | null;
  selectedBranches: string[];
  data: MultiBranchScopeSummary | null;
  /** Commits todas as branches, deduplicados por hash. */
  flattenedCommits: CommitRow[];
  loading: boolean;
  error: string | null;
  noBranchesSelected: boolean;
  /** Texto efectivo no documento (gerado automaticamente ou editado pelo utilizador). */
  technicalNarrative: string;
  /** Texto produzido apenas por `buildTechnicalSummary` (sem edição manual activa). */
  technicalNarrativeGenerated: string;
  /** Indica se há rascunho manual em curso (mesmo que coincida com o gerado). */
  technicalNarrativeIsCustomized: boolean;
  setTechnicalNarrative: (value: string) => void;
  resetTechnicalNarrativeToGenerated: () => void;
  corporateNarrative: string;
  setCorporateNarrative: (value: string) => void;
};

export function useMultiBranchScope(): MultiBranchScopeState {
  const repositoryPath = useGitStore((s) => s.repositoryPath);
  const selectedBranches = useGitStore((s) => s.selectedBranches);

  const [data, setData] = useState<MultiBranchScopeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noBranchesSelected = selectedBranches.length === 0;

  useEffect(() => {
    if (!repositoryPath || noBranchesSelected) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getMultiBranchScopeSummary(repositoryPath, selectedBranches)
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
              (e instanceof Error
                ? e.message
                : "Falha ao carregar o escopo."),
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repositoryPath, selectedBranches, noBranchesSelected]);

  const flattenedCommits = useMemo(
    () => (data ? flattenScopeCommits(data) : []),
    [data],
  );

  const technicalNarrativeGenerated = useMemo(
    () =>
      data
        ? buildTechnicalSummary({
            commits: flattenedCommits,
            files: data.files,
            commitsTruncated: data.commitsTruncated,
          })
        : "",
    [data, flattenedCommits],
  );

  const narrativeSourceKey = useMemo(() => {
    if (!repositoryPath || noBranchesSelected || !data) {
      return "";
    }
    return [
      repositoryPath,
      ...selectedBranches,
      data.commitsTruncated ? "trunc" : "full",
      data.commonAncestorHash ?? "",
      ...flattenedCommits.map((c) => c.hash),
      ...data.files.map(
        (f) =>
          `${f.path}\0${f.status}\0${f.linesAdded}\0${f.linesRemoved}`,
      ),
    ].join("\n");
  }, [repositoryPath, selectedBranches, noBranchesSelected, data, flattenedCommits]);

  const [draftNarrative, setDraftNarrative] = useState<string | null>(null);

  useEffect(() => {
    setDraftNarrative(null);
  }, [narrativeSourceKey]);

  const [corporateNarrative, setCorporateNarrative] = useState("");

  useEffect(() => {
    setCorporateNarrative("");
  }, [narrativeSourceKey]);

  const pending = usePendingEvidenceNarrativesStore((s) => s.pending);

  useEffect(() => {
    if (!pending || !data || loading || !narrativeSourceKey) return;
    setDraftNarrative(pending.technical);
    setCorporateNarrative(pending.corporate);
    usePendingEvidenceNarrativesStore.getState().clearPending();
  }, [pending, data, loading, narrativeSourceKey]);

  const technicalNarrative =
    draftNarrative !== null ? draftNarrative : technicalNarrativeGenerated;

  return {
    repositoryPath,
    selectedBranches,
    data,
    flattenedCommits,
    loading,
    error,
    noBranchesSelected,
    technicalNarrative,
    technicalNarrativeGenerated,
    technicalNarrativeIsCustomized: draftNarrative !== null,
    setTechnicalNarrative: (value: string) => setDraftNarrative(value),
    resetTechnicalNarrativeToGenerated: () => setDraftNarrative(null),
    corporateNarrative,
    setCorporateNarrative,
  };
}
