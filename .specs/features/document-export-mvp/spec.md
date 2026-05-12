# Especificação: documento de evidência MVP (`document-export-mvp`)

**PRD:** [RF-009](../../../docs/prd.md) (templates — subset), [RF-010](../../../docs/prd.md) (preview), [RF-011](../../../docs/prd.md) (PDF — subset)  
**Depende de:** [technical-summary-mvp](../technical-summary-mvp/spec.md), [git-commits-and-changes](../git-commits-and-changes/spec.md), [evidence-screenshots-mvp](../evidence-screenshots-mvp/spec.md) *(secção de imagens)*.

## Requisitos

### DOC-R01 — Template único configurável (subset RF-009)

No MVP existe **um** modelo de documento («padrão») com secções fixas: metadados, resumo técnico automático, tabela de commits, tabela de ficheiros. A UI indica explicitamente que futuras versões poderão oferecer múltiplos templates (logo, cores, etc.).

### DOC-R02 — Preview (RF-010)

Quando o escopo Git é carregado com sucesso, o utilizador vê **pré-visualização** do documento final que reflete o estado atual (atualiza ao mudar base/compare/dados e anexos).

### DOC-R03 — Exportação PDF (subset RF-011)

O utilizador pode **disparar a impressão do sistema** com o documento formatado, permitindo **Guardar como PDF** sem SaaS obrigatório. Paginação e cabeçalhos seguem o motor de impressão do SO/navegador incorporado.

### DOC-R04 — Segurança de conteúdo

Todo o texto proveniente do repositório ou do resumo técnico deve ser **escapado** ao gerar HTML para evitar injecção de marcação.

### DOC-R05 — Secção de screenshots (RF-012 / RF-014)

Quando existirem anexos de imagem na sessão, o corpo do documento inclui uma secção **Screenshots** com figuras, legenda e referência opcional ao commit — ver [evidence-screenshots-mvp](../evidence-screenshots-mvp/spec.md).

---

## Fora deste incremento


- Múltiplos templates editáveis, logos e temas (RF-009 completo).
- PDF gerado sem diálogo de impressão (biblioteca nativa ou servidor).
- Syntax highlight em blocos de código.

---

## Critérios de aceite

1. Com dados de escopo válidos, preview e botão de exportação estão visíveis e coerentes.
2. Testes unitários cobrem escape de HTML no gerador do corpo do documento.
