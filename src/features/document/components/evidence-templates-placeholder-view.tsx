/** Vista global Templates (subset UI-R01): hub futuro para presets — stub até edição/logo/temas (RF-009). */
export function EvidenceTemplatesPlaceholderView() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[12px] text-muted-foreground">
          Templates
        </p>
        <h1 className="font-mono text-[28px] font-semibold tracking-tight text-foreground">
          Modelos de documento
        </h1>
        <p className="max-w-[56ch] font-mono text-sm text-muted-foreground">
          No assistente «Nova evidência» já podes escolher o template ativo e criar
          presets personalizados (SQLite). Este ecrã servirá, mais tarde, para
          listar, editar visualmente e organizar todos os templates da aplicação
          num só sítio.
        </p>
      </header>
      <section
        className="rounded-lg border border-border border-dashed bg-card/50 p-6"
        aria-label="Conteúdo previsto"
      >
        <p className="font-mono text-[13px] text-muted-foreground">
          Área reservada — gestão central de templates ainda não implementada.
        </p>
      </section>
    </div>
  );
}
