import { useEffect, useMemo, useState } from "react";

import { useEvidenceAttachmentsStore } from "@/features/evidence";

import { getRepositoryScopeSummary } from "../api/git.commands";
import { parseGitCommandError } from "../api/parse-git-error";
import { buildTechnicalSummary } from "../lib/technical-summary";
import type { RepositoryScopeSummary } from "../types/git";
import { useGitStore } from "../store/git-store";

export type RepositoryScopeSummaryState = {
  repositoryPath: string | null;
  baseBranch: string | null;
  compareBranch: string | null;
  data: RepositoryScopeSummary | null;
  loading: boolean;
  error: string | null;
  sameBranch: boolean;
  /** Texto efectivo no documento (gerado automaticamente ou editado pelo utilizador). */
  technicalNarrative: string;
  /** Texto produzido apenas por `buildTechnicalSummary` (sem edição manual activa). */
  technicalNarrativeGenerated: string;
  /** Indica se há rascunho manual em curso (mesmo que coincida com o gerado). */
  technicalNarrativeIsCustomized: boolean;
  setTechnicalNarrative: (value: string) => void;
  resetTechnicalNarrativeToGenerated: () => void;
};

export function useRepositoryScopeSummary(): RepositoryScopeSummaryState {
  const repositoryPath = useGitStore((s) => s.repositoryPath);
  const baseBranch = useGitStore((s) => s.baseBranch);
  const compareBranch = useGitStore((s) => s.compareBranch);

  const [data, setData] = useState<RepositoryScopeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sameBranch =
    !!baseBranch &&
    !!compareBranch &&
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
  }, [repositoryPath, baseBranch, compareBranch, sameBranch]);

  const technicalNarrativeGenerated = useMemo(
    () => (data ? buildTechnicalSummary(data) : ""),
    [data],
  );

  /** Reconstrói o rascunho manual quando o intervalo Git ou o conteúdo agregado mudam. */
  const narrativeSourceKey = useMemo(() => {
    if (
      !repositoryPath ||
      !baseBranch ||
      !compareBranch ||
      sameBranch ||
      !data
    ) {
      return "";
    }
    return [
      repositoryPath,
      baseBranch,
      compareBranch,
      data.commitsTruncated ? "trunc" : "full",
      ...data.commits.map((c) => c.hash),
      ...data.files.map(
        (f) =>
          `${f.path}\0${f.status}\0${f.linesAdded}\0${f.linesRemoved}`,
      ),
    ].join("\n");
  }, [repositoryPath, baseBranch, compareBranch, sameBranch, data]);

  const [draftNarrative, setDraftNarrative] = useState<string | null>(null);

  useEffect(() => {
    setDraftNarrative(null);
  }, [narrativeSourceKey]);

  const technicalNarrative =
    draftNarrative !== null ? draftNarrative : technicalNarrativeGenerated;

  const setScopeCommits = useEvidenceAttachmentsStore(
    (s) => s.setScopeCommits,
  );

  useEffect(() => {
    setScopeCommits(data?.commits ?? []);
  }, [data, setScopeCommits]);

  return {
    repositoryPath,
    baseBranch,
    compareBranch,
    data,
    loading,
    error,
    sameBranch,
    technicalNarrative,
    technicalNarrativeGenerated,
    technicalNarrativeIsCustomized: draftNarrative !== null,
    setTechnicalNarrative: (value: string) => setDraftNarrative(value),
    resetTechnicalNarrativeToGenerated: () => setDraftNarrative(null),
  };
}
