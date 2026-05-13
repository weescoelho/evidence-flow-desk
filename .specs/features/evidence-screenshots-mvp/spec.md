# Especificação: screenshots manuais MVP (`evidence-screenshots-mvp`)

**PRD:** [RF-012](../../../docs/prd.md)  
**Depende de:** [git-commits-and-changes](../git-commits-and-changes/spec.md), [document-export-mvp](../document-export-mvp/spec.md).  
**UI:** secção **Screenshots e comparacao** no passo 3 — [product-ui-journey](../product-ui-journey/spec.md) (UI-R03), nó `fZdOT` / `gbZwC` (acção «Importar arquivo», grelha de miniaturas).

---

## Requisitos

### SCR-R01 — Anexar imagens (RF-012)

Com repositório válido seleccionado, o utilizador pode escolher **um ou mais** ficheiros de imagem (PNG, JPEG, WebP, GIF) até um limite documentado; ficheiros inválidos ou demasiado grandes são recusados com mensagem clara.

### SCR-R02 — Dados por sessão e persistência

Os anexos continuam associados ao **repositório Git canónico** actual. Em **memória** durante a sessão; ao mudar o repositório seleccionado, carrega-se a lista guardada para o novo caminho.

**Evolução (2026-05-12):** As capturas **persistem** na mesma SQLite que o índice de documentos (`repository_evidence_screenshots`, por `repository_path` canónico). Limite e formatos iguais ao frontend; sincronização substitui o conjunto por repositório.

### SCR-R03 — Documento e PDF

Screenshots entram no **HTML** do documento de evidência (secção dedicada) e na **exportação por impressão** (RF-011), com legenda.

### SCR-R04 — Segurança em `<img>`

Apenas URLs `data:image/…` geradas localmente a partir do `FileReader` são emitidas no HTML; outras origens são omitidas.

---

## Critérios de aceite

1. Fluxo manual: abrir repo → adicionar imagem → ver na lista → aparecer no preview do documento quando o escopo estiver carregado.
2. Testes do gerador HTML cobrem a secção de screenshots.
