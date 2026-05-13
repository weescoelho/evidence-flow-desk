# Tarefas — `product-ui-journey`

**Spec:** [spec.md](./spec.md) · **Prioridade:** paridade com `docs/design.pen` + `docs/UI-COMPONENTS.md`.

## Legenda

| Estado | Significado |
|--------|-------------|
| [ ] | Por fazer |
| [x] | Feito |

---

## P1 — Shell e navegação global

| # | Tarefa | Requisito | Gate |
|---|--------|-----------|------|
| [x] 1.1 | Sidebar com 5 entradas (ícones Lucide, activo vs inactivo, hint rodapé) | UI-R01 | Visual vs `sb` no .pen; `pnpm build` |
| [x] 1.2 | Navegação: `Repositórios` leva ao assistente (passos 1–5); **Templates**, **Screenshots**, **Documentos**, **Configurações** abrem vistas dedicadas quando activos | UI-R01 | Sidebar + `App.tsx` |
| [x] 1.3 | Ecrãs 06/07 + itens globais Templates/Screenshots: vista ao clicar na sidebar | UI-R06 | **07** `EvidenceAppSettingsView`; **06** `Documentos`; **Templates** = `EvidenceTemplatesLibraryView`; **Screenshots** = `EvidenceScreenshotsLibraryView` (sessão, mesmo store que passo 3) |

---

## P1 — Wizard Nova evidência (ordem e cópias)

| # | Tarefa | Requisito | Gate |
|---|--------|-----------|------|
| [x] 2.1 | Breadcrumb `Nova evidência > Passo N de 5` consistente com stepper numérico | UI-R02 | Rev.manual |
| [x] 2.2 | Rótulos de passo alinhados ao design (títulos H1/sub por passo, não só tablist) | UI-R02 | Comparar nós `Hbs1b`…`Kym43` |
| [x] 2.3 | CTAs rodapé: **Cancelar** + primário por passo (textos exactos da spec) | UI-R02 | Lista spec: «Continuar para escopo» … «Exportar PDF agora» |
| [x] 2.4 | Remover duplicação visual desnecessária (tablist + stepper) se mantiver só o padrão canónico do design | UI-R02 | Design review |

---

## P1 — Passo 3 (Evidências)

| # | Tarefa | Requisito | Gate |
|---|--------|-----------|------|
| [x] 3.1 | Secção template: selector «Template ativo», botão «Gerenciar templates» | UI-R03 | — |
| [x] 3.2 | Campos **Change ID / ticket** e **Ambiente** (estado global exportável para HTML/PDF) | UI-R03 | DOC-R01 |
| [x] 3.3 | Layout duas colunas: narrativa + métricas «Mudanças no código» | UI-R03 | — |
| [x] 3.4 | Blocos IA / resumo corporativo: placeholder Fase 2 ou desactivado explícito | UI-R03 | Copy aprovada |
| [x] 3.5 | Secção screenshots com título e acções «Importar arquivo» / «Nova captura» conforme layout | UI-R03 | SCR-* |

---

## P2 — Preview e exportação

| # | Tarefa | Requisito | Gate |
|---|--------|-----------|------|
| [x] 4.1 | Preview: zoom + linha «Páginas / Atualiza ao mudar…» + área com scroll ao documento | UI-R04 | `pnpm test` + `pnpm build` |
| [x] 4.2 | Export: destino ficheiro, nome projeto, checkboxes PDF; faixa SQLite | UI-R05 | `pnpm test` + `pnpm build` |

---

## Verificação global

- [x] Desvios **SPEC_DEVIATION** tratados ou documentados (2026-05-13: painel Documentos nos passos 4–5, locale PT-PT vs pen — `.specs/project/STATE.md`, secção **Aprendizados**).
- [x] `pnpm test` + `pnpm build` após alterações de UI críticas **(2026-05-13, preview zoom — paridade pen)**.

---

## Progresso

| Data | Item | Notas |
|------|------|--------|
| 2026-05-12 | **1.1** | Sidebar com 5 itens Lucide (`App.tsx`), estilo activo `Repositórios` = `docs/UI-COMPONENTS.md`; outros desactivados até rotas 06/07 e vistas globais. |
| 2026-05-12 | **2.2–2.4** | `EvidenceCreationWizard`: `STEP_PAGE` (H1+sub por passo); tablist removida; stepper clicável; rodapé «Cancelar» (volta um passo; passo 1 inactivo) + primários UI-R02 + ícones; passo 5 aciona `exportPdfTriggerRef` → «Exportar PDF…». `App.tsx` já sem cabeçalho genérico duplicado. |
| 2026-05-12 | **3.1–3.5 (MVP)** | Store `evidence-metadata-store`; `EvidenceDocumentMetadataSection`; `EvidenceNarrativeMetrics` (2 colunas); metadados no HTML (`build-evidence-html`); preview lê store em `ScopeDocumentPreviewPanel`; screenshots: título + Importar + Nova captura (stub); `resetSession` no `resetGitStore`. |
| 2026-05-12 | **4.1–4.2** | `EvidenceDocumentPreview`: passo 4 barra «Páginas • zoom ±», área única com scroll; copy «Atualiza ao mudar…»; (`id` mantidos nas secções HTML para âncoras/relatório); passo 5 destino/pasta, nome → `<title>`, opções PDF, faixa SQLite; `buildEvidencePrintHtml`. |
| 2026-05-12 | **1.3 (completo)** | **Templates**: `EvidenceTemplatesLibraryView`; **Screenshots**: `EvidenceScreenshotsLibraryView` (reutiliza `EvidenceScreenshotsSection` / store de sessão); entradas da sidebar activas (`App.tsx`). Histórico = Documentos; Config = settings. |
| 2026-05-13 | QA 4–5 + assets | PNG `docs/design-assets/X80A7.png`, `Kym43.png` (Pencil MCP); ícone atualização preview + faixa SQLite; zoom textual `−`/`+` 34×34 alinhados ao pen. |
| 2026-05-13 | RF-015 | Metadados extra por linha `saved_evidence_documents` _(completo; ver Estado do projeto)._ |
| 2026-05-12 | **Screenshots sidebar** | `EvidenceScreenshotsLibraryView`: gestão na sidebar = mesmo estado que passo 3; empty state sem `repositoryPath`. |
