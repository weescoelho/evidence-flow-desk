# Tarefas: resumo técnico MVP (`technical-summary-mvp`)

**Especificação:** [spec.md](./spec.md)  
**Estado:** Slice inicial entregue (2026-05-12).

---

### T1: Gerador puro + integração em `ScopeSummary`

**O quê:** `buildTechnicalSummary(RepositoryScopeSummary)` em `features/git/lib/`; secção na UI com `data-testid="technical-summary"`; testes Vitest.

**Requisitos:** SUM-R01–R03.

**Gate:** `pnpm test && pnpm build`

---

## Verificação

| Tarefa | Estado |
|--------|--------|
| T1 | ✅ |

**Próximo (produto):** incrementos em [document-export-mvp](../document-export-mvp/tasks.md) (RF-009–011) ou melhorias de copy/LLM opcional.
