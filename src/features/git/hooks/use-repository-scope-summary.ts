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
  technicalNarrative: string;
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

  const technicalNarrative = useMemo(
    () => (data ? buildTechnicalSummary(data) : ""),
    [data],
  );

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
  };
}
