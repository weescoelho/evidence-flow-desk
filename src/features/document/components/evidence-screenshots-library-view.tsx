import { EvidenceScreenshotsSection } from "@/features/evidence";
import { useGitStore } from "@/features/git/store/git-store";

/**
 * Vista global Screenshots (UI-R01): mesma lista/CRUD do passo 3 (`useEvidenceAttachmentsStore`),
 * acessível pela sidebar — mesma lista que o passo 3; persistência por repositório na SQLite.
 */
export function EvidenceScreenshotsLibraryView() {
  const repositoryPath = useGitStore((s) => s.repositoryPath);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[12px] text-muted-foreground">
          Screenshots
        </p>
        <h1 className="font-mono text-[28px] font-semibold tracking-tight text-foreground">
          Biblioteca de capturas
        </h1>
        <p className="max-w-[56ch] font-mono text-sm text-muted-foreground">
          Anexe imagens e legendas; os dados são os mesmos do passo 3 e persistem neste
          computador por pasta Git (SQLite).
        </p>
      </header>

      {!repositoryPath ? (
        <section
          className="rounded-xl border border-dashed border-border bg-card/50 p-6"
          aria-label="Repositório necessário"
        >
          <p className="font-mono text-[13px] text-muted-foreground">
            Seleccione uma pasta Git em{" "}
            <span className="font-semibold text-foreground">Repositórios</span>{" "}
            para importar e gerir capturas aqui.
          </p>
        </section>
      ) : (
        <EvidenceScreenshotsSection />
      )}
    </div>
  );
}
