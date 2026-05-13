# Especificação: documento de evidência MVP (`document-export-mvp`)

**PRD:** [RF-009](../../../docs/prd.md) (templates — subset), [RF-010](../../../docs/prd.md) (preview), [RF-011](../../../docs/prd.md) (PDF — subset)  
**Depende de:** [technical-summary-mvp](../technical-summary-mvp/spec.md), [git-commits-and-changes](../git-commits-and-changes/spec.md), [evidence-screenshots-mvp](../evidence-screenshots-mvp/spec.md) *(secção de imagens)*.  
**Jornada UI (layout, ordem dos passos, metadados na página):** [product-ui-journey](../product-ui-journey/spec.md) — nós `X80A7`, `Kym43`, secção template em `fZdOT` / `gbZwC`.

## Requisitos

### DOC-R01 — Template único configurável (subset RF-009)

No MVP existe **um** modelo de documento («padrão») com secções fixas: metadados, resumo técnico automático, tabela de commits, tabela de ficheiros. A UI **deve** expor um **template activo** selector (com um único item no MVP) e entrada para **metadados de rastreio** (**Change ID / ticket**, **Ambiente**) conforme o ecrã 03 do design; acção **«Gerenciar templates»** pode navegar para configuração futura ou estado desactivado com copy clara. Versões posteriores poderão oferecer múltiplos templates (logo, cores, etc.).

### DOC-R02 — Preview (RF-010)

Quando o escopo Git é carregado com sucesso, o utilizador vê **pré-visualização** do documento final que reflete o estado atual (atualiza ao mudar base/compare/dados e anexos). A **paridade com o produto final** inclui área de «página», **índice** de secções e controlos de **zoom** conforme [product-ui-journey](../product-ui-journey/spec.md) (UI-R04); o conteúdo mínimo de dados pode preceder o refinamento visual.

### DOC-R03 — Exportação PDF (subset RF-011)

O utilizador pode **disparar a impressão do sistema** com o documento formatado, permitindo **Guardar como PDF** sem SaaS obrigatório. Paginação e cabeçalhos seguem o motor de impressão do SO/navegador incorporado.

### DOC-R04 — Segurança de conteúdo

Todo o texto proveniente do repositório ou do resumo técnico deve ser **escapado** ao gerar HTML para evitar injecção de marcação.

### DOC-R05 — Secção de screenshots (RF-012)

Quando existirem anexos de imagem na sessão, o corpo do documento inclui uma secção **Screenshots** com figuras e legenda — ver [evidence-screenshots-mvp](../evidence-screenshots-mvp/spec.md).

---

## Fora deste incremento


- Múltiplos templates editáveis, logos e temas (RF-009 completo).
- PDF sem diálogo de impressão: **fora do âmbito do produto** ([AD-004](../../project/STATE.md)); o único fluxo suportado é impressão do sistema + «Guardar como PDF» (DOC-R03).
- Syntax highlight em blocos de código.

---

## Critérios de aceite

1. Com dados de escopo válidos, preview, **metadados** (Change ID, ambiente) no documento quando preenchidos, e exportação estão visíveis e coerentes com a jornada em [product-ui-journey](../product-ui-journey/spec.md).
2. Testes unitários cobrem escape de HTML no gerador do corpo do documento.
