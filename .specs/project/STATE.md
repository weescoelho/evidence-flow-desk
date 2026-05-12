# Estado do projeto — EvidenceFlow Desk

**Última atualização:** 2026-05-12  
**Trabalho atual:** Feature `git-repository-and-branches` com [spec](../features/git-repository-and-branches/spec.md) + [tasks](../features/git-repository-and-branches/tasks.md) (Draft); próximo: **aprovar tasks** e **Implement** (T1…T12).

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

- [ ] Rever e marcar **Approved** em [tasks.md](../features/git-repository-and-branches/tasks.md), depois executar T1…T12 (Implement).
