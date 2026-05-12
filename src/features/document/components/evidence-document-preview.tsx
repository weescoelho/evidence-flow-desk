import { useMemo } from "react";

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

  const isExportStep = variant === "export";

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
      <p className="text-[11px] text-muted-foreground">
        {isExportStep ? (
          <>
            Último passo: abra o diálogo de impressão e escolha «Guardar como
            PDF». O conteúdo inclui o escopo, resumo técnico e screenshots
            anexados.
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
