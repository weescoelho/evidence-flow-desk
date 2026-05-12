import { useMemo } from "react";

import {
  buildEvidencePrintHtml,
  type EvidenceDocumentPayload,
} from "../lib/build-evidence-html";
import { printHtmlDocument } from "../lib/print-html";

export function EvidenceDocumentPreview(props: EvidenceDocumentPayload) {
  const printReadyHtml = useMemo(
    () => buildEvidencePrintHtml(props),
    [
      props.repositoryPath,
      props.baseRef,
      props.compareRef,
      props.technicalSummary,
      props.commits,
      props.files,
      props.commitsTruncated,
    ],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Documento de evidência
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Template: <span className="text-foreground">padrão</span> (único no
            MVP; RF-009 expande para múltiplos)
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          data-testid="export-pdf-print"
          onClick={() => printHtmlDocument(printReadyHtml)}
        >
          Exportar PDF…
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Abre o diálogo de impressão do sistema — escolha «Guardar como PDF» ou
        uma impressora. O preview atualiza quando o escopo muda (RF-010).
      </p>
      <iframe
        title="Pré-visualização do documento de evidência"
        className="h-112 w-full rounded-md border border-border bg-white dark:bg-background"
        srcDoc={printReadyHtml}
        sandbox=""
      />
    </div>
  );
}
