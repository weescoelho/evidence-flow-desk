# Arquitetura (estado observado)

**Padrão identificado:** aplicação **desktop monolítica** Tauri (WebView + binário Rust); front-end SPA React. O desenho alvo em `docs/ARCH-GUIDELINES.md` é **Vertical Slice por feature** (`features/git`, etc.) — essa estrutura **ainda não existe** no `src/`; só existe o mínimo de arranque.

## Vista de alto nível

```text
┌─────────────────────────────────────┐
│  BrowserView (React + Vite)         │  vite dev / dist estático em build
└─────────────────┬───────────────────┘
                  │ IPC invoke (presente apenas comando exemplo `greet`)
┌─────────────────▼───────────────────┐
│  Rust: tauri::Builder               │  tauri_plugin_opener
│  src-tauri/src/lib.rs               │
└─────────────────────────────────────┘
```

## Fluxo de dados atual

| Fluxo | Estado |
|--------|--------|
| UI → comandos Tauri | **Definido** no Rust (`greet`); **não referenciado** em `src/App.tsx` — sem chamadas `invoke` no front à data da análise |
| Persistência local / Git / PDF | **Inexistente** no código |

## Organização observada vs. orientação oficial

**Documentado (target):** [`docs/ARCH-GUIDELINES.md`](../../docs/ARCH-GUIDELINES.md) — pastas `src/features/<domínio>/`, `core/`, `components/ui` apenas partilhado, `store/` Zustand, `src-tauri/src/commands/` por domínio.

**Implementado:**

- `src/App.tsx` — página raiz trivial (`<main className="container">`).
- `src/components/ui/button.tsx` — botão estilo design system (`cva`, `cn`, variants).
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge).
- `src/globals.css` — entrada Tailwind + tema shadcn + variáveis.
- **`src/features/` não existe.**

**Implicação:** próximos incrementos devem **criar** slices em `features/` conforme cada RF, em vez de crescer `App.tsx` de forma não modular.

## Padrões concretos

### Composição de UI com tokens Tailwind (`cn` + variantes)

**Onde:** `src/components/ui/button.tsx`  
**Finalidade:** componentes consistentes com `class-variance-authority` e classes semânticas (`data-slot`, `data-variant`).  
**Exemplo:**

```tsx
function Button({ className, variant = "default", size = "default", asChild = false, ...props })
```

### Entrada Rust unificada (`lib.rs`)

**Onde:** `src-tauri/src/lib.rs`  
**Finalidade:** registar plugins e `generate_handler![...]`; `main.rs` só invoca `run()`.

## Fronteira tecnológica Tauri

- Config: `src-tauri/tauri.conf.json` — `identifier` `com.wcoelho.evidence-flow-desktop`, `devUrl` `http://localhost:1420`, `frontendDist` `../dist`.
- **CSP** em `app.security` definida como `null` (`"csp": null`) — comportamento especial do Tauri; rever impacto antes de integrar conteúdo remoto não confiável (ver `.specs/codebase/CONCERNS.md`).
