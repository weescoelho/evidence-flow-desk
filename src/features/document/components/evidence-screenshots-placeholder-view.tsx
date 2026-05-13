/** Vista global Screenshots (subset UI-R01): biblioteca agregada — stub; anexos por sessão permanecem no passo 3. */
export function EvidenceScreenshotsPlaceholderView() {
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
          As capturas continuam associadas ao fluxo atual no passo 3 do assistente.
          Esta vista será para uma biblioteca global, pesquisa e reutilização entre
          evidências quando a persistência de anexos (RF-015 / RF-014) evoluir.
        </p>
      </header>
      <section
        className="rounded-lg border border-border border-dashed bg-card/50 p-6"
        aria-label="Conteúdo previsto"
      >
        <p className="font-mono text-[13px] text-muted-foreground">
          Área reservada — nenhuma biblioteca global neste momento.
        </p>
      </section>
    </div>
  );
}
