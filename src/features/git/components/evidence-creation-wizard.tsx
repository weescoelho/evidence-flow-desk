import { ArrowRight, Download, Info } from "lucide-react";
import { confirm } from "@tauri-apps/plugin-dialog";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SavedEvidenceDocumentsPanel } from "@/features/document";
import { EvidenceScreenshotsSection } from "@/features/evidence";
import { cn } from "@/lib/utils";

import { ScopeCommitsStep } from "./scope-commits-step";
import { RepositorySection } from "./repository-section";
import { ScopeAnalysisPanel } from "./scope-analysis-panel";
import { ScopeDocumentPreviewPanel } from "./scope-document-preview-panel";
import { useMultiBranchScope } from "../hooks/use-multi-branch-scope";
import { resetEvidenceSession } from "../lib/reset-evidence-session";
import { useEvidenceWizardUiStore } from "../store/evidence-wizard-ui-store";

const STEP_COUNT = 5;

/** Títulos por passo — alinhados a `docs/UI-COMPONENTS.md` / `design.pen`. */
const STEP_PAGE = [
  {
    title: "Escolha o repositório Git",
    subtitle:
      "Detectamos branches e histórico para montar a sua evidência com rastreabilidade.",
  },
  {
    title: "Defina escopo e commits",
    subtitle:
      "Seleccione as branches que entram no documento. O ancestral comum e o histórico são calculados automaticamente.",
  },
  {
    title: "Resumo, arquivos e capturas",
    subtitle:
      "Gere texto para homologação, veja ficheiros impactados e anexe capturas manuais ou por automação.",
  },
  {
    title: "Preview antes de gerar PDF",
    subtitle:
      "Confira secções, realce de diff e evidências visuais tal como sairão no documento final.",
  },
  {
    title: "Exportar evidência em PDF",
    subtitle:
      "Ficheiro pronto para homologação e auditoria. Guarde no histórico local para consultas futuras.",
  },
] as const;

/** Rótulos do botão primário — spec `product-ui-journey` (UI-R02). */
const PRIMARY_CTA = [
  "Continuar para escopo",
  "Continuar para evidencias",
  "Ir para preview",
  "Continuar para exportar",
  "Exportar PDF agora",
] as const;

function highestAccessibleStep(
  scope: ReturnType<typeof useMultiBranchScope>,
): number {
  if (!scope.repositoryPath) return 1;
  if (scope.noBranchesSelected) {
    return 2;
  }
  if (!scope.data || scope.error || scope.loading) return 3;
  return STEP_COUNT;
}

export function EvidenceCreationWizard() {
  const scope = useMultiBranchScope();
  const [step, setStep] = useState(1);
  const [savedEvidenceRefreshKey, setSavedEvidenceRefreshKey] = useState(0);
  const exportPdfTriggerRef = useRef<HTMLButtonElement>(null);
  const jumpToStep = useEvidenceWizardUiStore((s) => s.jumpToStep);
  const clearJump = useEvidenceWizardUiStore((s) => s.clearJump);

  const maxStep = useMemo(() => highestAccessibleStep(scope), [scope]);

  useEffect(() => {
    if (step > maxStep) setStep(maxStep);
  }, [maxStep, step]);

  useEffect(() => {
    if (
      jumpToStep !== null &&
      jumpToStep >= 1 &&
      jumpToStep <= STEP_COUNT
    ) {
      setStep(jumpToStep);
      clearJump();
    }
  }, [jumpToStep, clearJump]);

  async function handleStartOver() {
    const agreed = await confirm(
      "Todo o texto, repositório seleccionado e capturas desta sessão serão limpos. Isto não remove entradas já listadas em «Documentos».",
      {
        title: "Começar evidência de novo",
        kind: "warning",
        okLabel: "Limpar e recomeçar",
        cancelLabel: "Cancelar",
      },
    );
    if (!agreed) return;
    resetEvidenceSession();
    clearJump();
    setStep(1);
  }

  const panelId = `evidence-step-panel-${step}`;
  const page = STEP_PAGE[step - 1];
  const canPrintPdf =
    maxStep >= 5 &&
    Boolean(scope.data) &&
    !scope.error &&
    !scope.loading;

  const primaryAdvanceDisabled = step < STEP_COUNT && step >= maxStep;
  const primaryExportDisabled = step === STEP_COUNT && !canPrintPdf;

  function handlePrimary() {
    if (step < STEP_COUNT) {
      if (step < maxStep) setStep((s) => s + 1);
      return;
    }
    exportPdfTriggerRef.current?.click();
  }

  function handleCancel() {
    if (step > 1) setStep((s) => s - 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-col gap-4 border-b border-border pb-4"
        aria-label="Progresso da nova evidência"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[12px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Nova evidência</span>
            <span className="text-muted-foreground" aria-hidden>
              {">"}
            </span>
            <span className="font-semibold text-foreground">
              Passo {step} de {STEP_COUNT}
            </span>
          </div>
          <button
            type="button"
            className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => void handleStartOver()}
          >
            Começar de novo
          </button>
        </div>
        <div
          className="flex items-center gap-2.5 overflow-x-auto py-0.5"
          role="group"
          aria-label="Etapas do assistente"
        >
          {STEP_PAGE.map((_, i) => {
            const n = i + 1;
            const enabled = n <= maxStep;
            return (
              <span key={n} className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={!enabled}
                  aria-current={step === n ? "step" : undefined}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[12px] font-semibold transition-colors",
                    step === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : enabled
                        ? "border-border bg-card text-foreground hover:bg-muted/80"
                        : "border-border bg-muted text-muted-foreground",
                    !enabled && "cursor-not-allowed opacity-70",
                  )}
                  onClick={() => enabled && setStep(n)}
                >
                  {n}
                </button>
                {i < STEP_PAGE.length - 1 ? (
                  <span
                    className="h-0.5 w-6 shrink-0 rounded-sm bg-border sm:w-10"
                    aria-hidden
                  />
                ) : null}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-[28px] font-semibold tracking-tight text-foreground">
          {page.title}
        </h1>
        <p className="font-mono text-sm text-muted-foreground">{page.subtitle}</p>
      </div>

      <div
        id={panelId}
        role="region"
        aria-label={page.title}
        className="flex min-h-0 flex-col gap-6"
      >
        {step === 1 ? (
          <>
            <RepositorySection />
            <div
              role="note"
              aria-label="Dados locais e privacidade"
              className="flex items-center gap-2.5 rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] px-3.5 py-3"
            >
              <Info
                className="size-[18px] shrink-0 text-[#5946DB]"
                aria-hidden
              />
              <p className="font-mono text-[12px] leading-snug text-[#71717A]">
                Somente dados locais. Nada sai da máquina sem a sua confirmação ao
                usar IA ou integrações.
              </p>
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <ScopeCommitsStep scope={scope} />
            <div
              role="note"
              aria-label="Dados locais e privacidade"
              className="flex items-center gap-2.5 rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] px-3.5 py-3"
            >
              <Info
                className="size-[18px] shrink-0 text-[#5946DB]"
                aria-hidden
              />
              <p className="font-mono text-[12px] leading-snug text-[#71717A]">
                Somente dados locais. Nada sai da máquina sem a sua confirmação ao
                usar IA ou integrações.
              </p>
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <ScopeAnalysisPanel scope={scope} />
            <EvidenceScreenshotsSection />
          </>
        ) : null}
        {step === 4 ? (
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <ScopeDocumentPreviewPanel
              scope={scope}
              variant="preview"
              onLocalSaveSuccess={() =>
                setSavedEvidenceRefreshKey((k) => k + 1)
              }
            />
            {!scope.data && scope.repositoryPath && !scope.noBranchesSelected ? (
              <p className="text-xs text-muted-foreground">
                Aguarde o carregamento do escopo no passo «Escopo e commits» para ver o documento.
              </p>
            ) : null}
            <SavedEvidenceDocumentsPanel
              refreshKey={savedEvidenceRefreshKey}
            />
          </section>
        ) : null}
        {step === 5 ? (
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <ScopeDocumentPreviewPanel
              scope={scope}
              variant="export"
              onLocalSaveSuccess={() =>
                setSavedEvidenceRefreshKey((k) => k + 1)
              }
              exportPdfTriggerRef={exportPdfTriggerRef}
            />
            <SavedEvidenceDocumentsPanel
              refreshKey={savedEvidenceRefreshKey}
            />
            {!scope.data && scope.repositoryPath && !scope.noBranchesSelected ? (
              <p className="text-xs text-muted-foreground">
                Aguarde o carregamento do escopo antes de exportar.
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
        aria-label="Ações do assistente"
      >
        <button
          type="button"
          disabled={step <= 1}
          className={cn(
            "flex h-[42px] min-w-[100px] items-center justify-center rounded-[10px] px-[14px] font-mono text-[13px] font-semibold text-muted-foreground transition-colors",
            step > 1
              ? "hover:bg-muted/80"
              : "cursor-not-allowed opacity-50",
          )}
          onClick={handleCancel}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={
            step < STEP_COUNT ? primaryAdvanceDisabled : primaryExportDisabled
          }
          className="flex h-[42px] items-center justify-center gap-2 rounded-[10px] bg-primary px-[22px] font-mono text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handlePrimary}
        >
          {PRIMARY_CTA[step - 1]}
          {step === STEP_COUNT ? (
            <Download className="size-[18px]" aria-hidden />
          ) : (
            <ArrowRight className="size-[18px]" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
