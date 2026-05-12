# Especificação: commits e alterações por escopo (`git-commits-and-changes`)

**PRD:** [RF-003](../../../docs/prd.md) (escopo), [RF-004](../../../docs/prd.md) (extração de commits), [RF-005](../../../docs/prd.md) (extração de alterações).  
**Depende de:** [git-repository-and-branches](../git-repository-and-branches/spec.md) (repo válido, branches base/compare).  
**Jornada UI:** passo **2** — [product-ui-journey](../product-ui-journey/spec.md) (ecrã `ANhm2`: branches, modos, tabela de commits).

---

## Requisitos (rastreáveis)

### CHG-R01 — Commits no intervalo entre duas refs

**Dado** um repositório aberto e duas refs resolvíveis (nomes de branch ou equivalentes), **o sistema** deve listar os commits presentes em `compare` que não estão em `base` (semântica `git log base..compare`).

### CHG-R02 — Campos por commit

Cada commit deve expor, no mínimo: hash completo e curto, autor (nome, e-mail), instante de autor, mensagem completa, primeira linha (resumo), tipo conventional quando reconhecível (`feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `test`).

### CHG-R03 — Alterações cumulativas de ficheiros

**Dado** o mesmo par de refs, **o sistema** deve calcular o diff **entre o ancestral comum** (`merge-base`) e o extremo `compare`, reportando cada ficheiro com estado (adicionado, modificado, removido, renomeado, copiado, outro) e contagem de linhas adicionadas/removidas por ficheiro quando aplicável.

### CHG-R04 — Limite de escala

Para repositórios muito grandes, o mapeamento de commits deve limitar-se a um teto documentado (p.ex. 2000) e sinalizar truncagem ao cliente.

### CHG-R05 — Refs inválidas

Refs que não resolvam ou caminhos inválidos devem produzir mensagens de erro distinguíveis (`io_error` / texto útil).

### CHG-R06 — Escopo por refs Git (subset RF-003)

**Dado** um repositório aberto, **o sistema** deve permitir definir base e comparação como **qualquer ref resolvível pelo Git** (não só nomes de branch na lista), incluindo pelo menos **tags** e **commits** (hash completo), além de expressões que `git rev-parse` aceite (ex.: `main~2`). A UI sugere branches locais via datalist, mantendo entrada livre.

**Critério UX:** A lista de commits carregada deve oferecer atalho para usar um commit como base ou como comparação.

---

## Fora deste incremento (MVP alargado / Fase 2)

- Pull request / merge request remoto (RF-003) sem API fornecida pelo hosting.
- Exportação ou PDF (RF-011).
- E2E automatizado.

---

## Critérios de aceite (slice actual)

1. Com **duas refs distintas** (branches, tags, commits ou expressões válidas) na UI, a app mostra lista de commits e de ficheiros coerente com `git log` / diff cumulativo num repo de teste.
2. `pnpm test`, `pnpm build`, `cargo test --manifest-path src-tauri/Cargo.toml` passam.
3. UAT manual: repo com branch à frente da default — aparecem commits e o novo ficheiro na lista; opcionalmente repetir com **tag** como base e branch de feature como compare.
