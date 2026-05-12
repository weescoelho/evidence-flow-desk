# Especificação: resumo técnico MVP (`technical-summary-mvp`)

**PRD:** [RF-006](../../../docs/prd.md)  
**Depende de:** [git-commits-and-changes](../git-commits-and-changes/spec.md) (`RepositoryScopeSummary` carregado na UI).  
**Colocação UI e blocos adjacentes:** [product-ui-journey](../product-ui-journey/spec.md) (UI-R03) — resumo técnico no passo 3 (`fZdOT` / painel `gbZwC`); **Resumo corporativo** e **Regenerar com IA** são Fase 2 (PRD RF-007 / IA), podem permanecer placeholders desactivados até lá.

---

## Requisitos (rastreáveis)

### SUM-R01 — Fonte de dados

O resumo deve derivar apenas dos **commits listados** e do **agregado de alterações de arquivo** (incl. contagens por estado e linhas +/-) já expostos ao cliente; **sem** chamada obrigatória a modelo de linguagem ou serviço externo.

### SUM-R02 — Conteúdo mínimo

O texto deve incluir, quando aplicável:

- Quantidade de commits e indicação de **truncagem** (`commitsTruncated`).
- Lista das **primeiras linhas** das mensagens de commit, com tipo conventional entre parênteses quando existir.
- Resumo do conjunto de arquivos: quantidade, totais de linhas adicionadas/removidas, distribuição por tipo de alteração.

### SUM-R03 — Transparência

O utilizador deve ver indicação explícita de que o texto é **gerado automaticamente** a partir de metadados Git e do diff agregado, e que **não** substitui revisão humana.

---

## Fora deste incremento

- Parafraseamento estilo PRD (exemplo RF-006) via LLM — Fase 2 / opcional.
- RF-007 resumo corporativo.
- Export PDF / template (RF-009, RF-011).

---

## Critérios de aceite

1. Com escopo válido carregado, a app mostra bloco **Resumo técnico** (gerado a partir de Git) **no passo 3** da jornada, coerente com os dados em Commits e Arquivos e com o posicionamento em [product-ui-journey](../product-ui-journey/spec.md).
2. `pnpm test` inclui testes unitários do gerador de texto.
