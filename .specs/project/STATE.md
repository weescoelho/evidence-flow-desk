# Estado do projeto — EvidenceFlow Desk

**Última atualização:** 2026-05-12  
**Trabalho atual:** Screenshots manuais + associação a commits (RF-012/014 subset) em [evidence-screenshots-mvp](../features/evidence-screenshots-mvp/tasks.md). Próximo: persistência (RF-015) ou refinamentos de documento.

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
- [ ] Feature `git-commits-and-changes`: UAT manual em `pnpm tauri dev` (refs distintas: branch, **tag** ou **SHA** nos campos livres; atalhos na lista de commits) — [tasks.md](../features/git-commits-and-changes/tasks.md).
- [ ] Próximo produto desejável: **RF-015** (histórico / persistência de evidências) ou PDF sem diálogo de impressão.
