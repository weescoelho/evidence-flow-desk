# Especificação: templates de documento — layout por preset (`evidence-templates-layout`)

**PRD:** [RF-009](../../../docs/prd.md) (subset progressivo) · persistência [RF-015](../../../docs/prd.md) (`evidence_templates`).  
**Depende de:** [document-export-mvp](../document-export-mvp/spec.md), `evidence_app_state` SQLite.

## Requisitos

### TMPL-L01 — Preset = rótulo + variante visual

Cada linha em `evidence_templates` tem **nome** (rótulo no cabeçalho do PDF/HTML) e **layout** persistido (`layout_key`: `enterprise` | `minimal` | `audit`).

### TMPL-L02 — Variantes aplicadas na impressão/preview

O gerador `buildEvidencePrintHtml` injerta CSS extra conforme o layout do template activo, sem alterar a ordem das secções de conteúdo (commits, ficheiros, resumos, screenshots).

### TMPL-L03 — CRUD UI

Biblioteca **Templates** e diálogo **Gerenciar templates** permitem criar preset (nome + modelo visual), alterar modelo por linha, e remover apenas personalizados (UUID).

## Fora deste incremento

- Logo, cores arbitrárias por hex, ordem de secções editável, Handlebars/EJS com ficheiros por template (RF-009 completo).

## Critérios de aceite

1. Alterar modelo visual de um preset reflecte-se no iframe do preview/export após re-render.
2. Migração SQLite idempotente para bases sem `layout_key`.
