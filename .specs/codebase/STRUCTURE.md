# Estrutura do repositório

**Raiz do projeto:** `evidence-flow-desk/` (workspace local analisado a 2026-05-12)

## Árvore (até ~3 níveis; omissão de `node_modules`, `dist`, `src-tauri/target`)

```text
.
├── docs/                      # PRD, guias de arquitetura, UI, design (ver .cursor/rules docs-catalogo)
├── .cursor/                   # regras, skills (inclui tlc-spec-driven)
├── .specs/project/           # PROJECT, ROADMAP, STATE (TLC)
├── .specs/codebase/          # este mapeamento brownfield
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── globals.css
│   ├── vite-env.d.ts
│   ├── assets/
│   ├── components/ui/
│   └── lib/utils.ts
├── src-tauri/
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   ├── src/lib.rs
│   ├── src/main.rs
│   └── icons/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
└── pnpm-lock.yaml
```

## Módulos / áreas

### `src/` — interface React

**Propósito:** UI da aplicação; ponto de montagem React.  
**Ficheiros-chave:** `main.tsx`, `App.tsx`, `globals.css`.  
**Nota:** ainda não há `features/`, `pages/`, `store/` segundo a estrutura alvo (`docs/ARCH-GUIDELINES.md`).

### `src/components/ui/`

**Propósito:** primitivas de UI partilháveis estilo design system (ex.: `button.tsx`).  
**Padrão:** shadcn + Radix primitives (`radix-ui`, `Slot`), `cn` para classes.

### `src/lib/`

**Propósito:** utilitários partilhados no front (`utils.ts` — helper `cn`).

### `src-tauri/`

**Propósito:** código nativo Rust, empacotamento, ícones, config Tauri.

| Subárea | Conteúdo |
|---------|----------|
| `src/lib.rs` | `run()`, registro do plugin opener, comandos IPC |
| `src/main.rs` | entry binário |

### `docs/`

**Propósito:** requisitos e guias (`prd.md`, `ARCH-GUIDELINES.md`, `UI-COMPONENTS.md`, `design.pen` via MCP, etc.).

### `.specs/`

**Propósito:** trabalho TLC spec-driven — planeamento persistente (`project/`) e estado do codebase (`codebase/`).

## Onde vive cada capacidade (estado atual)

| Capacidade | UI | Lógica / domínio | Persistência | Configuração |
|------------|-----|-------------------|--------------|---------------|
| Comando exemplo IPC | pode ser chamado pelo front | `src-tauri/src/lib.rs` (`greet`) | — | `tauri.conf.json` |
| Abrir URLs (plugin) | — | plugin registrado em `lib.rs` | — | Cargo / Tauri |
| Evidências / Git / PDF (PRD) | **por implementar** | **por implementar** | **por implementar** | — |
