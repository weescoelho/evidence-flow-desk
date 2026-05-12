# Convenções observadas no código

Baseado em amostragem dos ficheiros presentes (`App.tsx`, `main.tsx`, `components/ui/button.tsx`, `lib/utils.ts`, `vite.config.ts`, `lib.rs`). Para normas escritas pelo projecto ver [`docs/CLEAN-CODE-GUIDELINES.md`](../../docs/CLEAN-CODE-GUIDELINES.md).

## Nomes de ficheiros

| Tipo | Padrão observado |
|------|------------------|
| Componentes React | **PascalCase** — `App.tsx`, `button.tsx` (subpasta semântica `ui/`). |
| Entry | `main.tsx` minúsculo. |
| Utilitários | `utils.ts` em `lib/`. |
| Rust | `snake_case` — `lib.rs`, `main.rs`, comando `fn greet(...)`. |

## Componentes React

- Preferência por **export default** no `App` (`export default App`).
- Uso de `React.StrictMode` em `main.tsx`.
- Hook-form / Zustand aparecem nas dependências; **sem** convenção de nomenclatura de hooks custom ainda (não há `use*` no `src/` excepto internals de libs).

### Exemplo imports (`main.tsx`)

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
```

### Exemplo aliases (`button.tsx`)

```tsx
import { cn } from "@/lib/utils"
```

Alias `@/*` → `./src/*` (`tsconfig.json`).

## TypeScript

- `strict`: true; `noUnusedLocals` / `noUnusedParameters` activos — evitar parâmetros e variáveis não usadas.
- `jsx`: `react-jsx` (sem `import React` obrigatório por ficheiro, embora `main.tsx` importe React explicitamente).

## Estilização

- Classes Tailwind compostas através de **`cn`** (`clsx` + `tailwind-merge`) para evitar conflitos.
- Componentes UI usam **CVA** (`class-variance-authority`) para variants (`variant`, `size`).
- Tokens de cor/fonte via CSS variables em `:root` / tema em `globals.css` (`oklch`, variáveis `--sidebar-*`, `--primary`, etc.) — alinhado ao fluxo documentado em `docs/UI-COMPONENTS.md`.

## Formatação e lint

- **Nenhum** `eslint` / `prettier` listado em `package.json` na data da análise — convenção de formato **implicitamente** pela escrita manual + TypeScript compiler.

## Comentários

- Poucos comentários; `vite.config.ts` inclui numeração explicativa (Tauri/Vite integration).
- `lib.rs`: comentário de documentação oficial Tauri sobre `greet`.

## Rust

- Comandos Tauri decorados com `#[tauri::command]`.
- `expect("error while running tauri application")` na `run()` — falha rápido na inicialização.
