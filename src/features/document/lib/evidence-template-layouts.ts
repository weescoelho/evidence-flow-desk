/** Variantes de documento persistidas por template (SQLite `layout_key` — subset RF-009). */

export const EVIDENCE_TEMPLATE_LAYOUT_KEYS = [
  "enterprise",
  "minimal",
  "audit",
  "market_standard",
] as const;

export type EvidenceTemplateLayoutKey =
  (typeof EVIDENCE_TEMPLATE_LAYOUT_KEYS)[number];

const DEFAULT_LAYOUT: EvidenceTemplateLayoutKey = "enterprise";

export const EVIDENCE_TEMPLATE_LAYOUT_LABELS: Record<
  EvidenceTemplateLayoutKey,
  string
> = {
  enterprise: "Enterprise — quadro clássico",
  minimal: "Mínimo — mais branco, menos caixas",
  audit: "Auditoria — forte contraste, fonte técnica",
  market_standard:
    "Padrão de mercado — IEEE 829 / ITIL (capa, escopo, changelog)",
};

export function normalizeEvidenceTemplateLayoutKey(
  raw: string | null | undefined,
): EvidenceTemplateLayoutKey {
  const s = (raw ?? "").trim().toLowerCase();
  if (EVIDENCE_TEMPLATE_LAYOUT_KEYS.includes(s as EvidenceTemplateLayoutKey)) {
    return s as EvidenceTemplateLayoutKey;
  }
  return DEFAULT_LAYOUT;
}

const MINIMAL_EXTRA_STYLES = `
  body { color: #1a1a1a; padding: 10mm 12mm; }
  .doc-header h1 { font-size: 16pt; font-weight: 600; }
  .subtitle { color: #52525b; }
  h2 { font-size: 11pt; margin: 10pt 0 4pt; border-bottom: none; }
  .markdown-body {
    background: transparent;
    border: none;
    border-left: 3px solid #d4d4d8;
    padding-left: 10pt;
    border-radius: 0;
  }
  th, td { border-color: #e4e4e7; }
  th { background: #fafafa; }
`;

const AUDIT_EXTRA_STYLES = `
  body {
    font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
    font-size: 10pt;
    color: #000;
    padding: 12mm;
  }
  .doc-header h1 { font-size: 17pt; text-transform: uppercase; letter-spacing: 0.02em; }
  .subtitle { color: #27272a; }
  h2 {
    font-size: 11pt;
    border-bottom: 2px solid #000;
    margin-top: 16pt;
  }
  .markdown-body {
    background: #fff;
    border: 2px solid #18181b;
    border-radius: 0;
  }
  table { border: 2px solid #18181b; }
  th, td { border: 1px solid #18181b; }
  th { background: #f4f4f5; color: #18181b; }
  code { font-weight: 600; }
`;

const MARKET_STANDARD_EXTRA_STYLES = `
  .cover {
    border: 1px solid #d4d4d8;
    border-radius: 8px;
    padding: 12pt 14pt;
    margin-bottom: 14pt;
    background: #fafafa;
  }
  .cover .cover-title { font-size: 17pt; margin: 0 0 12pt; }
  .cover .cover-grid {
    display: grid;
    grid-template-columns: 10em 1fr;
    gap: 4pt 12pt;
    font-size: 10pt;
    margin: 0;
  }
  .cover .cover-grid dt { font-weight: 600; color: #3f3f46; margin: 0; }
  .cover .cover-grid dd { margin: 0; }
  table.changelog th:nth-child(1), table.changelog td:nth-child(1) { width: 6em; }
  table.changelog th:nth-child(2), table.changelog td:nth-child(2) { width: 7.5em; }
  table.changelog th:nth-child(3), table.changelog td:nth-child(3) { width: 7em; }
  .doc-revisions th, .doc-revisions td { font-size: 9.5pt; }
`;

/** CSS extra injectado em `buildEvidencePrintHtml` após o tema base. */
export function evidenceTemplateLayoutCss(layoutKey: string): string {
  const k = normalizeEvidenceTemplateLayoutKey(layoutKey);
  if (k === "minimal") return MINIMAL_EXTRA_STYLES;
  if (k === "audit") return AUDIT_EXTRA_STYLES;
  if (k === "market_standard") return MARKET_STANDARD_EXTRA_STYLES;
  return "";
}
