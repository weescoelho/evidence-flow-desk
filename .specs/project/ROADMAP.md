# Roadmap — EvidenceFlow Desktop

**Marco atual:** MVP (evidências básicas a partir de Git)
**Estado:** Planejamento (código-base presente; funcionalidades do PRD por implementar)

---

## MVP — EvidenceFlow núcleo (PRD §16)

**Objetivo:** Entregar fluxo ponta a ponta mínimo: escolher repo → commits + diff resumido → resumo simples → template básico → preview → PDF; screenshots manuais.

**Critério de aceite (alto nível):** O usuário gera um PDF de evidência local sem dependência obrigatória de SaaS.

### Features

**Repositório e Git** — DONE *(TLC: [spec](../features/git-repository-and-branches/spec.md) · [tasks](../features/git-repository-and-branches/tasks.md))*

- Selecionar pasta Git válida e mensagens de erro claras (RF-001)
- Listar branches, branch atual, busca básica (RF-002)
- Escopo inicial: pelo menos branch ou intervalo de commits (subset RF-003)

**Análise de alterações** — IN PROGRESS *(TLC: [spec](../features/git-commits-and-changes/spec.md) · [tasks](../features/git-commits-and-changes/tasks.md); escopo por **branch + refs Git** (tag/commit/expr.); PR/MR fora)*

- Extrair lista de commits (hash, autor, data, mensagem, tipo conventional) (RF-004)
- Listar arquivos add/mod/del/rename + linhas +/- (RF-005)

**Narrativa e documento** — IN PROGRESS *(resumo: [technical-summary-mvp](../features/technical-summary-mvp/spec.md); documento + PDF via impressão: [document-export-mvp](../features/document-export-mvp/spec.md))*

- Resumo técnico simples sem LLM obrigatório (RF-006 subset)
- Template único + preview + exportação «Guardar como PDF» via impressão (RF-009/010/011 subset)

**Evidências visuais** — PLANNED

- Anexar e associar screenshots manuais a commits/evidência (RF-012, RF-014 subset)

**Persistência MVP** — PLANNED

- SQLite para preferências/histórico mínimos conforme avançar (PRD §15; pode ser incremental)

**Infraestrutura app** — IN PROGRESS *(scaffolding existe)*

- Shell Tauri + React + navegação (sidebar wizard PRD §21)

---

## Fase 2 — Automação e IA (PRD §17)

**Objetivo:** Automação Playwright, IA local/remota opcional (Ollama, LM Studio, OpenRouter, OpenAI), comparativos visuais, integrações.

### Features

**Playwright / screenshots automatizados** — PLANNED (RF-013)

**IA — resumo corporativo, release notes, categorização** — PLANNED (RF-007, RF-008, RF-017 expand)

**Comparação visual before/after** — PLANNED (RF-019)

**Integrações** — PLANNED (preparação arquitetural RF-020: Jira, Azure DevOps, ServiceNow)

---

## Fase 3 — SaaS e colaboração (PRD §18)

**Objetivo:** Evolução para SaaS, dashboard, analytics, colaboração, assinatura digital.

### Features

- Modelo hospedado, multiusuário, analytics — PLANNED (alto nível PRD §18)

---

## Considerações futuras

- OCR, IA multimodal, geração automática por PR/tag, pipelines CI/CD (PRD §23)
- Extração eventual para CLI (PRD §22)

---

_Rastreabilidade RF/RNF:_ `docs/prd.md`. O estado deste roadmap deve ficar alinhado a `.specs/project/STATE.md` ao fechar marcos.
