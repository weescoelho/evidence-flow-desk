/** Nome sugerido para «Guardar HTML como» (refs Git sanitizadas). */
export function defaultEvidenceHtmlFileName(
  baseRef: string,
  compareRef: string,
): string {
  return `evidencia-${safeFileNameSegment(baseRef)}-${safeFileNameSegment(compareRef)}.html`;
}

export function safeFileNameSegment(ref: string): string {
  const s = ref.replace(/[/\\?%*:|"<>]/g, "-").trim();
  return s.length > 0 ? s.slice(0, 80) : "ref";
}
