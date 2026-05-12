# Tarefas: screenshots MVP (`evidence-screenshots-mvp`)

**Especificação:** [spec.md](./spec.md)  
**Estado:** slice inicial entregue (2026-05-12).

---

### T1: Store + UI + documento

**O quê:** `useEvidenceAttachmentsStore`, `EvidenceScreenshotsSection`, integração em `ScopeSummary` / `EvidenceDocumentPreview` / `build-evidence-html`, reset em `resetGitStore`, limpeza ao mudar `repositoryPath`.

**Requisitos:** SCR-R01–R05.

**Gate:** `pnpm test && pnpm build`

---

## Verificação

| Tarefa | Estado |
|--------|--------|
| T1 | ✅ |

**Próximo:** persistência (RF-015), funcionalidades/etapas além de commits, ou RF-013 automação.
