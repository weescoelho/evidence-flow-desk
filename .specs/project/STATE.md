# Estado do projeto — EvidenceFlow Desk

**Última atualização:** 2026-05-12  
**Trabalho atual:** Histórico de documentos na sidebar ([evidence-history-mvp](../features/evidence-history-mvp/tasks.md)); armazenamento local já existe (`index.json` + HTML em app data; SQLite formal em PRD §15 pode vir depois).

---

## Decisões recentes (≤60 dias)

### AD-001: fonte canônica de requisitos (2026-05-12)

**Decisão:** Requisitos de produto e critérios vivem em `docs/prd.md`; decisões curadas de implementação e fronteira de roadmap vivem em `.specs/project/`.

**Motivo:** O skill TLC exige PROJECT/ROADMAP/STATE persistidos sem duplicar o PRD inteiro.

**Trade-off:** Dois lugares para consultar — mitigado com links explícitos.

**Impacto:** Alterações ao escopo devem atualizar primeiro o PRD, depois PROJECT/ROADMAP.

### AD-002: artefactos brownfield (2026-05-12)

**Decisão:** Manter `.specs/codebase/` com os sete ficheiros TLC (STACK, ARCHITECTURE, CONVENTIONS, STRUCTURE, TESTING, INTEGRATIONS, CONCERNS) como snapshot analisável; atualizar quando a stack ou estrutura mudarem de forma relevante.

**Motivo:** Cumprir fluxo «map codebase» sem duplicar `docs/ARCH-GUIDELINES.md` — os docs de codebase focam no **estado real do repo**.

**Trade-off:** Manutenção manual ou via novas passagens de mapeamento.

**Impacto:** Novas features devem referenciar limites observados em CONCERNS/STACK.

### AD-003: spec de jornada UI vs `design.pen` (2026-05-12)

**Decisão:** A fonte de requisitos de **fluxo, ordem dos passos e composição dos ecrãs** do EvidenceFlow Desk é a spec [product-ui-journey](../features/product-ui-journey/spec.md), derivada dos nós do ficheiro `docs/design.pen` (incl. `fZdOT`, `Hbs1b`, `ANhm2`, `X80A7`, `Kym43`). Tokens e snippets visuais permanecem em `docs/UI-COMPONENTS.md`.

**Motivo:** O MVP implementado divergia do design; era necessário um documento rastreável que una PRD, Pencil e critérios de aceite.

**Impacto:** Features de documento, resumo, Git e screenshots referenciam `product-ui-journey` onde o layout é relevante.

---

## Bloqueadores ativos

_Nenhum._

---

## Aprendizados

_Nenhum registrado._

---

## Quick tasks completas

| # | Descrição | Data | Commit | Estado |
|---|-----------|------|--------|--------|
| — | — | — | — | — |

---

## Ideias adiadas

_Nenhuma listada._

---

## Todos

- [x] Feature `git-repository-and-branches`: UAT T12; estado **Approved** em [tasks.md](../features/git-repository-and-branches/tasks.md).
- [x] Feature `git-commits-and-changes`: UAT manual (refs branch/tag/SHA + atalhos) — **OK** 2026-05-12; [tasks.md](../features/git-commits-and-changes/tasks.md).
- [ ] **RF-015 evolução** — SQLite/metadata alargada conforme PRD §15 ou PDF silencioso (ver roadmap). *Subset entregue:* histórico na sidebar + armazenamento JSON/HTML.
