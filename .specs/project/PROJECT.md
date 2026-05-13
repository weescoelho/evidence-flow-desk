# EvidenceFlow Desktop

**Visão:** Aplicação desktop (Tauri) que analisa alterações Git e gera documentos PDF de evidência técnica com rastreabilidade (commits, diffs resumidos, arquivos, screenshots, release notes), com operação local e offline quando aplicável.

**Para:** desenvolvedores, tech leads, QA, DevOps, sustentação; secundário: auditoria, governança, compliance, gestão.

**Resolve:** Elimina trabalho manual na montagem de evidências (copiar commits, resumos, prints, PDF/Word inconsistentes), reduz retrabalho e melhora auditoria.

**Fonte canônica:** [docs/prd.md](../../docs/prd.md)

## Objetivos

- Reduzir tempo operacional de produção de evidências (meta PRD §19: −80%).
- Padronizar documentação técnica e qualidade visual (PDF com seções pré-definidas).
- Melhorar rastreabilidade da mudança (commits, arquivos, evidências associadas).

## Stack tecnológica

**Core (repositório):**

- Frontend: React 19 + TypeScript 5.x + Vite 7 + Tailwind 4 + shadcn/radix
- Estado UI: Zustand
- Desktop: Tauri 2 (`@tauri-apps/api`)

**Planejado / referência PRD (ainda não refletido inteiramente em `package.json`):**

- TanStack Query, SQLite, Handlebars ou EJS, pipeline HTML→PDF, Shiki para highlight
- Linguagem Rust no `src-tauri` para comandos IPC e serviços locais

Consultar também: [docs/ARCH-GUIDELINES.md](../../docs/ARCH-GUIDELINES.md), `docs/UI-COMPONENTS.md`, `docs/CLEAN-CODE-GUIDELINES.md`.

## Escopo

**Incluído MVP (PRD §16):**

- Seleção e validação de repositório Git local; persistir histórico recente quando implementado (RF-001)
- Listagem/leitura de branches e seleção de escopo inicial por branch / commits (RF-002, RF-003 subset para MVP)
- Extração de commits e alterações com métricas básicas (RF-004, RF-005)
- Resumo técnico simples (regex/heurísticas antes de IA avançada) (RF-006 subset)
- Templates básicos e exportação PDF (RF-009, RF-011 subset)
- Screenshots manuais (RF-012)
- Fluxo típico: repositório → commits → evidências → preview → export

**Explicitamente fora do MVP (PRD §16 + §21):**

- Auth, colaboração, sincronização cloud, OCR
- Integrações Jira/Azure DevOps/ServiceNow
- IA avançada (integração opcional fica para fases posteriores; RF-017 fora do núcleo MVP)

## Restrições

- **Processamento local** e sem envio de código para fora sem consentimento explícito (RNF-002).
- **Offline-first** obrigatório para o núcleo (RF-018 / RNF-001 segundo volume PRD).
- **Compatível** Windows, Linux, macOS (RNF-003).
- **UX:** interface moderna, minimalista e rápida (RNF-004).
- Suportar monorepos e volumes elevados dentro dos limites de desempenho (RNF-001: até ~1000 commits / ~500 arquivos em menos de 30 s como alvo).

## Arquitetura de código (orientação)

- **Vertical Slice** por feature no frontend (`features/`); comandos Rust por domínio em `src-tauri` — ver [ARCH-GUIDELINES.md §3–§4](../../docs/ARCH-GUIDELINES.md).
- Tipos modelo iniciais: Commit, FileChange, Screenshot, EvidenceDocument (PRD §10).
