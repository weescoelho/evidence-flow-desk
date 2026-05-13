import type { CommitRow, FileChangeRow } from "@/features/git/types/git";

import { escapeHtml } from "./escape-html";

export type EvidenceScreenshotPayload = {
  fileName: string;
  /** Só `data:image/*;base64,` confiável para &lt;img src&gt; */
  dataUrl: string;
  caption: string;
};

export type EvidenceDocumentPayload = {
  repositoryPath: string;
  baseRef: string;
  compareRef: string;
  /** Rótulo do template no documento (MVP: único preset). */
  templateLabel: string;
  /** Metadados de rastreio preenchidos no passo 3; vazios omitidos no texto como «—». */
  changeId: string;
  environment: string;
  technicalSummary: string;
  /** RF-007 — texto de negócio; omitido no HTML se vazio. */
  corporateSummary?: string;
  commits: CommitRow[];
  files: FileChangeRow[];
  commitsTruncated: boolean;
  screenshots: EvidenceScreenshotPayload[];
};

const FILE_STATUS_PT: Record<FileChangeRow["status"], string> = {
  added: "adicionado",
  deleted: "removido",
  modified: "modificado",
  renamed: "renomeado",
  copied: "copiado",
  other: "outro",
};

function safeImageDataUrl(url: string): string {
  if (!url.startsWith("data:image/")) return "";
  return url;
}

/**
 * Corpo do documento em HTML seguro (apenas texto escapado).
 * Reutilizado no preview (RF-010) e dentro do envoltório de impressão (RF-011).
 */
export function buildEvidenceBodyHtml(p: EvidenceDocumentPayload): string {
  const generatedAt = escapeHtml(new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }));
  const templateLine = escapeHtml(p.templateLabel.trim() || "padrão");
  const changeLine = escapeHtml(p.changeId.trim() || "—");
  const envLine = escapeHtml(p.environment.trim() || "—");

  const commitRows =
    p.commits.length === 0
      ? `<tr><td colspan="4">Nenhum commit no intervalo.</td></tr>`
      : p.commits
          .map((c) => {
            const type = c.conventionalType
              ? escapeHtml(c.conventionalType)
              : "—";
            return `<tr>
<td><code>${escapeHtml(c.shortHash)}</code></td>
<td>${type}</td>
<td>${escapeHtml(c.authorName)}</td>
<td>${escapeHtml(c.summary)}</td>
</tr>`;
          })
          .join("\n");

  const fileRows =
    p.files.length === 0
      ? `<tr><td colspan="3">Nenhuma alteração de arquivo.</td></tr>`
      : p.files
          .map((f) => {
            const delta =
              f.linesAdded + f.linesRemoved > 0
                ? `+${f.linesAdded} / −${f.linesRemoved}`
                : "—";
            const pathCell =
              f.status === "renamed" &&
              f.pathBefore &&
              f.pathAfter &&
              f.pathBefore !== f.pathAfter
                ? `${escapeHtml(f.path)} <small>(${escapeHtml(f.pathBefore)} → ${escapeHtml(f.pathAfter)})</small>`
                : escapeHtml(f.path);
            return `<tr>
<td>${pathCell}</td>
<td>${escapeHtml(FILE_STATUS_PT[f.status])}</td>
<td>${escapeHtml(delta)}</td>
</tr>`;
          })
          .join("\n");

  const truncNote = p.commitsTruncated
    ? `<p class="warn"><strong>Atenção:</strong> a lista de commits foi truncada pelo limite de segurança da aplicação.</p>`
    : "";

  const screenshotSection =
    p.screenshots.length === 0
      ? ""
      : `<section id="evidence-section-screenshots" class="screenshots">
  <h2>Screenshots (${p.screenshots.length})</h2>
  ${p.screenshots
    .map((s) => {
      const src = safeImageDataUrl(s.dataUrl);
      if (!src) {
        return `<figure class="shot"><p class="warn">Imagem omitida (formato inválido).</p></figure>`;
      }
      const cap = escapeHtml(s.caption.trim() || s.fileName);
      return `<figure class="shot">
  <img src="${src}" alt="${cap}" />
  <figcaption>${cap}</figcaption>
</figure>`;
    })
    .join("\n")}
</section>`;

  return `
<header class="doc-header">
  <h1>Evidência técnica</h1>
  <p class="subtitle">Template <strong>${templateLine}</strong></p>
</header>

<section id="evidence-section-meta" class="meta">
  <h2>Metadados</h2>
  <dl>
    <dt>Change ID / ticket</dt><dd>${changeLine}</dd>
    <dt>Ambiente</dt><dd>${envLine}</dd>
    <dt>Gerado em</dt><dd>${generatedAt}</dd>
  </dl>
</section>

${truncNote}

<section id="evidence-section-summary">
  <h2>Resumo técnico</h2>
  <pre class="technical">${escapeHtml(p.technicalSummary)}</pre>
</section>

${
    p.corporateSummary?.trim()
      ? `<section id="evidence-section-corporate">
  <h2>Resumo corporativo</h2>
  <pre class="technical">${escapeHtml(p.corporateSummary.trim())}</pre>
</section>`
      : ""
  }

<section id="evidence-section-commits">
  <h2>Commits (${p.commits.length})</h2>
  <table>
    <thead><tr><th>Hash</th><th>Tipo</th><th>Autor</th><th>Resumo</th></tr></thead>
    <tbody>${commitRows}</tbody>
  </table>
</section>

<section id="evidence-section-files">
  <h2>Arquivos (${p.files.length})</h2>
  <table class="evidence-files">
    <thead><tr><th>Caminho</th><th>Estado</th><th>Linhas</th></tr></thead>
    <tbody>${fileRows}</tbody>
  </table>
</section>

${screenshotSection}

`.trim();
}

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #111;
    margin: 0;
    padding: 12mm 14mm;
  }
  .doc-header h1 { font-size: 18pt; margin: 0 0 4pt; }
  .subtitle { margin: 0; color: #444; font-size: 10pt; }
  h2 { font-size: 12pt; margin: 14pt 0 6pt; border-bottom: 1px solid #ccc; padding-bottom: 2pt; }
  .meta dl { display: grid; grid-template-columns: 9em 1fr; gap: 4pt 10pt; margin: 0; }
  .meta dt { font-weight: 600; margin: 0; }
  .meta dd { margin: 0; }
  code, pre { font-family: ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace; font-size: 10pt; }
  pre.technical {
    white-space: pre-wrap;
    background: #f6f6f6;
    border: 1px solid #ddd;
    padding: 8pt;
    border-radius: 4px;
  }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  table.evidence-files {
    table-layout: fixed;
  }
  table.evidence-files th:first-child,
  table.evidence-files td:first-child {
    width: 58%;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; vertical-align: top; }
  th { background: #f0f0f0; text-align: left; }
  .warn { color: #7a5b00; background: #fff8e6; border: 1px solid #e6d08c; padding: 8pt; border-radius: 4px; }
  figure.shot { margin: 12pt 0; page-break-inside: avoid; }
  figure.shot img { max-width: 100%; height: auto; border: 1px solid #ddd; display: block; }
  figure.shot figcaption { font-size: 9pt; margin-top: 4pt; }
  .doc-footer { margin-top: 16pt; font-size: 9pt; color: #555; }
  @media screen {
    html {
      min-height: 100%;
    }
    body {
      width: 100%;
      max-width: 100%;
      padding: 1rem 1.25rem;
    }
  }
  @page { margin: 14mm; }
  @media print {
    body { padding: 0; }
  }
`;

/** Rodapés de página `@bottom-center`: suporte maioritariamente Chromium / impressão. */
const PRINT_PAGE_NUMBER_STYLES = `
  @media print {
    @page {
      margin: 14mm;
      margin-bottom: 22mm;
      @bottom-center {
        content: counter(page);
        font-size: 9pt;
        font-family: system-ui, sans-serif;
      }
    }
  }
`;

export type EvidencePrintHtmlOptions = {
  /** `<title>` e referência ao projeto no exportador; escapado. */
  documentTitle?: string;
  /** Solicita números de página na impressão (suporte depende do motor de PDF). */
  numberPagesPrint?: boolean;
};

export function wrapPrintDocument(
  bodyHtml: string,
  options?: EvidencePrintHtmlOptions,
): string {
  const rawTitle =
    options?.documentTitle?.trim() || "Evidência técnica — EvidenceFlow";
  const title = escapeHtml(rawTitle);
  const styles =
    PRINT_STYLES +
    (options?.numberPagesPrint ? PRINT_PAGE_NUMBER_STYLES : "");
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${styles}</style>
</head>
<body class="evidence-print-root">
${bodyHtml}
</body>
</html>`;
}

export function buildEvidencePrintHtml(
  p: EvidenceDocumentPayload,
  options?: EvidencePrintHtmlOptions,
): string {
  return wrapPrintDocument(buildEvidenceBodyHtml(p), options);
}
