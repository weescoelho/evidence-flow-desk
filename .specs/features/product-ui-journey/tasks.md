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
| 1.1 | Sidebar com 5 entradas (ícones Lucide, activo vs inactivo, hint rodapé) | UI-R01 | Visual vs `sb` no .pen; `pnpm build` |
| 1.2 | Estado «vista» futuro: `Repositórios` activo durante wizard 01–05; restantes inactivos ou rota placeholder documentada | UI-R01 | — |
| 1.3 | Ecrãs 06/07 (Histórico, Config): stub ou rota vazia quando item activo | UI-R06 | Opcional no primeiro ciclo |

---

## P1 — Wizard Nova evidência (ordem e cópias)

| # | Tarefa | Requisito | Gate |
|---|--------|-----------|------|
| 2.1 | Breadcrumb `Nova evidência > Passo N de 5` consistente com stepper numérico | UI-R02 | Rev.manual |
| 2.2 | Rótulos de passo alinhados ao design (títulos H1/sub por passo, não só tablist) | UI-R02 | Comparar nós `Hbs1b`…`Kym43` |
| 2.3 | CTAs rodapé: **Cancelar** + primário por passo (textos exactos da spec) | UI-R02 | Lista spec: «Continuar para escopo» … «Exportar PDF agora» |
| 2.4 | Remover duplicação visual desnecessária (tablist + stepper) se mantiver só o padrão canónico do design | UI-R02 | Design review |

---

## P1 — Passo 3 (Evidências)

| # | Tarefa | Requisito | Gate |
|---|--------|-----------|------|
| 3.1 | Secção template: selector «Template ativo», botão «Gerenciar templates» | UI-R03 | — |
| 3.2 | Campos **Change ID / ticket** e **Ambiente** (estado global exportável para HTML/PDF) | UI-R03 | DOC-R01 |
| 3.3 | Layout duas colunas: narrativa + métricas «Mudanças no código» | UI-R03 | — |
| 3.4 | Blocos IA / resumo corporativo: placeholder Fase 2 ou desactivado explícito | UI-R03 | Copy aprovada |
| 3.5 | Secção screenshots com título e acções «Importar arquivo» / «Nova captura» conforme layout | UI-R03 | SCR-* |

---

## P2 — Preview e exportação

| # | Tarefa | Requisito | Gate |
|---|--------|-----------|------|
| 4.1 | Preview: índice lateral + zoom + linha «Paginas / Atualiza ao mudar…» | UI-R04 | — |
| 4.2 | Export: destino ficheiro, nome projeto, checkboxes PDF; faixa SQLite | UI-R05 | DOC-* |

---

## Verificação global

- [ ] Nenhum desvio **SPEC_DEVIATION** sem comentário em PR ou issue.
- [ ] `pnpm test` + `pnpm build` após alterações de UI críticas.

---

## Progresso

| Data | Item | Notas |
|------|------|--------|
| 2026-05-12 | **1.1** | Sidebar com 5 itens Lucide (`App.tsx`), estilo activo `Repositórios` = `docs/UI-COMPONENTS.md`; outros desactivados até rotas 06/07 e vistas globais. |
| 2026-05-12 | **2.2–2.4** | `EvidenceCreationWizard`: `STEP_PAGE` (H1+sub por passo); tablist removida; stepper clicável; rodapé «Cancelar» (volta um passo; passo 1 inactivo) + primários UI-R02 + ícones; passo 5 aciona `exportPdfTriggerRef` → «Exportar PDF…». `App.tsx` já sem cabeçalho genérico duplicado. |
| 2026-05-12 | Próximo | **P1 3.x** — template, Change ID, ambiente, layout passo 3 (UI-R03). |
