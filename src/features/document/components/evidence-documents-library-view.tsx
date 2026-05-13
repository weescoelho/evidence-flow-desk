import { SavedEvidenceDocumentsPanel } from "./saved-evidence-documents-panel";

/** Vista ecrã 06 (subset): histórico de cópias HTML guardadas pela app — ver `evidence-history-mvp`. */
export function EvidenceDocumentsLibraryView({
  onNavigateToRepos,
}: {
  onNavigateToRepos: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[12px] text-muted-foreground">
          Histórico
        </p>
        <h1 className="font-mono text-[28px] font-semibold tracking-tight text-foreground">
          Documentos guardados localmente
        </h1>
        <p className="max-w-[56ch] font-mono text-sm text-muted-foreground">
          Cada entrada corresponde a uma cópia HTML criada em «Nova evidência» (passos
          Preview ou Exportar). Para PDF utilize a impressão do sistema a partir do
          HTML ou do próprio assistente.
        </p>
      </header>
      <SavedEvidenceDocumentsPanel layout="library" onNavigateToRepos={onNavigateToRepos} />
    </div>
  );
}
