import { EvidenceDocumentMetadataSection } from "@/features/document/components/evidence-document-metadata-section";

import type { RepositoryScopeSummaryState } from "../hooks/use-repository-scope-summary";
import { EvidenceNarrativeMetrics } from "./evidence-narrative-metrics";

type ScopeAnalysisPanelProps = {
  scope: RepositoryScopeSummaryState;
};

export function ScopeAnalysisPanel({ scope }: ScopeAnalysisPanelProps) {
  const headingId = "scope-analysis-heading";

  const {
    data,
    loading,
    error,
    sameBranch,
    repositoryPath,
    technicalNarrative,
    technicalNarrativeIsCustomized,
    setTechnicalNarrative,
    resetTechnicalNarrativeToGenerated,
  } = scope;

  return (
    <div className="flex flex-col gap-4">
      <EvidenceDocumentMetadataSection repositoryPath={repositoryPath} />

      {!repositoryPath ? null : (
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
              Escolha duas refs Git distintas (branches, tags ou commits) para
              ver commits e alterações cumulativas (do ancestral comum até a ref
              de comparação).
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
                  Lista de commits truncada (limite de segurança). Refine o
                  escopo nas próximas versões.
                </p>
              ) : null}

              <EvidenceNarrativeMetrics
                technicalNarrative={technicalNarrative}
                technicalNarrativeIsCustomized={technicalNarrativeIsCustomized}
                onTechnicalNarrativeChange={setTechnicalNarrative}
                onTechnicalNarrativeRestore={resetTechnicalNarrativeToGenerated}
                files={data.files}
              />

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
      )}
    </div>
  );
}
