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
    corporateNarrative,
    setCorporateNarrative,
  } = scope;

  return (
    <div className="flex flex-col gap-6">
      <EvidenceDocumentMetadataSection repositoryPath={repositoryPath} />

      {!repositoryPath ? null : (
        <section
          aria-labelledby={headingId}
          className="flex flex-col gap-[18px] rounded-xl border border-[#E4E4E7] bg-white p-6 font-mono"
        >
          <h2
            id={headingId}
            className="text-[13px] font-semibold text-[#18181B]"
          >
            Escopo (base → compare)
          </h2>
          {sameBranch ? (
            <p className="text-[12px] leading-snug text-[#71717A]">
              Escolha duas refs Git distintas (branches, tags ou commits) para
              ver commits e alterações cumulativas (do ancestral comum até a ref
              de comparação).
            </p>
          ) : null}
          {loading ? (
            <p className="text-[12px] text-[#71717A]" aria-live="polite">
              Carregando análise…
            </p>
          ) : null}
          {error ? (
            <p
              className="text-[12px] text-destructive"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          ) : null}
          {data && !sameBranch && !loading && !error ? (
            <div className="flex flex-col gap-6">
              {data.commitsTruncated ? (
                <p className="text-[12px] text-amber-600 dark:text-amber-400">
                  Lista de commits truncada (limite de segurança). Refine o
                  escopo nas próximas versões.
                </p>
              ) : null}

              <EvidenceNarrativeMetrics
                technicalNarrative={technicalNarrative}
                technicalNarrativeIsCustomized={technicalNarrativeIsCustomized}
                onTechnicalNarrativeChange={setTechnicalNarrative}
                onTechnicalNarrativeRestore={resetTechnicalNarrativeToGenerated}
                corporateNarrative={corporateNarrative}
                onCorporateNarrativeChange={setCorporateNarrative}
                files={data.files}
              />

              <div className="overflow-hidden rounded-[10px] border border-[#E4E4E7]">
                <div className="border-b border-[#E4E4E7] px-3.5 py-2.5 text-[11px] font-semibold text-[#71717A]">
                  Arquivos ({data.files.length})
                </div>
                {data.files.length === 0 ? (
                  <p className="px-3.5 py-3 text-[12px] text-[#71717A]">
                    Nenhuma alteração de arquivo no intervalo.
                  </p>
                ) : (
                  <ul className="flex max-h-48 flex-col overflow-y-auto text-[11px]">
                    {data.files.map((f) => (
                      <li
                        key={`${f.path}-${f.status}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E4E4E7] px-3.5 py-2.5 last:border-b-0"
                      >
                        <span className="min-w-0 flex-1 truncate text-[#18181B]">
                          {f.path}
                          {f.status === "renamed" &&
                          f.pathBefore &&
                          f.pathAfter &&
                          f.pathBefore !== f.pathAfter ? (
                            <span className="ml-1 text-[#71717A]">
                              ← {f.pathBefore}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-[#71717A]">
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
