import { join } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Check, Database, Minus, Plus } from "lucide-react";
import type { RefObject } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import {
  evidencePreferenceKeys,
  setEvidencePreference,
} from "../api/evidence-app-state.commands";
import { saveEvidenceDocument } from "../api/evidence.commands";
import { writeTextFile } from "../api/io.commands";
import {
  buildEvidencePrintHtml,
  type EvidenceDocumentPayload,
  type EvidencePrintHtmlOptions,
} from "../lib/build-evidence-html";
import { defaultEvidenceHtmlFileName } from "../lib/evidence-export-filename";
import { printHtmlDocument } from "../lib/print-html";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";

function repoFolderName(repositoryPath: string): string {
  const parts = repositoryPath.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function sanitizeFilenameStem(raw: string): string {
  const t = raw
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return t.slice(0, 120) || "projeto";
}

export type EvidenceDocumentPreviewProps = EvidenceDocumentPayload & {
  /** Passo 4 vs 5 do wizard — só muda ênfase na UI (PRD fluxo em cinco passos). */
  variant?: "preview" | "export";
  /** Chamado após gravar cópia local com sucesso (ex.: atualizar histórico). */
  onLocalSaveSuccess?: () => void;
  /** Permite acionar «Exportar PDF…» a partir do rodapé do wizard (passo 5). */
  exportPdfTriggerRef?: RefObject<HTMLButtonElement | null>;
};

const ZOOM_STEP = 10;
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;

export function EvidenceDocumentPreview({
  variant = "preview",
  onLocalSaveSuccess,
  exportPdfTriggerRef,
  ...payload
}: EvidenceDocumentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [pageEstimate, setPageEstimate] = useState(1);
  const derivedProjectName = repoFolderName(payload.repositoryPath);
  const [projectName, setProjectName] = useState(derivedProjectName);

  const exportDirPath = useEvidenceMetadataStore(
    (s) => s.exportDefaultDirectory,
  );
  const setExportDefaultDirectory = useEvidenceMetadataStore(
    (s) => s.setExportDefaultDirectory,
  );
  const prefsHydrated = useEvidenceMetadataStore((s) => s.hydrated);

  useEffect(() => {
    setProjectName(derivedProjectName);
  }, [derivedProjectName]);

  const [numberPagesPrint, setNumberPagesPrint] = useState(false);

  const printOptions = useMemo((): EvidencePrintHtmlOptions => {
    const titled =
      projectName.trim().length > 0
        ? `${projectName.trim()} — Evidência técnica`
        : derivedProjectName.trim().length > 0
          ? `${derivedProjectName} — Evidência técnica`
          : undefined;
    return {
      documentTitle: titled,
      numberPagesPrint,
    };
  }, [projectName, derivedProjectName, numberPagesPrint]);

  const printReadyHtml = useMemo(
    () => buildEvidencePrintHtml(payload, printOptions),
    [
      payload.repositoryPath,
      payload.baseRef,
      payload.compareRef,
      payload.templateLabel,
      payload.changeId,
      payload.environment,
      payload.technicalSummary,
      payload.commits,
      payload.files,
      payload.commitsTruncated,
      payload.screenshots,
      printOptions.documentTitle,
      printOptions.numberPagesPrint,
    ],
  );

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | { ok: string } | { err: string }
  >("idle");
  const [saveAsStatus, setSaveAsStatus] = useState<
    "idle" | "saving" | { ok: string } | { err: string }
  >("idle");

  const isExportStep = variant === "export";
  const savingBusy = saveStatus === "saving" || saveAsStatus === "saving";

  const scale = zoomPct / 100;

  const syncIframeMetrics = useCallback(() => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    const body = doc?.body;
    const html = doc?.documentElement;
    if (!frame || !body || !html) return;
    const h = Math.max(body.scrollHeight, html.scrollHeight);
    frame.style.height = `${Math.ceil(h)}px`;
    const a4px = Math.round((297 / 25.4) * 96);
    setPageEstimate(Math.max(1, Math.ceil(h / a4px)));
  }, []);

  useEffect(() => {
    syncIframeMetrics();
  }, [printReadyHtml, scale, syncIframeMetrics]);

  const scrollIframeToSection = useCallback((id: string) => {
    const doc = iframeRef.current?.contentDocument;
    doc?.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePickExportDir = useCallback(async () => {
    const picked = await open({
      directory: true,
      multiple: false,
      title: "Destino do ficheiro",
    });
    if (picked === null) return;
    const path = Array.isArray(picked) ? picked[0] : picked;
    if (!path) return;
    setExportDefaultDirectory(path);
    if (prefsHydrated) {
      void setEvidencePreference(
        evidencePreferenceKeys.exportDefaultDirectory,
        path,
      );
    }
  }, [prefsHydrated, setExportDefaultDirectory]);

  async function resolveDefaultHtmlSavePath(): Promise<string | undefined> {
    const stem = sanitizeFilenameStem(
      projectName.trim() ? projectName.trim() : derivedProjectName,
    );
    const fileName =
      stem && stem !== "projeto"
        ? `${stem}-evidencia.html`
        : defaultEvidenceHtmlFileName(payload.baseRef, payload.compareRef);
    if (!exportDirPath?.trim()) {
      return fileName;
    }
    try {
      return await join(exportDirPath.trim(), fileName);
    } catch {
      return fileName;
    }
  }

  async function handleSaveLocalCopy() {
    setSaveStatus("saving");
    try {
      const r = await saveEvidenceDocument({
        html: printReadyHtml,
        repositoryPath: payload.repositoryPath,
        baseRef: payload.baseRef,
        compareRef: payload.compareRef,
      });
      setSaveStatus({ ok: r.htmlPath });
      onLocalSaveSuccess?.();
    } catch (e) {
      setSaveStatus({
        err:
          e instanceof Error
            ? e.message
            : "Não foi possível guardar o documento.",
      });
    }
  }

  async function handleSaveHtmlAs() {
    setSaveAsStatus("saving");
    try {
      const defaultPathForDialog = await resolveDefaultHtmlSavePath();
      const path = await save({
        title: "Guardar documento HTML",
        filters: [{ name: "HTML", extensions: ["html", "htm"] }],
        defaultPath: defaultPathForDialog,
      });
      if (path === null) {
        setSaveAsStatus("idle");
        return;
      }
      await writeTextFile(path, printReadyHtml);
      setSaveAsStatus({ ok: path });
    } catch (e) {
      setSaveAsStatus({
        err:
          e instanceof Error
            ? e.message
            : "Não foi possível guardar o ficheiro.",
      });
    }
  }

  const previewFrameArea = (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-2">
        <p className="font-mono text-[12px] text-[#18181B]">
          Páginas:
          <span className="tabular-nums" data-testid="preview-page-count">
            {" "}
            {pageEstimate}
          </span>
          {" \u2022 "}zoom{" "}
          <span className="tabular-nums" data-testid="preview-zoom-pct">
            {zoomPct}
          </span>
          %
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Reduzir zoom"
            disabled={zoomPct <= ZOOM_MIN}
            data-testid="preview-zoom-minus"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E4E4E7] bg-white text-[#71717A] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-40",
            )}
            onClick={() =>
              setZoomPct((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))
            }
          >
            <Minus className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Aumentar zoom"
            disabled={zoomPct >= ZOOM_MAX}
            data-testid="preview-zoom-plus"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E4E4E7] bg-white text-[#71717A] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-40",
            )}
            onClick={() =>
              setZoomPct((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))
            }
          >
            <Plus className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-auto rounded-[12px] border border-[#E4E4E7] bg-[#FAFAFA] p-2",
          isExportStep ? "max-h-[min(384px,50vh)]" : "max-h-[min(520px,55vh)]",
        )}
      >
        <div
          className="inline-block origin-top-left"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            ref={iframeRef}
            title="Pré-visualização do documento de evidência"
            data-testid="evidence-document-iframe"
            className={cn(
              "block w-[min(100vw-4rem,210mm)] min-w-[240px] border-0 bg-white shadow-sm",
              isExportStep ? "sm:min-h-[320px]" : "sm:min-h-[520px]",
            )}
            srcDoc={printReadyHtml}
            sandbox="allow-same-origin"
            onLoad={() => {
              syncIframeMetrics();
            }}
          />
        </div>
      </div>
    </div>
  );

  const sumarioAside = (
    <nav
      className="flex w-full shrink-0 flex-col gap-3 rounded-[12px] border border-[#E4E4E7] bg-white p-3 sm:w-[200px]"
      aria-label="Sumário do documento"
    >
      <p className="font-mono text-[13px] font-semibold text-[#18181B]">
        Sumário
      </p>
      <ul className="flex list-none flex-col gap-2 font-mono text-[12px]">
        <li className="pl-4">
          <button
            type="button"
            className={cn(
              "w-full rounded px-2 py-1 text-left text-[#5946DB] underline-offset-4 hover:bg-[#FAFAFA] hover:underline",
            )}
            onClick={() =>
              scrollIframeToSection("evidence-section-summary")
            }
          >
            Resumo executivo
          </button>
        </li>
        <li className="pl-4">
          <button
            type="button"
            className={cn(
              "w-full rounded px-2 py-1 text-left text-[#5946DB] underline-offset-4 hover:bg-[#FAFAFA] hover:underline",
            )}
            onClick={() => scrollIframeToSection("evidence-section-commits")}
          >
            Commits ({payload.commits.length})
          </button>
        </li>
        <li className="pl-4">
          <button
            type="button"
            className={cn(
              "w-full rounded px-2 py-1 text-left text-[#5946DB] underline-offset-4 hover:bg-[#FAFAFA] hover:underline",
            )}
            onClick={() => scrollIframeToSection("evidence-section-files")}
          >
            Arquivos e métricas
          </button>
        </li>
        <li className="pl-4">
          {payload.screenshots.length > 0 ? (
            <button
              type="button"
              className={cn(
                "w-full rounded px-2 py-1 text-left text-[#5946DB] underline-offset-4 hover:bg-[#FAFAFA] hover:underline",
              )}
              onClick={() =>
                scrollIframeToSection("evidence-section-screenshots")
              }
            >
              Evidências visuais
            </button>
          ) : (
            <span className="block rounded px-2 py-1 text-[#71717A]" title="Sem screenshots neste âmbito">
              Evidências visuais{" "}
              <span className="text-[11px]">(vazio)</span>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );

  const sqliteStripe = isExportStep ? (
      <div className="flex w-full items-center gap-3 rounded-[12px] border border-[#E4E4E7] bg-white px-[14px] py-3.5">
        <Database
          className="size-[18px] shrink-0 text-[#5946DB]"
          aria-hidden
        />
        <p className="font-mono text-[12px] leading-snug text-[#71717A]">
          Metadados de documentos e preferências (template, Change ID, pasta de
          exportação) na base SQLite local; «Documentos» na barra lateral lista
          cópias HTML quando usa «Guardar cópia local».
        </p>
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {isExportStep ? (
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-col gap-4 lg:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label
                htmlFor="export-dest-folder"
                className="font-mono text-[12px] font-semibold text-[#18181B]"
              >
                Destino do ficheiro
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="export-dest-folder"
                  readOnly
                  data-testid="export-destination-path"
                  className="min-h-[42px] min-w-0 flex-1 truncate rounded-[10px] border border-[#E4E4E7] bg-white px-3 font-mono text-[12px] text-[#18181B]"
                  placeholder="Escolha uma pasta…"
                  value={exportDirPath ?? ""}
                />
                <button
                  type="button"
                  data-testid="export-choose-folder"
                  className="rounded-[10px] border border-[#E4E4E7] bg-white px-3.5 py-2 font-mono text-[13px] font-semibold text-[#18181B] hover:bg-[#FAFAFA]"
                  onClick={() => void handlePickExportDir()}
                >
                  Escolher pasta
                </button>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-1.5 lg:w-[360px]">
              <label
                htmlFor="export-project-name"
                className="font-mono text-[12px] font-semibold text-[#18181B]"
              >
                Nome do projeto
              </label>
              <input
                id="export-project-name"
                type="text"
                data-testid="export-project-name"
                autoComplete="off"
                spellCheck={false}
                value={projectName}
                className="min-h-[42px] rounded-[10px] border border-[#E4E4E7] bg-white px-3 font-mono text-[12px] text-[#18181B]"
                placeholder="Ex.: cliente-api"
                onChange={(ev) => setProjectName(ev.target.value)}
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-[12px] border border-[#E4E4E7] bg-[#F4F4F5] p-4">
            <p className="font-mono text-[13px] font-semibold text-[#18181B]">
              Opções de PDF
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={numberPagesPrint}
                data-testid="export-opt-page-numbers"
                className={cn(
                  "flex items-center gap-2.5 text-left hover:opacity-90",
                )}
                onClick={() =>
                  setNumberPagesPrint((n) => !n)
                }
              >
                <div
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px]",
                    numberPagesPrint
                      ? "bg-[#5946DB]"
                      : "border-2 border-[#E4E4E7] bg-transparent",
                  )}
                  aria-hidden
                >
                  {numberPagesPrint ? (
                    <Check className="size-3 stroke-3 text-white" />
                  ) : null}
                </div>
                <span className="font-mono text-[12px] text-[#18181B]">
                  Numerar páginas automaticamente
                </span>
              </button>
              <button
                type="button"
                aria-disabled="true"
                disabled
                className={cn(
                  "flex cursor-not-allowed items-center gap-2.5 opacity-60",
                )}
              >
                <div
                  className="flex h-[18px] w-[18px] shrink-0 rounded-[4px] border-2 border-[#E4E4E7]"
                  aria-hidden
                />
                <span className="font-mono text-[12px] text-[#71717A]">
                  Marca dagua opcional
                  <span className="text-[11px]"> — Fase 2</span>
                </span>
              </button>
            </div>
          </div>

          {sqliteStripe}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              data-testid="save-evidence-local-html"
              disabled={savingBusy}
              onClick={() => void handleSaveLocalCopy()}
            >
              {saveStatus === "saving"
                ? "A guardar…"
                : "Guardar cópia local (HTML)"}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              data-testid="save-evidence-html-as"
              disabled={savingBusy}
              onClick={() => void handleSaveHtmlAs()}
            >
              {saveAsStatus === "saving"
                ? "A guardar…"
                : "Guardar HTML como…"}
            </button>
            <button
              ref={exportPdfTriggerRef}
              type="button"
              className="rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              data-testid="export-pdf-print"
              onClick={() => printHtmlDocument(printReadyHtml)}
            >
              Exportar PDF…
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Documento de evidência
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Template:{" "}
                <span className="text-foreground">{payload.templateLabel}</span>{" "}
                (único preset no MVP; RF-009 expande)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                data-testid="save-evidence-local-html"
                disabled={savingBusy}
                onClick={() => void handleSaveLocalCopy()}
              >
                {saveStatus === "saving"
                  ? "A guardar…"
                  : "Guardar cópia local (HTML)"}
              </button>
              <button
                type="button"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                data-testid="save-evidence-html-as"
                disabled={savingBusy}
                onClick={() => void handleSaveHtmlAs()}
              >
                {saveAsStatus === "saving"
                  ? "A guardar…"
                  : "Guardar HTML como…"}
              </button>
              <button
                type="button"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                data-testid="export-pdf-print"
                onClick={() => printHtmlDocument(printReadyHtml)}
              >
                Exportar PDF…
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:gap-[14px]">
            {sumarioAside}
            {previewFrameArea}
          </div>
          <p
            data-testid="preview-update-copy"
            className="flex items-start gap-2 font-mono text-[11px] text-[#71717A]"
          >
            <span className="tabular-nums" aria-hidden>
              •
            </span>
            Atualiza ao mudar template ou commits marcados
          </p>
        </>
      )}

      {saveStatus !== "idle" && saveStatus !== "saving" && (
        <p
          className={
            saveStatus && "ok" in saveStatus
              ? "text-[11px] text-foreground"
              : "text-[11px] text-destructive"
          }
          data-testid="save-evidence-status"
        >
          {saveStatus && "ok" in saveStatus
            ? `Documento guardado em: ${saveStatus.ok}`
            : saveStatus && "err" in saveStatus
              ? saveStatus.err
              : null}
        </p>
      )}
      {saveAsStatus !== "idle" && saveAsStatus !== "saving" && (
        <p
          className={
            saveAsStatus && "ok" in saveAsStatus
              ? "text-[11px] text-foreground"
              : "text-[11px] text-destructive"
          }
          data-testid="save-evidence-html-as-status"
        >
          {saveAsStatus && "ok" in saveAsStatus
            ? `HTML guardado em: ${saveAsStatus.ok}`
            : saveAsStatus && "err" in saveAsStatus
              ? saveAsStatus.err
              : null}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        {isExportStep ? (
          <>
            Último passo: abra o diálogo de impressão e escolha «Guardar como PDF».
            O título HTML segue «Nome do projeto». «Numerar páginas» só atua onde o
            motor de impressão respeitar margens `@page`; «Guardar cópia local»
            atualiza SQLite e a pasta de dados da aplicação.
          </>
        ) : (
          <>
            Abre o diálogo de impressão do sistema — escolha «Guardar como PDF» ou uma
            impressora. Utilize «Sumário» para saltar dentro da pré-visualização.
          </>
        )}
      </p>
      {!isExportStep ? null : (
        <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-2">
          {previewFrameArea}
        </div>
      )}
    </div>
  );
}
