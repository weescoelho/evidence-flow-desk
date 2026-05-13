# Infraestrutura de testes

## Frameworks declarados

| Tipo | Ferramenta | Evidência |
|------|------------|-----------|
| Unitário (JS/TS) | **Ausente** | Sem `vitest`, `jest`, `@testing-library/*` em `package.json`; sem ficheiros `*.test.ts(x)` sob `src/`. |
| Unitário / integração (Rust) | **Ausente** | `Cargo.toml` sem `dev-dependencies` (`cargo test` só compilaria exemplo vazio — sem `#[cfg(test)]` em `src-tauri/src/` ). |
| E2E | **Ausente** | Sem suite E2E (Cypress/Playwright de testes) na raiz do projeto. |

## Organização de testes

- **Pastas típicas** (`tests/`, `__tests__/`, `e2e/`) não existem no snapshot analisado.
- **Nomeação:** N/A até existir primeira suíte.

## Padrões de teste

_Not applicable_ — infraestrutura ainda não estabelecida.

## Execução

| Comando | O que faz (observado) |
|---------|-------------------------|
| `pnpm build` | `tsc && vite build` — verifica tipagem + bundle; não executa testes. |
| `cargo test` dentro de `src-tauri/` | Esperável compilar apenas; não há suites definidas pelo autor. |

Não há script `pnpm test`.

## Cobertura

- Ferramentas de cobertura **não** configuradas (sem `coverage` em configs).

## Matriz de cobertura por camada (estado inicial)

Assume-se alvo TLC: quando testes forem acrescentados, alinhar com `docs/` e guardas de regressão antes de refactor grande.

| Camada do código | Tipo esperado primeiro | Local sugerido após adoção | Comando quando existir |
|------------------|------------------------|----------------------------|-------------------------|
| Utilitários React (`src/lib/*.ts`) | Unit (Vitest recomendado) | `src/lib/**/*.test.ts` | `pnpm test` _(a criar)_ |
| Componentes UI | Unit + `@testing-library/react` | Ao lado ou `src/__tests__/` | idem |
| Comandos Tauri | Unit (`#[test]`/`tokio`) | `src-tauri/src/**/*.rs` | `cargo test --manifest-path src-tauri/Cargo.toml` |
| Fluxos críticos (Git/PDF futuros) | Integração/E2E | pasta `e2e/` ou crates de test | a definir |
| Scripts `pnpm build` | Regressão mínima de tipos | CI | `pnpm build` |

Células equivalentes a **nenhuma** cobertura automatizada hoje — registado também em [.specs/codebase/CONCERNS.md](CONCERNS.md).

## Paralelismo (quando houver suites)

| Tipo futuro | Paralelo seguro? | Notas |
|-------------|-----------------|--------|
| Unit TS isolado mock | Tipicamente sim | Sem estado global partilhado entre ficheiros. |
| E2E Tauri/App | Rever isolamento filesystem/DB quando SQLite existir | Risco de corrida se dois testes usarem mesmo caminho ou DB partilhado. |

_Evidências de DB partilhado ainda não aplicáveis._

## Gate checks (extrair de comandos reais — não inventar)

| Nível | Quando usar | Comando válido neste repo |
|-------|--------------|-------------------------------|
| Rápido / compile | PR pequenas, alterações só TS/React | `pnpm build` |
| Total com testes | Após introduzir `pnpm test` | `pnpm test && pnpm build` _(pipeline a definir)_ |
| Rust | Alterações em `src-tauri/` | `cargo test` / `cargo clippy` _(clippy opcional — não há config no repo)_ |
| Produto/desktop | Marco ou release | `pnpm tauri build` _(ver doc Tauri; não automatizado aqui)_ |

Em **2026-05-12** só `pnpm build` existe como porta de segurança contínua realista no front.
