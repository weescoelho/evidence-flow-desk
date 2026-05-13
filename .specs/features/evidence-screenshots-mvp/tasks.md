# Tarefas: screenshots MVP (`evidence-screenshots-mvp`)

**Especificação:** [spec.md](./spec.md)  
**Estado:** persistência por repositório entregue (2026-05-12).

---

### T1: Store + UI + documento

**O quê:** `useEvidenceAttachmentsStore`, `EvidenceScreenshotsSection`, integração em `ScopeSummary` / `EvidenceDocumentPreview` / `build-evidence-html`, reset em `resetGitStore`, limpeza ao mudar `repositoryPath`.

**Requisitos:** SCR-R01–R04.

**Gate:** `pnpm test && pnpm build`

---

### T2: Persistência SQLite por repositório

**O quê:** Tabela `repository_evidence_screenshots`; comandos `list_repository_evidence_screenshots` / `sync_repository_evidence_screenshots`; hydrate no `useEffect` do passo 3 / biblioteca; sync debounced (~450 ms) após add/remover/legenda.

**Requisitos:** SCR-R02 (evolução).

**Gate:** `cargo test`, `pnpm test && pnpm build`

---

## Verificação

| Tarefa | Estado |
|--------|--------|
| T1 | ✅ |
| T2 | ✅ |

**Próximo:** refinamentos de produto ou outras features da Fase 2 (ver roadmap).
