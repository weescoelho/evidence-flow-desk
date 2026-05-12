import { useEffect, useMemo, useState } from "react";

import { SavedEvidenceDocumentsPanel } from "@/features/document";
import { EvidenceScreenshotsSection } from "@/features/evidence";
import { cn } from "@/lib/utils";

import { BranchList } from "./branch-list";
import { RepositorySection } from "./repository-section";
import { ScopeAnalysisPanel } from "./scope-analysis-panel";
import { ScopeDocumentPreviewPanel } from "./scope-document-preview-panel";
import { useRepositoryScopeSummary } from "../hooks/use-repository-scope-summary";

const STEP_COUNT = 5;

const STEPS = [
  { id: 1, label: "Repositório", tabLabel: "1 · Repo" },
  { id: 2, label: "Escopo e commits", tabLabel: "2 · Escopo" },
  { id: 3, label: "Evidências", tabLabel: "3 · Evidências" },
  { id: 4, label: "Pré-visualização", tabLabel: "4 · Preview" },
  { id: 5, label: "Exportar PDF", tabLabel: "5 · PDF" },
] as const;

function highestAccessibleStep(
  scope: ReturnType<typeof useRepositoryScopeSummary>,
): number {
  if (!scope.repositoryPath) return 1;
  if (
    !scope.baseBranch ||
    !scope.compareBranch ||
    scope.sameBranch
  ) {
    return 2;
  }
  if (!scope.data || scope.error || scope.loading) return 3;
  return STEP_COUNT;
}

export function EvidenceCreationWizard() {
  const scope = useRepositoryScopeSummary();
  const [step, setStep] = useState(1);
  const [savedEvidenceRefreshKey, setSavedEvidenceRefreshKey] = useState(0);

  const maxStep = useMemo(() => highestAccessibleStep(scope), [scope]);

  useEffect(() => {
    if (step > maxStep) setStep(maxStep);
  }, [maxStep, step]);

  const panelId = `evidence-step-panel-${step}`;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-col gap-4 border-b border-border pb-4"
        aria-label="Progresso da nova evidência"
      >
        <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
          <span className="text-muted-foreground">Nova evidência</span>
          <span className="text-muted-foreground" aria-hidden>
            {">"}
          </span>
          <span className="font-semibold text-foreground">
            Passo {step} de {STEP_COUNT}
          </span>
          <span className="sr-only">
            {STEPS[step - 1]?.label ?? ""}
          </span>
        </div>
        <div
          className="flex flex-wrap gap-1.5 sm:gap-2"
          role="tablist"
          aria-label="Etapas do assistente"
        >
          {STEPS.map((s) => {
            const enabled = s.id <= maxStep;
            const selected = s.id === step;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`evidence-tab-${s.id}`}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                disabled={!enabled}
                className={cn(
                  "shrink-0 rounded-lg border px-2.5 py-2 text-left font-mono text-[11px] font-semibold transition-colors sm:px-3",
                  enabled &&
                    selected &&
                    "border-primary bg-primary text-primary-foreground",
                  enabled &&
                    !selected &&
                    "border-border bg-card text-muted-foreground hover:bg-muted/80",
                  !enabled &&
                    "cursor-not-allowed border-transparent bg-muted/30 text-muted-foreground opacity-60",
                )}
                onClick={() => enabled && setStep(s.id)}
              >
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.tabLabel}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto py-0.5">
          {STEPS.map((s, i) => (
            <span key={s.id} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[12px] font-semibold",
                  step === s.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : s.id <= maxStep
                      ? "border-border bg-card text-foreground"
                      : "border-border bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  className="h-0.5 w-6 shrink-0 rounded-sm bg-border sm:w-10"
                  aria-hidden
                />
              ) : null}
            </span>
          ))}
        </div>
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`evidence-tab-${step}`}
        className="flex min-h-0 flex-col gap-6"
      >
        {step === 1 ? <RepositorySection /> : null}
        {step === 2 ? <BranchList /> : null}
        {step === 3 ? (
          <>
            <ScopeAnalysisPanel scope={scope} />
            <EvidenceScreenshotsSection />
          </>
        ) : null}
        {step === 4 ? (
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">
              {STEPS[3].label}
            </h2>
            <ScopeDocumentPreviewPanel
              scope={scope}
              variant="preview"
              onLocalSaveSuccess={() =>
                setSavedEvidenceRefreshKey((k) => k + 1)
              }
            />
            {!scope.data && scope.repositoryPath ? (
              <p className="text-xs text-muted-foreground">
                Defina duas refs distintas no passo «Escopo e commits» e aguarde
                o carregamento para ver o documento.
              </p>
            ) : null}
          </section>
        ) : null}
        {step === 5 ? (
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">
              {STEPS[4].label}
            </h2>
            <ScopeDocumentPreviewPanel
              scope={scope}
              variant="export"
              onLocalSaveSuccess={() =>
                setSavedEvidenceRefreshKey((k) => k + 1)
              }
            />
            <SavedEvidenceDocumentsPanel
              refreshKey={savedEvidenceRefreshKey}
            />
            {!scope.data && scope.repositoryPath ? (
              <p className="text-xs text-muted-foreground">
                Defina duas refs distintas no passo «Escopo e commits» e aguarde
                o carregamento antes de exportar.
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
