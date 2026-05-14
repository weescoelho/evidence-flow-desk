import type { CommitRow, FileChangeRow } from "@/features/git/types/git";

import {
  collectRevisionTableRows,
  revisionRowFromPayloadScalars,
  type DocumentRevisionRow,
} from "./document-revision-history";
import { escapeHtml } from "./escape-html";
import {
  evidenceTemplateLayoutCss,
  normalizeEvidenceTemplateLayoutKey,
} from "./evidence-template-layouts";

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
  /** Rótulo do template no documento. */
  templateLabel: string;
  /**
   * Variante visual do PDF/HTML (persistida no template em SQLite — subset RF-009).
   */
  templateLayoutKey: string;
  /** Metadados de rastreio preenchidos no passo 3; vazios omitidos no texto como «—». */
  changeId: string;
  environment: string;
  /** Capa / ITIL — opcionais; fallback «—» ou nome da pasta do repositório. */
  productName?: string;
  releaseVersion?: string;
  deploymentDate?: string;
  technicalOwner?: string;
  approver?: string;
  outOfScope?: string;
  documentVersion?: string;
  documentRevisionDate?: string;
  documentRevisionSummary?: string;
  documentRevisionAuthor?: string;
  /** Entradas já registadas (SQLite); o PDF/HTML concatena com a revisão actual quando diferente. */
  documentRevisionHistory?: DocumentRevisionRow[];
  technicalSummary: string;
  /** RF-007 — texto de negócio; omitido no HTML se vazio. */
  corporateSummary?: string;
  commits: CommitRow[];
  files: FileChangeRow[];
  commitsTruncated: boolean;
  screenshots: EvidenceScreenshotPayload[];
  /** Data URLs do template activo — faixa horizontal no topo (esq. / dir.). */
  templateHeaderImageLeft?: string;
  templateHeaderImageRight?: string;
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

function repositoryBasename(repositoryPath: string): string {
  const parts = repositoryPath.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function displayOrDash(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  return t.length > 0 ? escapeHtml(t) : "—";
}

function formatGeneratedAtLong(): string {
  return escapeHtml(
    new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  );
}

function buildTemplateHeaderBanner(p: EvidenceDocumentPayload): string {
  const left = safeImageDataUrl((p.templateHeaderImageLeft ?? "").trim());
  const right = safeImageDataUrl((p.templateHeaderImageRight ?? "").trim());
  if (!left && !right) return "";
  const leftCell = left
    ? `<img src="${left}" alt="" class="evidence-template-header-img" />`
    : "";
  const rightCell = right
    ? `<img src="${right}" alt="" class="evidence-template-header-img" />`
    : "";
  return `<div class="evidence-template-banner" role="presentation">
  <div class="evidence-template-banner-inner">
    <div class="evidence-template-banner-slot evidence-template-banner-left">${leftCell}</div>
    <div class="evidence-template-banner-slot evidence-template-banner-right">${rightCell}</div>
  </div>
</div>`;
}

function prefixTemplateHeader(
  bodyHtml: string,
  p: EvidenceDocumentPayload,
): string {
  const banner = buildTemplateHeaderBanner(p);
  if (!banner) return bodyHtml;
  return `${banner}\n${bodyHtml}`;
}

function screenshotTableDescriptionHtml(s: EvidenceScreenshotPayload): string {
  const cap = s.caption.trim();
  const fileEsc = escapeHtml(s.fileName);
  if (cap.length > 0) {
    return `<p class="screenshot-desc-lead">${escapeHtml(cap)}</p>
<p class="screenshot-desc-file"><span class="label-muted">Ficheiro</span> <code>${fileEsc}</code></p>`;
  }
  return `<p class="screenshot-desc-lead screenshot-desc-placeholder">Sem descrição informada.</p>
<p class="screenshot-desc-file"><span class="label-muted">Ficheiro</span> <code>${fileEsc}</code></p>`;
}

function buildScreenshotSection(p: EvidenceDocumentPayload): string {
  if (p.screenshots.length === 0) return "";
  const rows = p.screenshots
    .map((s) => {
      const src = safeImageDataUrl(s.dataUrl);
      if (!src) {
        return `<tr class="screenshot-row">
  <td colspan="2" class="screenshot-desc-cell screenshot-desc-cell--invalid">
    <p class="warn">Imagem omitida (formato inválido).</p>
    <p class="screenshot-desc-file"><span class="label-muted">Ficheiro</span> <code>${escapeHtml(s.fileName)}</code></p>
  </td>
</tr>`;
      }
      const alt = escapeHtml(s.caption.trim() || s.fileName);
      const descCell = screenshotTableDescriptionHtml(s);
      return `<tr class="screenshot-row">
  <td class="screenshot-img-cell"><div class="screenshot-img-wrap"><img src="${src}" alt="${alt}" /></div></td>
  <td class="screenshot-desc-cell">${descCell}</td>
</tr>`;
    })
    .join("\n");
  return `<section id="evidence-section-screenshots" class="screenshots">
  <h2>Capturas de ecrã (${p.screenshots.length})</h2>
  <p class="section-lead">Registo das evidências gráficas: cada linha liga a imagem à descrição e ao ficheiro de origem.</p>
  <table class="evidence-screenshots">
    <thead>
      <tr>
        <th scope="col">Imagem</th>
        <th scope="col">Descrição</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</section>`;
}

function buildClassicCommitRows(p: EvidenceDocumentPayload): string {
  if (p.commits.length === 0) {
    return `<tr><td colspan="4">Nenhum commit no intervalo.</td></tr>`;
  }
  return p.commits
    .map((c) => {
      const type = c.conventionalType ? escapeHtml(c.conventionalType) : "—";
      return `<tr>
<td><code>${escapeHtml(c.shortHash)}</code></td>
<td>${type}</td>
<td>${escapeHtml(c.authorName)}</td>
<td>${escapeHtml(c.summary)}</td>
</tr>`;
    })
    .join("\n");
}

function buildClassicFileRows(p: EvidenceDocumentPayload): string {
  if (p.files.length === 0) {
    return `<tr><td colspan="3">Nenhuma alteração de arquivo.</td></tr>`;
  }
  return p.files
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
}

function buildClassicEvidenceBodyHtml(p: EvidenceDocumentPayload): string {
  const generatedAt = formatGeneratedAtLong();
  const templateLine = escapeHtml(p.templateLabel.trim() || "padrão");
  const changeLine = escapeHtml(p.changeId.trim() || "—");
  const envLine = escapeHtml(p.environment.trim() || "—");

  const commitRows = buildClassicCommitRows(p);
  const fileRows = buildClassicFileRows(p);

  const truncNote = p.commitsTruncated
    ? `<p class="warn"><strong>Atenção:</strong> a lista de commits foi truncada pelo limite de segurança da aplicação.</p>`
    : "";

  const screenshotSection = buildScreenshotSection(p);

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
  <table class="evidence-table">
    <thead><tr><th>Hash</th><th>Tipo</th><th>Autor</th><th>Resumo</th></tr></thead>
    <tbody>${commitRows}</tbody>
  </table>
</section>

<section id="evidence-section-files">
  <h2>Arquivos (${p.files.length})</h2>
  <table class="evidence-files evidence-table">
    <thead><tr><th>Caminho</th><th>Estado</th><th>Linhas</th></tr></thead>
    <tbody>${fileRows}</tbody>
  </table>
</section>

${screenshotSection}

`.trim();
}

function buildMarketStandardBodyHtml(p: EvidenceDocumentPayload): string {
  const product =
    (p.productName ?? "").trim() ||
    repositoryBasename(p.repositoryPath) ||
    "—";
  const productTitle = escapeHtml(product);
  const versionLine = displayOrDash(p.releaseVersion);
  const deployLine = displayOrDash(p.deploymentDate);
  const envLine = displayOrDash(p.environment);
  const changeLine = displayOrDash(p.changeId);
  const ownerLine = displayOrDash(p.technicalOwner);
  const approverLine = displayOrDash(p.approver);
  const generatedAt = formatGeneratedAtLong();

  const revisionRows = collectRevisionTableRows(
    p.documentRevisionHistory,
    revisionRowFromPayloadScalars({
      documentVersion: p.documentVersion,
      documentRevisionDate: p.documentRevisionDate,
      documentRevisionSummary: p.documentRevisionSummary,
      documentRevisionAuthor: p.documentRevisionAuthor,
    }),
  );

  function formatRevisionRowCells(row: DocumentRevisionRow): string {
    const docVer = row.version.trim() || "1.0";
    const docDate =
      row.date.trim() || new Date().toLocaleDateString("pt-BR");
    const docWhat = row.summary.trim() || "Emissão inicial";
    const docAuthorRaw = row.author.trim();
    const docAuthor =
      docAuthorRaw.length > 0
        ? escapeHtml(docAuthorRaw)
        : displayOrDash(p.technicalOwner);

    return `<tr>
        <td>${escapeHtml(docVer)}</td>
        <td>${escapeHtml(docDate)}</td>
        <td>${escapeHtml(docWhat)}</td>
        <td>${docAuthor}</td>
      </tr>`;
  }

  const revisionTableBody = revisionRows.map(formatRevisionRowCells).join("\n      ");

  const corpor = (p.corporateSummary ?? "").trim();
  const tech = p.technicalSummary;
  const execBlock =
    corpor.length > 0
      ? `<pre class="technical">${escapeHtml(corpor)}</pre>${
          tech.trim().length > 0
            ? `<h3>Contexto técnico</h3><pre class="technical">${escapeHtml(tech)}</pre>`
            : ""
        }`
      : `<pre class="technical">${escapeHtml(tech)}</pre>`;

  const truncNote = p.commitsTruncated
    ? `<p class="warn"><strong>Atenção:</strong> a lista de commits foi truncada pelo limite de segurança da aplicação.</p>`
    : "";

  const fileRows = buildClassicFileRows(p);
  const screenshotSection = buildScreenshotSection(p);

  return `
<section id="evidence-section-cover" class="cover">
  <p class="cover-title">${productTitle}</p>
  <dl class="cover-grid">
    <dt>Versão da entrega</dt><dd>${versionLine}</dd>
    <dt>Data de implantação</dt><dd>${deployLine}</dd>
    <dt>Ambiente</dt><dd>${envLine}</dd>
    <dt>Change ID / ticket</dt><dd>${changeLine}</dd>
    <dt>Responsável técnico</dt><dd>${ownerLine}</dd>
    <dt>Aprovador</dt><dd>${approverLine}</dd>
    <dt>Gerado em</dt><dd>${generatedAt}</dd>
    <dt>Escopo Git (base → compare)</dt><dd>${escapeHtml(p.baseRef)} → ${escapeHtml(p.compareRef)}</dd>
  </dl>
</section>

${truncNote}

<section id="evidence-section-doc-revisions">
  <h2>Controle de versões do documento</h2>
  <table class="doc-revisions evidence-table">
    <thead>
      <tr>
        <th>Versão</th>
        <th>Data</th>
        <th>Alteração</th>
        <th>Responsável</th>
      </tr>
    </thead>
    <tbody>
      ${revisionTableBody}
    </tbody>
  </table>
</section>

<section id="evidence-section-exec-summary">
  <h2>Resumo executivo</h2>
  ${execBlock}
</section>


${screenshotSection}

<section id="evidence-section-appendix-git">
  <h3>Escopo técnico</h3>
  <table class="evidence-files evidence-table">
    <thead><tr><th>Caminho</th><th>Estado</th><th>Linhas</th></tr></thead>
    <tbody>${fileRows}</tbody>
  </table>
</section>

`.trim();
}

/**
 * Corpo do documento em HTML seguro (apenas texto escapado).
 * Reutilizado no preview (RF-010) e dentro do envoltório de impressão (RF-011).
 */
export function buildEvidenceBodyHtml(p: EvidenceDocumentPayload): string {
  const layout = normalizeEvidenceTemplateLayoutKey(p.templateLayoutKey);
  const inner =
    layout === "market_standard"
      ? buildMarketStandardBodyHtml(p)
      : buildClassicEvidenceBodyHtml(p);
  return prefixTemplateHeader(inner, p);
}

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    font-size: 10.75pt;
    line-height: 1.5;
    color: #1c1917;
    margin: 0;
    padding: 11mm 13mm;
    background: #fff;
  }
  .doc-header {
    margin-bottom: 12pt;
    padding-bottom: 12pt;
    border-bottom: 1px solid #e7e5e4;
  }
  .doc-header h1 {
    font-size: 20pt;
    font-weight: 700;
    margin: 0 0 6pt;
    color: #0c0a09;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .subtitle {
    margin: 0;
    color: #57534e;
    font-size: 9.75pt;
    font-weight: 500;
  }
  .subtitle strong { color: #44403c; font-weight: 600; }
  .cover-title {
    margin: 0 0 10pt;
    font-size: 16pt;
    font-weight: 700;
    color: #0c0a09;
    letter-spacing: -0.02em;
    line-height: 1.25;
  }
  .evidence-template-banner { width: 100%; margin: 0 0 12pt; }
  .evidence-template-banner-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8pt;
    width: 100%;
  }
  .evidence-template-banner-slot {
    flex: 1 1 0;
    min-width: 0;
    max-width: 48%;
    min-height: 2pt;
    display: flex;
    align-items: flex-start;
  }
  .evidence-template-banner-left { justify-content: flex-start; }
  .evidence-template-banner-right { justify-content: flex-end; }
  .evidence-template-header-img {
    max-height: 11mm;
    max-width: 42mm;
    width: auto;
    height: auto;
    object-fit: contain;
    object-position: top center;
  }
  section { margin-bottom: 2pt; }
  h2 {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.055em;
    color: #292524;
    margin: 18pt 0 8pt;
    padding-bottom: 6pt;
    border-bottom: 2px solid #292524;
  }
  h3 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #44403c;
    margin: 14pt 0 6pt;
    letter-spacing: 0.02em;
  }
  .section-lead {
    margin: -2pt 0 10pt;
    font-size: 9.5pt;
    color: #57534e;
    line-height: 1.45;
    max-width: 62em;
  }
  .meta { margin: 8pt 0 6pt; }
  .meta dl {
    display: grid;
    grid-template-columns: 10.5em 1fr;
    gap: 6pt 14pt;
    margin: 0;
    padding: 12pt 14pt;
    background: #fafaf9;
    border: 1px solid #e7e5e4;
    border-radius: 6px;
  }
  .meta dt {
    font-weight: 600;
    color: #44403c;
    margin: 0;
    font-size: 9.5pt;
  }
  .meta dd {
    margin: 0;
    color: #1c1917;
    font-size: 10pt;
  }
  code, pre {
    font-family: ui-monospace, "Cascadia Mono", "Segoe UI Mono", "Consolas", monospace;
    font-size: 9.75pt;
  }
  pre.technical {
    white-space: pre-wrap;
    word-wrap: break-word;
    background: #fafaf9;
    border: 1px solid #e7e5e4;
    padding: 10pt 12pt;
    border-radius: 6px;
    line-height: 1.55;
    margin: 4pt 0 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin: 6pt 0 10pt;
  }
  table.evidence-table tbody tr:nth-child(even) td {
    background: #fafaf9;
  }
  thead th {
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #44403c;
    background: #f5f5f4;
    border: 1px solid #d6d3d1;
    padding: 7pt 9pt;
    text-align: left;
  }
  tbody td {
    border: 1px solid #e7e5e4;
    padding: 7pt 9pt;
    vertical-align: top;
  }
  table.evidence-files {
    table-layout: fixed;
  }
  table.evidence-files th:first-child,
  table.evidence-files td:first-child {
    width: 58%;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  table.evidence-screenshots {
    table-layout: fixed;
    margin-top: 4pt;
  }
  table.evidence-screenshots thead th:first-child { width: 50%; }
  table.evidence-screenshots thead th:nth-child(2) { width: 50%; }
  table.evidence-screenshots tbody tr {
    page-break-inside: avoid;
  }
  table.evidence-screenshots tbody tr:nth-child(even) .screenshot-img-cell {
    background: #ebe9e6;
  }
  table.evidence-screenshots tbody tr:nth-child(even) .screenshot-desc-cell {
    background: #f5f5f4;
  }
  table.evidence-screenshots tbody tr:nth-child(odd) .screenshot-img-cell {
    background: #f0efed;
  }
  table.evidence-screenshots tbody tr:nth-child(odd) .screenshot-desc-cell {
    background: #fff;
  }
  .screenshot-img-cell {
    text-align: center;
    vertical-align: middle;
    padding: 10pt !important;
  }
  .screenshot-img-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 24pt;
  }
  .screenshot-img-cell img {
    max-width: 100%;
    max-height: 62mm;
    width: auto;
    height: auto;
    object-fit: contain;
    border: 1px solid #d6d3d1;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    display: block;
  }
  .screenshot-desc-cell {
    font-size: 10pt;
    line-height: 1.5;
  }
  .screenshot-desc-cell--invalid .warn { margin-bottom: 8pt; }
  .screenshot-desc-lead {
    margin: 0 0 8pt;
    color: #1c1917;
  }
  .screenshot-desc-placeholder {
    color: #78716c;
    font-style: italic;
  }
  .screenshot-desc-file {
    margin: 0;
    font-size: 9pt;
    color: #57534e;
  }
  .label-muted {
    font-size: 8.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #a8a29e;
    margin-right: 6pt;
  }
  .screenshot-desc-file code {
    font-size: 9pt;
    color: #44403c;
    background: transparent;
    padding: 0;
    border: none;
  }
  .warn {
    color: #713f12;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    padding: 9pt 10pt;
    border-radius: 6px;
    font-size: 10pt;
    line-height: 1.45;
    margin: 0 0 8pt;
  }
  .doc-footer { margin-top: 18pt; font-size: 9pt; color: #57534e; }
  @media screen {
    html { min-height: 100%; }
    body {
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 0 0 1px #e7e5e4;
      min-height: 100vh;
    }
  }
  @page { margin: 14mm; }
  @media print {
    body {
      padding: 0;
      box-shadow: none;
      max-width: none;
    }
  }
`;

/** Rodapés de página `@bottom-center`: suporte maioritariamente Chromium / impressão. */
const PRINT_PAGE_NUMBER_STYLES = `
  @media print {
    @page {
      margin: 14mm;
      margin-bottom: 28mm;
      @bottom-center {
        content: counter(page);
        font-size: 9pt;
        font-family: system-ui, sans-serif;
        vertical-align: top;
        padding-top: 4mm;
        padding-bottom: 2mm;
      }
    }
  }
`;

export type EvidencePrintHtmlOptions = {
  /** `<title>` e referência ao projeto no exportador; escapado. */
  documentTitle?: string;
  /** Solicita números de página na impressão (suporte depende do motor de PDF). */
  numberPagesPrint?: boolean;
  /** Estilos extra (tema do template activo). */
  extraPrintStyles?: string;
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
    (options?.extraPrintStyles ?? "") +
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
  const merged: EvidencePrintHtmlOptions = {
    ...options,
    extraPrintStyles:
      (options?.extraPrintStyles ?? "") +
      evidenceTemplateLayoutCss(p.templateLayoutKey),
  };
  return wrapPrintDocument(buildEvidenceBodyHtml(p), merged);
}
