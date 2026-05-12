/** Filtro case-insensitive por substring (RF-002 P2). */
export function filterBranchNames(names: string[], filter: string): string[] {
  const q = filter.trim().toLowerCase();
  if (!q) return names;
  return names.filter((n) => n.toLowerCase().includes(q));
}
