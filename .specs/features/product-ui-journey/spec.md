# Especificação: jornada de UI e shell (produto final vs MVP)

**Slug:** `product-ui-journey`  
**Objetivo:** Declarar a **jornada canónica**, a **ordem dos passos** e os **elementos por ecrã** alinhados ao design em `docs/design.pen`, para que implementação e QA validem paridade visual e comportamental com o produto final — sem substituir `docs/UI-COMPONENTS.md` (tokens, componentes).

**Fonte de design (Pencil):** ficheiro `docs/design.pen`. Nós de ecrã de referência (IDs estáveis no ficheiro):

| # | Nome no canvas | Node ID | Função |
|---|----------------|---------|--------|
| 01 | 01 - Repositorio | `Hbs1b` | Seleção de pasta, recentes, validação Git |
| 02 | 02 - Escopo e commits | `ANhm2` | Base/compare, modo escopo, lista de commits |
| 03 | 03 - Evidencias e conteudo | `fZdOT` | Template, metadados, resumos, métricas, screenshots |
| 04 | 04 - Preview | `X80A7` | Pré-visualização documento, zoom |
| 05 | 05 - Exportar PDF | `Kym43` | Destino, opções PDF, exportação |
| 06 | 06 - Historico de documentos | `D4yXKU` | Biblioteca local / histórico (pós-MVP núcleo) |
| 07 | 07 - Configuracoes | `RYyhA` | Preferências da app |

Painel principal do passo 3 (conteúdo): frame `gbZwC` («Evidencias painel») dentro de `fZdOT`.

**Rastreio PRD:** fluxo desktop §21 (sidebar + wizard); RF coringa por feature (`prd.md`).

---

## Requisitos (rastreáveis)

### UI-R01 — Shell com sidebar fixa

O utilizador vê sempre uma **sidebar** (~276px) com marca, navegação e indicação de ambiente:

- Itens de navegação (ordem): **Repositorios**, **Templates**, **Screenshots**, **Documentos**, **Configuracoes** (iconografia e tipografia conforme `docs/UI-COMPONENTS.md`).
- Rodapé textual: **«Ambiente local — processamento offline.»**
- O item correspondente ao contexto atual deve estar **visualmente activo** (estado seleccionado no design: ex. `ni1` em `Hbs1b`).

**Critério:** Paridade com o bloco `sb` dos ecrãs 01–05 no `.pen`.

---

### UI-R02 — Wizard «Nova evidência» em 5 passos (ordem única)

O fluxo principal de criação de evidência é um **assistente linear de 5 passos**. Os seguintes elementos **devem concordar no mesmo índice N** (sem «saltos» entre breadcrumb, stepper e CTA):

1. **Repositório** — título «Escolha o repositorio Git», breadcrumb «Passo **1** de 5», passo activo **1** no stepper; primário: **«Continuar para escopo»**.
2. **Escopo e commits** — «Defina escopo e commits», «Passo **2** de 5», activo **2**; primário: **«Continuar para evidencias»**.
3. **Evidências e conteúdo** — «Resumo, arquivos e capturas», «Passo **3** de 5», activo **3**; primário: **«Ir para preview»**.
4. **Preview** — «Preview antes de gerar PDF», «Passo **4** de 5», activo **4**; primário: **«Continuar para exportar»**.
5. **Exportar PDF** — «Exportar evidencia em PDF», «Passo **5** de 5», activo **5**; primário: **«Exportar PDF agora»**.

Em **todos** os passos: secundário **«Cancelar»**; faixa de alerta informativa (dados locais / IA).

**Critério:** Stepper horizontal (círculos 1–5 + conectores), breadcrumb `Nova evidencia > Passo N de 5`, e rótulos dos botões primários coincidem com a coluna «primário» acima.

**Nota de implementação:** Se a app usar rotas separadas, a ordem numérica e os labels são a referência; desvios são **SPEC_DEVIATION** até alinhamento.

---

### UI-R03 — Ecrã 03: template, metadados, narrativa e métricas

No passo 3 (`fZdOT` / `gbZwC`), o utilizador dispõe de:

1. **Template**
   - Cabeçalho de secção «Template e campos do documento» + subtítulo.
   - **Template ativo**: selector tipo combobox («Homologacao — padrao enterprise» no exemplo).
   - Acção **«Gerenciar templates»** (secundário/outline).

2. **Metadados de rastreio**
   - **Change ID / ticket** (campo de texto, ex. `CHG-4821`).
   - **Ambiente** (campo de texto ou valor seleccionável, ex. `HML — cluster azul`).

3. **Coluna esquerda — narrativa**
   - **Resumo técnico**: bloco etiquetado; conteúdo derivado de Git (ver [technical-summary-mvp](../technical-summary-mvp/spec.md)).
   - **Regenerar com IA** + **Tone** (ex. «formal»): **Fase 2** — no MVP podem estar desactivados ou escondidos com copy de «brevemente», mas o layout/reserva de espaço segue o design se a equipa optar por UI estática.
   - **Resumo corporativo**: texto orientado a negócio — **Fase 2** (PRD RF-007); mesmo tratamento que IA.

4. **Coluna direita — «Mudancas no codigo»**
   - Métricas agregadas: **ficheiros tocados**, **linhas +/-** (valores coerentes com [git-commits-and-changes](../git-commits-and-changes/spec.md)).

5. **Screenshots**
   - Secção «Screenshots e comparacao» com **Importar arquivo**, grelha de miniaturas (antes/depois), **Nova captura**.
   - Comportamento de dados: [evidence-screenshots-mvp](../evidence-screenshots-mvp/spec.md).

**Critério:** Estrutura em colunas e blocos identificáveis no preview/export como as secções do `gbZwC`.

---

### UI-R04 — Ecrã 04: preview do documento

No passo 4 (`X80A7`):

- Barra de ferramentas: indicação **«Paginas: N • zoom 100%»** e controlos **+** / **−** de zoom.
- Área principal com scroll simula **página** com cabeçalho (Change ID, branch/versão, ambiente), corpo em secções, nota de atualização ao mudar template/commits.
- Copy de rodapé: «Atualiza ao mudar template ou commits marcados».

**Critério:** Preview reage a alterações de escopo, template activo, metadados e anexos (subset [document-export-mvp](../document-export-mvp/spec.md)).

---

### UI-R05 — Ecrã 05: exportação PDF

No passo 5 (`Kym43`):

- **Destino do ficheiro** + botão de escolha de pasta/caminho; **Nome do projecto** associado ao PDF/metadata.
- **Opções de PDF**: pelo menos checkbox **«Numerar paginas automaticamente»**; **«Marca dagua opcional»** pode ser Fase 2 ou não funcional com estado desactivado, desde que o layout exista.
- Faixa informativa: registo de metadata em **SQLite** para **Documentos** (alinhamento com roadmap de persistência).

**Critério:** «Exportar PDF agora» dispara o fluxo acordado em document-export (impressão/HTML) até existir motor nativo.

---

### UI-R06 — Ecrãs 06 e 07 (fora do núcleo MVP documental)

- **Histórico de documentos** (`D4yXKU`): listagem e reabertura de evidências geradas — depende de persistência (RF-015 / SQLite).
- **Configurações** (`RYyhA`): preferências globais (IA, caminhos, limites).

Estes ecrãs são **obrigatórios para paridade completa** com o `.pen`; podem ser entregues após o primeiro PDF ponta-a-ponta.

---

## Matriz MVP → produto final (paridade design)

| Elemento | MVP mínimo aceitável | Paridade com `design.pen` |
|----------|----------------------|---------------------------|
| 5 passos + ordem | Mesmo N em breadcrumb, stepper e CTA | Igual + labels exactos |
| Sidebar | Navegação funcional; item activo | 5 itens + hint offline |
| Passo 1 | Pasta + recentes + erro Git | Layout card + «Explorar» |
| Passo 2 | Refs + lista commits/ficheiros | Modos Diff / SHA / PR-MR (PR-MR pode stub não funcional com badge) |
| Passo 3 | Resumo técnico + métricas + screenshots | + Template selector, Change ID, Ambiente, blocos IA/corporativo (placeholder F2) |
| Passo 4 | Preview HTML útil | + Zoom, cabeçalho metadados |
| Passo 5 | PDF via impressão | + Destino, opções, stripe SQLite copy |
| 06 / 07 | Opcional | Listagem histórico + settings |

---

## Critérios de aceite globais

1. Nenhum ecrã do fluxo «Nova evidência» apresenta **Passo N de 5** inconsistente com o **círculo activo** no stepper.
2. Os botões primários do rodapé seguem **UI-R02** (nomes e ordem do fluxo).
3. O passo 3 inclui **template**, **Change ID**, **ambiente**, **resumo técnico** visível e **métricas** de alterações, ainda que IA/corporativo sejam placeholders explícitos.
4. Referência visual: nós listados no cabeçalho desta página; tokens e classes em `docs/UI-COMPONENTS.md`.

---

## Dependências entre specs

- [git-repository-and-branches](../git-repository-and-branches/spec.md) — passo 1.
- [git-commits-and-changes](../git-commits-and-changes/spec.md) — passo 2.
- [technical-summary-mvp](../technical-summary-mvp/spec.md) — bloco resumo técnico no passo 3.
- [evidence-screenshots-mvp](../evidence-screenshots-mvp/spec.md) — secção screenshots no passo 3.
- [document-export-mvp](../document-export-mvp/spec.md) — preview e PDF (passos 4–5).

---

_Relacionado: [ROADMAP](../../project/ROADMAP.md), [STATE](../../project/STATE.md)._
