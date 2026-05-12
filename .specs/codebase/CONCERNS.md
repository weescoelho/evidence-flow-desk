# Riscos e preocupações no codebase

**Data da análise:** 2026-05-12  
_Baseada em evidência de ficheiros e manifestos — não auditoria de segurança profunda._

## Dívida técnica

**Arquitetura alvo incompleta**

- **Problema:** `docs/ARCH-GUIDELINES.md` define `features/*` vertical slices; código atual concentra quase toda a UI em `src/App.tsx` sem slices.
- **Ficheiros:** `src/App.tsx`; ausência de `src/features/`.
- **Impacto:** risco de crescimento desorganizado e acoplamento difícil de reverter.
- **Abordagem:** ao implementar cada RF do PRD, criar estruturas `features/<nome>/...` desde o primeiro incremento aplicável.

**Comando exemplo e título genéricos**

- **Problema:** `greet` e `index.html` com título "Tauri + React + Typescript" — legado template.
- **Ficheiros:** `src-tauri/src/lib.rs`, `index.html`.
- **Impacto:** confusão em demos; comando morto pode permanecer se não removido.
- **Abordagem:** remover ou substituir por comandos de domínio quando Git/PDF entrarem.

## Lacunas críticas (funcionalidade)

**Produto MVP do PRD ainda não iniciado**

- **Problema:** sem leitura Git, PDF, templates, SQLite, ou fluxos de evidência — só shell UI + Rust mínimo.
- **Impacto:** [.specs/project/ROADMAP.md](../project/ROADMAP.md) permanece maioritariamente **PLANNED**.
- **Abordagem:** primeira feature sob `.specs/features/<slug>/` com `spec.md` + tarefas (TLC).

## Cobertura de testes

**Ausência total**

- **Problema:** sem framework de teste nas dependências; sem portas rápidas de regressão além `pnpm build`.
- **Ver:** [.specs/codebase/TESTING.md](TESTING.md).
- **Impacto:** refactors tardios são arriscados; regressões só detectadas manualmente ou no build TS.
- **Abordagem:** introduzir Vitest + `@testing-library/react` para utilities e um smoke test quando houver primeira feature estável.

## Segurança

**Content Security Policy (CSP) desativada**

- **Problema:** `src-tauri/tauri.conf.json` define `"csp": null` em `app.security`.
- **Risco:** se no futuro a UI incorporar HTML/JS remoto ou `iframe`/`webview` content não confiável, reduz defesa em profundidade.
- **Mitigação atual:** apenas conteúdo da build local típico de Tauri+Vite starter.
- **Recomendação:** quando houver conteúdo remoto ou user-generated HTML para PDF preview, reapreciar CSP conforme docs Tauri 2.

**Processamento local (alinhamento PRD)**

- **Esperado pelo PRD (RNF-002):** nada enviar a terceiros sem consentimento — ainda não há código de outbound; repetir revisão sempre que aparecer cliente HTTP/API keys.

## Performance

**Sem medições aplicáveis** — codebase demasiado pequeno para gargalos.

- **Futuro:** processamento de grandes listas Git / diffs (PRD até 1000 commits) — será preocupação quando Rust/TS implementarem esses caminhos.

## Fragilidades

**Config Vite/HMR**

- **Onde:** `vite.config.ts` — `hmr` depende de `TAURI_DEV_HOST` para redes remotas.
- **Motivo fragilidade:** erros só aparecem em cenários específicos (dev atrás de LAN); documentação já presente nos comentários Tauri template.

## Dependências

**Sem alerta verificado automatizado**

- Não foram corridos `pnpm audit`, `cargo audit`, ou renovate na sessão — **lacuna de dados**, não problema confirmado.

## Resumo prioritizado

| Prioridade | Item | Acção seguinte típica |
|------------|------|------------------------|
| Alta | Ausência testes automatizados | Definir stack (Vitest) + primeiro teste quando `lib/` ganhar lógica. |
| Alta | Arquitetura vs. guias | Primeira feature nova em `features/`. |
| Média | CSP null | Rever ao integrar conteúdo remoto/UIs avançadas. |
| Baixa | `greet`/título demo | Limpeza cosmética. |
