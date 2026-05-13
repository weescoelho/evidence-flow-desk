export type DocumentRevisionRow = {
  version: string;
  date: string;
  summary: string;
  author: string;
};

export const MAX_DOCUMENT_REVISION_HISTORY_ROWS = 100;

export function normalizeDocumentRevisionRow(r: DocumentRevisionRow): DocumentRevisionRow {
  return {
    version: r.version.trim(),
    date: r.date.trim(),
    summary: r.summary.trim(),
    author: r.author.trim(),
  };
}

export function revisionRowsAreEqual(a: DocumentRevisionRow, b: DocumentRevisionRow): boolean {
  const x = normalizeDocumentRevisionRow(a);
  const y = normalizeDocumentRevisionRow(b);
  return (
    x.version === y.version &&
    x.date === y.date &&
    x.summary === y.summary &&
    x.author === y.author
  );
}

function isRevisionRecord(v: unknown): v is DocumentRevisionRow {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.version === "string" &&
    typeof o.date === "string" &&
    typeof o.summary === "string" &&
    typeof o.author === "string"
  );
}

/** Interpreta JSON gravado em `evidence.document_revision_history`. */
export function parseDocumentRevisionHistoryJson(raw: string | undefined): DocumentRevisionRow[] {
  const s = raw?.trim();
  if (!s) return [];
  try {
    const data = JSON.parse(s) as unknown;
    if (!Array.isArray(data)) return [];
    const rows = data.filter(isRevisionRecord).map((r) => normalizeDocumentRevisionRow(r));
    return rows.slice(-MAX_DOCUMENT_REVISION_HISTORY_ROWS);
  } catch {
    return [];
  }
}

export function serializeDocumentRevisionHistory(rows: DocumentRevisionRow[]): string {
  const capped = rows.slice(-MAX_DOCUMENT_REVISION_HISTORY_ROWS);
  return JSON.stringify(capped);
}

/** Linhas da tabela «Controle de versões»: histórico persistido + revisão actual se distinta da última. */
export function collectRevisionTableRows(
  history: DocumentRevisionRow[] | undefined,
  current: DocumentRevisionRow,
): DocumentRevisionRow[] {
  const h = [...(history ?? [])];
  const c = normalizeDocumentRevisionRow(current);
  const last = h[h.length - 1];
  const currentHasContent =
    Boolean(c.version) || Boolean(c.date) || Boolean(c.summary) || Boolean(c.author);

  if (!currentHasContent) {
    return h.length > 0 ? h : [{ version: "", date: "", summary: "", author: "" }];
  }
  if (last && revisionRowsAreEqual(last, c)) {
    return h;
  }
  return [...h, c];
}

export function revisionRowFromPayloadScalars(p: {
  documentVersion?: string;
  documentRevisionDate?: string;
  documentRevisionSummary?: string;
  documentRevisionAuthor?: string;
}): DocumentRevisionRow {
  return normalizeDocumentRevisionRow({
    version: p.documentVersion ?? "",
    date: p.documentRevisionDate ?? "",
    summary: p.documentRevisionSummary ?? "",
    author: p.documentRevisionAuthor ?? "",
  });
}
