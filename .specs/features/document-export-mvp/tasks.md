# Tarefas: documento de evidência MVP (`document-export-mvp`)

**Especificação:** [spec.md](./spec.md)  
**Estado:** slice inicial entregue (2026-05-12).

---

### T1: Gerador HTML + preview + impressão

**O quê:** Slice `features/document/` com `buildEvidenceBodyHtml` / `buildEvidencePrintHtml`, `printHtmlDocument`, componente `EvidenceDocumentPreview`, integração em `ScopeSummary`.

**Requisitos:** DOC-R01–R04.

**Gate:** `pnpm test && pnpm build`

---

## Verificação

| Tarefa | Estado |
|--------|--------|
| T1 | ✅ |

**Próximo:** RF-012 (screenshots), templates adicionais, ou geração PDF directa.
