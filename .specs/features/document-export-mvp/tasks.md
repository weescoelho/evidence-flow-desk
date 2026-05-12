# Tarefas: documento de evidência MVP (`document-export-mvp`)

**Especificação:** [spec.md](./spec.md)  
**Estado:** slice inicial entregue (2026-05-12); alinhado com [evidence-screenshots-mvp](../evidence-screenshots-mvp/spec.md) (DOC-R05).

---

### T1: Gerador HTML + preview + impressão + screenshots

**O quê:** Slice `features/document/` com `buildEvidenceBodyHtml` / `buildEvidencePrintHtml`, `printHtmlDocument`, `EvidenceDocumentPreview`, integração em `ScopeSummary`; campo `screenshots` no payload e secção de imagens no HTML.

**Onde:** `features/document/`, `features/git/components/scope-summary.tsx`; anexos na feature `evidence`.

**Requisitos:** DOC-R01–R05.

**Gate:** `pnpm test && pnpm build`

---

## Verificação

| Tarefa | Estado |
|--------|--------|
| T1 | ✅ |

**Próximo:** templates adicionais, PDF sem diálogo de impressão, ou RF-015.
