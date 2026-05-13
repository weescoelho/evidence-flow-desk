# Estado do projeto — EvidenceFlow Desk

**Última atualização:** 2026-05-12  
**Trabalho actual:** Persistência SQLite das capturas por repositório (`repository_evidence_screenshots`, comandos `list_*` / `sync_*`). **Seguinte:** fecho formal do MVP no PRD / roadmap se desejado; Fase 2 (Playwright RF-013, IA RF-007).

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

### AD-004: PDF sem diálogo de impressão não é objectivo (2026-05-12)

**Decisão:** Não implementar exportação PDF «silenciosa» (sem diálogo de impressão / pipeline headless nativo ou servidor próprio).

**Motivo:** A complexidade e manutenção não se justificam face ao fluxo actual (impressão do sistema + Guardar como PDF), que cumpre o PRD para desktop local sem SaaS.

**Impacto:** `document-export-mvp` mantém apenas DOC-R03; backlog e tarefas deixam de referir esta evolução.

---

## Bloqueadores ativos

_Nenhum._

---

## Aprendizados

### QA UI passos 4–5 (`X80A7`, `Kym43`)

- **Painel Documentos dentro do wizard (passos 4–5):** existe no código e não no crop do frame único no Pencil; mantido no MVP (**desvio aceite** — utilidade sobre paridade estrita do screenshot).
- **Toolbar de zoom:** alinhado ao pen (rótulos `−` / `+` mono 16px, 34×34px; gap 8px; linha «Páginas • zoom» `#71717A`).
- **Grafia / locale:** Pencil usa formas como «Paginas», «Opcoes», «Destino do arquivo», «Salve no historico»; a UI da app mantém PT-PT acentuado («Páginas», «Destino do ficheiro», «Guarde no histórico») conforme texto do wizard já alinhado à spec.

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
- [x] Feature `git-commits-and-changes`: UAT manual (refs branch/tag/SHA + atalhos) — **OK** 2026-05-12; [tasks.md](../features/git-commits-and-changes/tasks.md).
- [x] **RF-015 evolução (metadados por gravação)** — Colunas opcionais em `saved_evidence_documents`: `template_label`, `change_id`, `environment`, `document_title` (migração idempotente + `save_evidence_document`; lista/filtro em **Documentos**). *Já entregue antes:* histórico + índice HTML + migração `index.json`; preferências KV + `evidence_templates`; hidratação; pasta de export no passo 5.
- [x] **Vista sidebar Screenshots** — `EvidenceScreenshotsLibraryView`: `EvidenceScreenshotsSection` + empty state sem repo (`useGitStore`).
- [x] **Persistência por repositório** — tabela `repository_evidence_screenshots` na BD de documentos; hydrate ao abrir repo; sync debounced nas mutações (`sync_repository_evidence_screenshots`).
