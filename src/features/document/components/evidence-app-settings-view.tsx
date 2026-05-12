/** Vista ecrã 07 (subset UI-R06): preferências globais — stub até Fase 2 (IA, limites). */
export function EvidenceAppSettingsView() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[12px] text-muted-foreground">
          Configurações
        </p>
        <h1 className="font-mono text-[28px] font-semibold tracking-tight text-foreground">
          Preferências da aplicação
        </h1>
        <p className="max-w-[56ch] font-mono text-sm text-muted-foreground">
          No MVP, caminhos de exportação, template ativo, Change ID e ambiente são
          guardados localmente (SQLite) a partir do assistente «Nova evidência»
          (passos 3 e 5). Aqui entrarão, mais tarde, integrações de IA, limites de
          escopo e outras opções globais (ver jornada de UI e PRD).
        </p>
      </header>
      <section
        className="rounded-lg border border-border border-dashed bg-card/50 p-6"
        aria-label="Conteúdo previsto"
      >
        <p className="font-mono text-[13px] text-muted-foreground">
          Área reservada — nada a configurar neste ecrã por enquanto.
        </p>
      </section>
    </div>
  );
}
