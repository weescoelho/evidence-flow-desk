# Tech stack

**Analisado em:** 2026-05-12

## Core

- **Frontend:** React 19.1.x + TypeScript (~5.8.3), bundler **Vite** 7.0.x (`package.json`).
- **Runtime desktop:** **Tauri 2** (`@tauri-apps/api`, `@tauri-apps/cli`, `tauri` / `Cargo.toml`).
- **Linguagens:** TypeScript (ESM, `strict` em `tsconfig.json`); Rust **edition 2021** (`src-tauri/Cargo.toml`).
- **Gestor de pacotes:** **pnpm** (presença de `pnpm-lock.yaml`).

## Frontend

| Área | Tecnologia observada |
|------|----------------------|
| UI | React 19, componente base tipo shadcn em `src/components/ui/button.tsx` (CVA, `radix-ui` Slot) |
| Estilo | Tailwind CSS 4 (`@tailwindcss/vite`), `tailwind-merge`, `clsx`, tokens em `globals.css` + `@theme inline` |
| Tipografia | JetBrains Mono Variable (`@fontsource-variable/jetbrains-mono`) |
| Formulários / validação (deps instaladas, pouco uso ainda) | `react-hook-form`, `zod`, `@hookform/resolvers` |
| Estado global | **Zustand** 5.x listado como dependência; ainda não há stores no `src/` |
| Ícones | `lucide-react` |

## Backend local (Rust / Tauri)

- **Crates:** `tauri` 2, `tauri-plugin-opener` 2, `serde`, `serde_json`.
- **Comandos expostos:** apenas `greet` em `src-tauri/src/lib.rs` — padrão de exemplo.
- **Binary:** `main.rs` delega para `evidence_flow_desk_lib::run()`.

## Persistência / dados

- **Não há** SQLite, ORM nem scripts de migração no repositório no momento da análise (alinhado ao PRD como trabalho futuro).

## Testing

- **Nenhum** framework de teste listado em `package.json`, `Cargo.toml` ou ficheiros `*.test.*` / `__tests__` detetados.
- Estado: infraestrutura de testes **ausente**.

## Serviços externos

- App atual **não** integra APIs cloud obrigatórias; apenas capacidade futura prevista em `docs/prd.md` (IA opcional, Jira, etc.).
- **`tauri-plugin-opener`:** abertura de URLs/links no navegador do sistema (integração ao SO, não a um SaaS).

## Ferramentas de desenvolvimento

- **Build front:** `pnpm build` → `tsc && vite build`.
- **Dev:** `pnpm dev` (porta fixa **1420** em `vite.config.ts`, esperada pelo fluxo `tauri dev`).
- **`tauri`:** subcomandos via `pnpm tauri`.

## Divergências PRD ↔ repo

Declarado em `docs/prd.md` mas **sem** entrada direta equivalente nas dependências atuais: TanStack Query, Handlebars/EJS, motor HTML→PDF, Playwright, Shiki — ver [.specs/project/PROJECT.md](../project/PROJECT.md).
