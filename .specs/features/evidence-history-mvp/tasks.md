# Tarefas: histórico de documentos MVP (`evidence-history-mvp`)

**Especificação:** [spec.md](./spec.md)

---

### T1: Sidebar Documentos + vista dedicada

**O quê:** Activar item **Documentos** na sidebar principal; vista com título/descrição e `SavedEvidenceDocumentsPanel` em layout de página (`layout="library"`).

**Requisitos:** HIS-R01–R03 (reuso do painel existente).

**Gate:** `pnpm test && pnpm build`

---

### T2: Índice SQLite (RF-015)

**O quê:** Metadados de documentos guardados em `rusqlite` (`evidence_documents_index.sqlite3` na pasta de dados da app); migração automática desde `evidence_documents/index.json` quando a BD está vazia; HTML em `evidence_documents/<uuid>/document.html`.

**Onde:** `src-tauri/src/services/evidence_documents.rs`, `src-tauri/Cargo.toml`.

**Gate:** `cargo test --manifest-path src-tauri/Cargo.toml`

---

## Verificação

| Tarefa | Estado |
|--------|--------|
| T1 | ✅ |
| T2 | ✅ |
