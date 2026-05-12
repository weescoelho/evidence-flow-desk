import { useMemo, useState } from "react";

import { saveEvidenceDocument } from "../api/evidence.commands";
import {
  buildEvidencePrintHtml,
  type EvidenceDocumentPayload,
} from "../lib/build-evidence-html";
import { printHtmlDocument } from "../lib/print-html";

export type EvidenceDocumentPreviewProps = EvidenceDocumentPayload & {
  /** Passo 4 vs 5 do wizard — só muda ênfase na UI (PRD fluxo em cinco passos). */
  variant?: "preview" | "export";
};

export function EvidenceDocumentPreview({
  variant = "preview",
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

  const isExportStep = variant === "export";

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
    } catch (e) {
      setSaveStatus({
        err:
          e instanceof Error
            ? e.message
            : "Não foi possível guardar o documento.",
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
            disabled={saveStatus === "saving"}
            onClick={() => void handleSaveLocalCopy()}
          >
            {saveStatus === "saving"
              ? "A guardar…"
              : "Guardar cópia local (HTML)"}
          </button>
          <button
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
      <p className="text-[11px] text-muted-foreground">
        {isExportStep ? (
          <>
            Último passo: abra o diálogo de impressão e escolha «Guardar como
            PDF». O conteúdo inclui o escopo, resumo técnico e screenshots
            anexados. «Guardar cópia local» grava o HTML completo na pasta de
            dados da aplicação para arquivo ou reabertura externa.
          </>
        ) : (
          <>
            Abre o diálogo de impressão do sistema — escolha «Guardar como PDF»
            ou uma impressora. O preview atualiza quando o escopo muda (RF-010).
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
