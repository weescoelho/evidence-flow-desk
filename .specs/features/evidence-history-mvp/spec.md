# Especificação: histórico de documentos MVP (`evidence-history-mvp`)

**Rastreio PRD:** RF-015 (subset), PRD §15 (SQLite declarado como alvo eventual).  
**Jornada UI:** [product-ui-journey](../product-ui-journey/spec.md) — ecrã 06 (`D4yXKU`), item sidebar **Documentos**.

## HIS-R01 — Acesso pela sidebar

O utilizador pode abrir a vista **Documentos** a partir da navegação lateral (paridade UI-R06 com o MVP: listagem antes de SQLite completo).

## HIS-R02 — Listagem das cópias guardadas

A app lista cópias HTML persistidas pelo comando `save_evidence_document` (metadados: data, repo, refs base/compare), com filtro textual e atualização manual.

## HIS-R03 — Abrir e gerir entradas

Para cada entrada: abrir HTML no sistema (comportamento já suportado por `SavedEvidenceDocumentsPanel`), revelar pasta e remover após confirmação.

## Nota de implementação

Armazenamento atual: índice JSON + ficheiros em `app_data_dir` (`services/evidence_documents.rs`). Migrar métricas/preferências para SQLite fica como evolução alinhada a PRD §15.
