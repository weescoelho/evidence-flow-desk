import { save } from "@tauri-apps/plugin-dialog";
import type { RefObject } from "react";
import { useMemo, useState } from "react";

import { saveEvidenceDocument } from "../api/evidence.commands";
import { writeTextFile } from "../api/io.commands";
import {
  buildEvidencePrintHtml,
  type EvidenceDocumentPayload,
} from "../lib/build-evidence-html";
import { defaultEvidenceHtmlFileName } from "../lib/evidence-export-filename";
import { printHtmlDocument } from "../lib/print-html";

export type EvidenceDocumentPreviewProps = EvidenceDocumentPayload & {
  /** Passo 4 vs 5 do wizard — só muda ênfase na UI (PRD fluxo em cinco passos). */
  variant?: "preview" | "export";
  /** Chamado após gravar cópia local com sucesso (ex.: atualizar histórico). */
  onLocalSaveSuccess?: () => void;
  /** Permite acionar «Exportar PDF…» a partir do rodapé do wizard (passo 5). */
  exportPdfTriggerRef?: RefObject<HTMLButtonElement | null>;
};

export function EvidenceDocumentPreview({
  variant = "preview",
  onLocalSaveSuccess,
  exportPdfTriggerRef,
  ...payload
}: EvidenceDocumentPreviewProps) {
  const printReadyHtml = useMemo(
    () => buildEvidencePrintHtml(payload),
    [
      payload.repositoryPath,
      payload.baseRef,
      payload.compareRef,
      payload.technicalSummary,
      payload.commits,
      payload.files,
      payload.commitsTruncated,
      payload.screenshots,
    ],
  );

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | { ok: string } | { err: string }
  >("idle");
  const [saveAsStatus, setSaveAsStatus] = useState<
    "idle" | "saving" | { ok: string } | { err: string }
  >("idle");

  const isExportStep = variant === "export";
  const savingBusy =
    saveStatus === "saving" || saveAsStatus === "saving";

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
      const path = await save({
        title: "Guardar documento HTML",
        filters: [{ name: "HTML", extensions: ["html", "htm"] }],
        defaultPath: defaultEvidenceHtmlFileName(
          payload.baseRef,
          payload.compareRef,
        ),
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isExportStep ? "Exportar documento" : "Documento de evidência"}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Template: <span className="text-foreground">padrão</span> (único no
            MVP; RF-009 expande para múltiplos)
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
            ref={exportPdfTriggerRef}
            type="button"
            className={
              isExportStep
                ? "rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                : "rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            }
            data-testid="export-pdf-print"
            onClick={() => printHtmlDocument(printReadyHtml)}
          >
            Exportar PDF…
          </button>
        </div>
      </div>
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
            Último passo: abra o diálogo de impressão e escolha «Guardar como
            PDF». O conteúdo inclui o escopo, resumo técnico e screenshots
            anexados. «Guardar cópia local» grava o HTML na pasta de dados da
            aplicação; «Guardar HTML como» deixa escolher pasta e nome do
            ficheiro (ex.: Documentos ou partilha com a equipa).
          </>
        ) : (
          <>
            Abre o diálogo de impressão do sistema — escolha «Guardar como PDF»
            ou uma impressora. O preview atualiza quando o escopo muda (RF-010).
            Pode também guardar o HTML noutro sítio com «Guardar HTML como».
          </>
        )}
      </p>
      <iframe
        title="Pré-visualização do documento de evidência"
        className={
          isExportStep
            ? "h-72 w-full rounded-md border border-border bg-white dark:bg-background sm:h-96"
            : "h-112 w-full rounded-md border border-border bg-white dark:bg-background"
        }
        srcDoc={printReadyHtml}
        sandbox=""
      />
    </div>
  );
}
