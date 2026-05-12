# Tarefas: commits e alterações (`git-commits-and-changes`)

**Especificação:** [spec.md](./spec.md)  
**Estado:** Slice 1 + subset RF-003 na UI (2026-05-12). PR/MR remoto fora.

---

## Plano

```text
T1 ──→ T2 ──→ T3 ──→ T4
(Rust)  (IPC)   (UI)   (RF-003 subset UI)
```

---

### T1: Serviço `git_history` + modelo `RepositoryScopeSummary`

**O quê:** Commits estilo `base..compare`; diff `merge-base(base,compare) → compare` com `find_similar` para renomes; tipos Serde; testes com repo temporário.

**Onde:** `src-tauri/src/services/git_history.rs`, `src-tauri/src/models/git.rs`, `git_repository::open_repository`.

**Requisitos:** CHG-R01–R05.

**Feito quando:** `cargo test` passa nos novos testes.

**Gate:** `cargo test --manifest-path src-tauri/Cargo.toml`

---

### T2: Comando `get_repository_scope_summary`

**O quê:** Handler Tauri + registo em `lib.rs`.

**Requisitos:** CHG-R01–R03.

**Gate:** `cargo test && pnpm build`

---

### T3: Front — `getRepositoryScopeSummary`, `ScopeSummary`

**O quê:** Tipos TS, invoke, componente que reage a `repositoryPath`, `baseBranch`, `compareBranch`; integração em `App.tsx`.

**Requisitos:** CHG-R01–R04 (truncagem visível).

**Gate:** `pnpm test && pnpm build`

---

### T4: RF-003 (subset) — refs livres na UI + atalhos

**O quê:** Campos de texto com datalist de branches; texto livre para tag, SHA, `rev-parse`; botões nas linhas de commit para base/compare.

**Onde:** `branch-list.tsx`, `scope-summary.tsx`, `src/test/setup.ts` (cleanup jsdom); teste `scope_accepts_tag_as_base_ref` em `git_history.rs`.

**Requisitos:** CHG-R06.

**Gate:** `pnpm test && pnpm build && cargo test --manifest-path src-tauri/Cargo.toml`

---

## Verificação TLC

| Tarefa | Estado |
|--------|--------|
| T1 | ✅ |
| T2 | ✅ |
| T3 | ✅ |
| T4 — Refs livres (input + datalist) + atalhos nos commits; teste Rust tag | ✅ |

**Próximo:** anexos (RF-012), templates adicionais, ou integração PR/MR; ver [document-export-mvp](../document-export-mvp/tasks.md).
