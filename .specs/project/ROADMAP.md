# Roadmap — EvidenceFlow Desktop

**Marco actual:** MVP núcleo **entregue em código** (fluxo Git → narrativa → documento → PDF por impressão → screenshots persistentes).
**Estado:** Marco **MVP núcleo** fechado em código e alinhado no PRD (§14–16, §15). Próximo foco: **Fase 2** (ver secção abaixo) por prioridade de produto.

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

**Narrativa e documento** — DONE *(resumo: [technical-summary-mvp](../features/technical-summary-mvp/spec.md); documento + PDF via impressão: [document-export-mvp](../features/document-export-mvp/spec.md); **templates / layouts:** [evidence-templates-layout](../features/evidence-templates-layout/spec.md))*

- Resumo técnico simples sem LLM obrigatório (RF-006 subset)
- Template único + preview + exportação «Guardar como PDF» via impressão (RF-009/010/011 subset)

**Evidências visuais** — DONE *(TLC: [evidence-screenshots-mvp](../features/evidence-screenshots-mvp/spec.md))*

- Anexar screenshots manuais (RF-012); incluídos no documento/PDF; persistência por repositório na SQLite

**Persistência MVP** — DONE *(núcleo PRD §15 shipado)*

- Índice de cópias HTML em **SQLite** + migração legado `index.json`.
- Templates, preferências KV, metadados por gravação (RF-015), capturas por repo — evoluções futuras podem expandir campos sem alterar este marco.

**Infraestrutura app** — DONE *(MVP)*

- Shell Tauri + React + navegação alinhada a [product-ui-journey](../features/product-ui-journey/spec.md) (sidebar + wizard); **Templates** (`EvidenceTemplatesLibraryView`); **Screenshots** (`EvidenceScreenshotsLibraryView`).

---

## Fase 2 — IA e integrações (PRD §17)

**Objetivo:** IA remota opcional (Gemini), comparativos visuais, integrações.

### Features

**IA — resumo corporativo, release notes, categorização** — PLANNED (RF-007, RF-008, RF-017 expand)

**Comparação visual before/after** — PLANNED (RF-019)

**Integrações** — PLANNED (preparação arquitetural RF-020: Jira, Azure DevOps, ServiceNow)

---


_Rastreabilidade RF/RNF:_ `docs/prd.md`. O estado deste roadmap deve ficar alinhado a `.specs/project/STATE.md` ao fechar marcos.
