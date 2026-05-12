# Especificação: screenshots manuais MVP (`evidence-screenshots-mvp`)

**PRD:** [RF-012](../../../docs/prd.md), [RF-014](../../../docs/prd.md) (subset)  
**Depende de:** [git-commits-and-changes](../git-commits-and-changes/spec.md), [document-export-mvp](../document-export-mvp/spec.md).

---

## Requisitos

### SCR-R01 — Anexar imagens (RF-012)

Com repositório válido seleccionado, o utilizador pode escolher **um ou mais** ficheiros de imagem (PNG, JPEG, WebP, GIF) até um limite documentado; ficheiros inválidos ou demasiado grandes são recusados com mensagem clara.

### SCR-R02 — Dados em sessão

Os anexos vivem em **memória** da sessão; ao mudar o repositório seleccionado, a lista é **limpa** (MVP sem RF-015 persistência).

### SCR-R03 — Associação a commits (RF-014 subset)

Por cada anexo, o utilizador pode opcionalmente associar um **commit** da lista do escopo atual (atualizada quando o resumo do escopo carrega).

### SCR-R04 — Documento e PDF

Screenshots entram no **HTML** do documento de evidência (secção dedicada) e na **exportação por impressão** (RF-011), com legenda e nota de commit associado quando definido.

### SCR-R05 — Segurança em `<img>`

Apenas URLs `data:image/…` geradas localmente a partir do `FileReader` são emitidas no HTML; outras origens são omitidas.

---

## Critérios de aceite

1. Fluxo manual: abrir repo → adicionar imagem → ver na lista → aparecer no preview do documento quando o escopo estiver carregado.
2. Testes do gerador HTML cobrem a secção de screenshots.
