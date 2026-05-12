# Integrações externas

**Escopo:** serviços, APIs e pontos de integração **observáveis no código** à data da análise.

## Ecossistema Tauri / SO

### `tauri-plugin-opener`

- **Serviço:** API do sistema operacional para **abrir URLs** no navegador padrão.
- **Propósito:** links externos/documentação (padrão Tauri starter).
- **Implementação:** `tauri_plugin_opener::init()` em `src-tauri/src/lib.rs`; dependência também no front `@tauri-apps/plugin-opener` no `package.json`.
- **Configuração:** versão compatível série 2 Tauri (`Cargo.toml` / pacotes NPM `^2`).
- **Auth:** não aplicável — delegação ao SO.

_No código analisado_ o frontend ainda não mostra uso direto (`openUrl`/equivalente); apenas registro do plugin do lado Rust.

### Comando IPC exemplo `greet`

- **Propósito:** demonstração invoke handler.
- **Local:** `#[tauri::command] fn greet(name: &str) -> String` em `src-tauri/src/lib.rs`.
- **Consumo cliente:** opcionalmente `@tauri-apps/api` (`invoke`). **Nenhuma** chamada em `src/App.tsx`.

## Serviços de rede remotos obrigatórios

**Nenhum.** A aplicação não configura cliente HTTP, chaves ou endpoints remotos nos ficheiros analisados. Requisitos futuros (`docs/prd.md`: OpenAI, Ollama, Jira…) permanecem não implementados — documentar quando existir primeiro cliente/API.

## Ficheiros e configuração de build

| Integração indireta | Descrição |
|----------------------|-----------|
| **Vite dev server** | `http://localhost:1420` em dev (`vite.config.ts` + `tauri.conf.json`). |
| **Assets estáticos** | Ícones de bundle em `src-tauri/tauri.conf.json` (`icons/*.png`, `icon.icns`, `icon.ico`). |
| **`pnpm`/Node** | Resolução de dependências NPM (lockfile presente). |

## Webhooks, filas, microserviços

**Ausentes.**

## Resumo PRD ↔ código

Para rastrear integrações futuras (IA, ticketing, SaaS), manter [.specs/codebase/INTEGRATIONS.md](INTEGRATIONS.md) atualizado quando forem adicionados SDKs novos aos manifests (`package.json` / `Cargo.toml`) e comandos IPC correspondentes.
