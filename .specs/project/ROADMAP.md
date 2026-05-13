# Roadmap — EvidenceFlow Desktop

**Marco atual:** MVP (evidências básicas a partir de Git)
**Estado:** Planejamento (código-base presente; funcionalidades do PRD por implementar)

---

## MVP — EvidenceFlow núcleo (PRD §16)

**Objetivo:** Entregar fluxo ponta a ponta mínimo: escolher repo → commits + diff resumido → resumo simples → template básico → preview → PDF; screenshots manuais.

**Critério de aceite (alto nível):** O usuário gera um PDF de evidência local sem dependência obrigatória de SaaS.

**Paridade com o design (`docs/design.pen`):** A jornada canónica de cinco passos, ordem dos CTAs, sidebar e campos do passo 3 (template, Change ID, ambiente, resumo, métricas, screenshots) estão especificadas em **[product-ui-journey](../features/product-ui-journey/spec.md)**. Use esta spec com `docs/UI-COMPONENTS.md` para sair do MVP «descolado» e convergir para o produto final.

### Features

**Repositório e Git** — DONE *(TLC: [spec](../features/git-repository-and-branches/spec.md) · [tasks](../features/git-repository-and-branches/tasks.md))*

- Selecionar pasta Git válida e mensagens de erro claras (RF-001)
- Listar branches, branch atual, busca básica (RF-002)
- Escopo inicial: pelo menos branch ou intervalo de commits (subset RF-003)

**Análise de alterações** — DONE *(TLC: [spec](../features/git-commits-and-changes/spec.md) · [tasks](../features/git-commits-and-changes/tasks.md); refs Git livres + atalhos; PR/MR fora)*

- Extrair lista de commits (hash, autor, data, mensagem, tipo conventional) (RF-004)
- Listar arquivos add/mod/del/rename + linhas +/- (RF-005)

**Narrativa e documento** — IN PROGRESS *(resumo: [technical-summary-mvp](../features/technical-summary-mvp/spec.md); documento + PDF via impressão: [document-export-mvp](../features/document-export-mvp/spec.md))*

- Resumo técnico simples sem LLM obrigatório (RF-006 subset)
- Template único + preview + exportação «Guardar como PDF» via impressão (RF-009/010/011 subset)

**Evidências visuais** — IN PROGRESS *(TLC: [evidence-screenshots-mvp](../features/evidence-screenshots-mvp/spec.md))*

- Anexar screenshots manuais (RF-012); incluídos no documento/PDF

**Persistência MVP** — IN PROGRESS

- Índice de cópias HTML em **SQLite** (`evidence_documents_index.sqlite3`; migração automática desde `evidence_documents/index.json` quando a base está vazia).
- SQLite para templates/histórico/preferências conforme PRD §15 — planeado incrementalmente

**Infraestrutura app** — IN PROGRESS *(scaffolding existe)*

- Shell Tauri + React + navegação — alinhar com [product-ui-journey](../features/product-ui-journey/spec.md) (PRD §21: sidebar + wizard). **Templates** na sidebar: vista dedicada com preset activo + CRUD SQLite (`EvidenceTemplatesLibraryView`); **Screenshots** na sidebar: vista dedicada partilhando estado de sessão do passo 3 (`EvidenceScreenshotsLibraryView`).

---

## Fase 2 — Automação e IA (PRD §17)

**Objetivo:** Automação Playwright, IA remota opcional (Gemini), comparativos visuais, integrações.

### Features

**Playwright / screenshots automatizados** — PLANNED (RF-013)

**IA — resumo corporativo, release notes, categorização** — PLANNED (RF-007, RF-008, RF-017 expand)

**Comparação visual before/after** — PLANNED (RF-019)

**Integrações** — PLANNED (preparação arquitetural RF-020: Jira, Azure DevOps, ServiceNow)

---


_Rastreabilidade RF/RNF:_ `docs/prd.md`. O estado deste roadmap deve ficar alinhado a `.specs/project/STATE.md` ao fechar marcos.
