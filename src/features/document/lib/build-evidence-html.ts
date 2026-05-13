import type { CommitRow, FileChangeRow } from "@/features/git/types/git";

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

function buildScreenshotSection(p: EvidenceDocumentPayload): string {
  if (p.screenshots.length === 0) return "";
  return `<section id="evidence-section-screenshots" class="screenshots">
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

  const docVer = (p.documentVersion ?? "").trim() || "1.0";
  const docDate =
    (p.documentRevisionDate ?? "").trim() ||
    new Date().toLocaleDateString("pt-BR");
  const docWhat =
    (p.documentRevisionSummary ?? "").trim() || "Emissão inicial";
  const docAuthorRaw = (p.documentRevisionAuthor ?? "").trim();
  const docAuthor =
    docAuthorRaw.length > 0
      ? escapeHtml(docAuthorRaw)
      : displayOrDash(p.technicalOwner);

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
  <p style="margin:0 0 8pt;font-size:14pt;font-weight:600">${productTitle}</p>
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
  <table class="doc-revisions">
    <thead>
      <tr>
        <th>Versão</th>
        <th>Data</th>
        <th>Alteração</th>
        <th>Responsável</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(docVer)}</td>
        <td>${escapeHtml(docDate)}</td>
        <td>${escapeHtml(docWhat)}</td>
        <td>${docAuthor}</td>
      </tr>
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
  <table class="evidence-files">
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
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #111;
    margin: 0;
    padding: 12mm 14mm;
  }
  .doc-header h1 { font-size: 18pt; margin: 0 0 4pt; }
  .subtitle { margin: 0; color: #444; font-size: 10pt; }
  .evidence-template-banner { width: 100%; margin: 0 0 12pt; }
  .evidence-template-banner-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10pt;
    width: 100%;
  }
  .evidence-template-banner-slot {
    flex: 1 1 0;
    min-width: 0;
    min-height: 4pt;
    display: flex;
  }
  .evidence-template-banner-left { justify-content: flex-start; }
  .evidence-template-banner-right { justify-content: flex-end; }
  .evidence-template-header-img {
    max-height: 26mm;
    max-width: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  h2 { font-size: 12pt; margin: 14pt 0 6pt; border-bottom: 1px solid #ccc; padding-bottom: 2pt; }
  h3 { font-size: 11pt; margin: 10pt 0 4pt; font-weight: 600; }
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
