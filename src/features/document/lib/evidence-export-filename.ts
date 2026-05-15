/** Nome sugerido para «Guardar HTML como» (refs Git sanitizadas). */
export function defaultEvidenceHtmlFileName(branchRefs: string[]): string {
  const seg = branchRefs
    .map(safeFileNameSegment)
    .join("-")
    .slice(0, 120);
  return `evidencia-${seg.length > 0 ? seg : "escopo"}.html`;
}

export function safeFileNameSegment(ref: string): string {
  const s = ref.replace(/[/\\?%*:|"<>]/g, "-").trim();
  return s.length > 0 ? s.slice(0, 80) : "ref";
}
