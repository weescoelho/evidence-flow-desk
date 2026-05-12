# Especificação: Repositório Git e branches (RF-001 + RF-002)

**Slug:** `git-repository-and-branches`  
**Rastreio PRD:** [RF-001](../../docs/prd.md#rf-001--seleção-de-repositório), [RF-002](../../docs/prd.md#rf-002--leitura-de-branches)  
**Refs de arquitetura/UI:** [`docs/ARCH-GUIDELINES.md`](../../docs/ARCH-GUIDELINES.md) (`features/git/`), [`docs/UI-COMPONENTS.md`](../../docs/UI-COMPONENTS.md) — shell com sidebar quando a tela entrar no produto.

## Problema

Sem um repositório selecionado e validado, o fluxo do Evidence Flow não pode carregar dados Git. Sem listagem de branches (e contexto da branch atual), não é possível escolher o escopo inicial de evidências. Esta slice entrega laço fechado: **escolher repo → saber que é Git → ver branches → destacar atual**, com ergonomia para reabrir projetos frequentes.

## Objetivos

- [ ] O usuário conclui seleção ou troca de repositório com feedback claro (sucesso ou erro não ambíguo).
- [ ] Após reabrir a app, o usuário continua a ver **histórico recente** de pastas Git válidas e pode reabrir uma delas em ≤2 cliques.
- [ ] Com repositório válido, o usuário vê **lista de branches**, identifica a **branch atual** e (P2) filtra por texto e prepara **comparação entre duas branches** para passos futuros de escopo.

## Fora de escopo

| Item | Motivo |
|------|--------|
| RF-003 (intervalo de commits, tags, PR/MR) | Milestone seguinte; depende de escopo mas não pertence a esta slice. |
| Visualização de diff entre branches | Conteúdo de alterações — RF-005 / motor de diff. |
| Monorepo / submódulos avançados | Comportamento explícito virá com RF-003 e testes de volume. |
| Autenticação remota / clone | Fora do MVP de desktop local. |

---

## User stories

### P1: Selecionar pasta e validar repositório Git — MVP

**User story:** Como usuário técnico, quero indicar uma pasta local para que a app confirme que é um repositório Git antes de continuar o fluxo.

**Porquê P1:** Bloqueador absoluto para qualquer funcionalidade dependente de Git.

**Critérios de aceite:**

1. WHEN o usuário escolhe uma pasta (diálogo nativo do SO) THEN o sistema SHALL verificar presença de repositório Git válido (ex.: diretório `.git` acessível ou equivalente para worktrees conforme comportamento definido na implementação).
2. WHEN a pasta não for um repositório Git válido THEN o sistema SHALL apresentar mensagem de erro compreensível e SHALL NOT persistir essa pasta no histórico recente como sucesso.
3. WHEN a validação falhar por permissões ou E/S THEN o sistema SHALL apresentar erro distinto de “não é Git”, quando determinável pelo backend.

**Teste independente:** Abrir app → escolher pasta sem `.git` → ver erro → escolher clone válido → estado “repo selecionado” atualizado sem crash.

---

### P1: Persistir e reutilizar histórico recente de repositórios — MVP

**User story:** Como usuário frequente, quero que repositórios válidos fiquem guardados localmente para reabrir sem navegar sempre no filesystem.

**Porquê P1:** Critérios explícitos do PRD (RF-001 — histórico recente).

**Critérios de aceite:**

1. WHEN um repositório é validado com sucesso pela primeira vez na sessão THEN o sistema SHALL adicionar o seu caminho canônico/absoluto a uma lista persistente **recente**.
2. WHEN o mesmo caminho volta a ser aberto THEN o sistema SHALL não duplicar entradas; ordem pelo mais recente primeiro (MRU).
3. WHEN o usuário seleciona uma entrada recente válida THEN o sistema SHALL repetir validação rápida (rápido o suficiente para UI fluida); se falhar (repo movido/eliminado) THEN SHALL remover ou marcar inválido e informar.
4. WHEN existe um limite de entradas no produto _(proposta: **10** MRU truncadas)._ SHALL ser aplicado e documentado no código quando implementado.

**Teste independente:** Abrir dois repos válidos em sequência → fechar app → reabrir → ver ambos nos recentes → selecionar um → estado correto.

---

### P1: Listar branches e indicar branch atual — MVP

**User story:** Como usuário, quero ver as branches disponíveis no repositório e qual está atualmente selecionada (HEAD).

**Porquê P1:** Critérios RF-002 — pré-requisito para seleção de escopo.

**Critérios de aceite:**

1. WHEN existe repositório selecionado e válido THEN o sistema SHALL listar branches disponíveis (**locais** como requisito mínimo MVP).
2. WHEN a lista é apresentada THEN o sistema SHALL distinguir visualmente a **branch atual** conforme [`docs/UI-COMPONENTS.md`](../../docs/UI-COMPONENTS.md) (tokens/item ativo ou badge equivalente).
3. WHEN não existem branches retornadas THEN o sistema SHALL mostrar estado explícito (“nenhuma branch” ou erro técnico) sem lista silenciosa vazia ambígua.

**Teste independente:** Repo com várias branches → lista contém esperadas → atual aparece destacada.

---

### P2: Busca / filtro na lista de branches

**User story:** Como usuário em repo com muitas branches, quero filtrar por texto para encontrar rápido.

**Porquê P2:** PRD RF-002 “Permitir busca”; não bloqueia o happy path inicial.

**Critérios de aceite:**

1. WHEN o usuário escreve num campo de filtro THEN o sistema SHALL mostrar apenas branches cujo nome contém a substring (recomendação: **case-insensitive**).
2. WHEN o filtro remove todas as coincidências THEN o sistema SHALL comunicar lista vazia **por filtro** vs. estado de erro.

**Teste independente:** Repo de teste com 20+ branches → filtrar prefixo esperado → subset correto.

---

### P2: Selecionar duas branches para comparação (preparação de escopo)

**User story:** Como usuário, quero designar uma branch base e uma branch de comparação para usar em evidências depois.

**Porquê P2:** PRD RF-002 “comparação entre branches”; nesta slice trata só da **escolha do par** — sem motor de diff.

**Critérios de aceite:**

1. WHEN o usuário escolhe “base” e “compare” branches THEN o sistema SHALL guardar esse par no estado da app (slice / store global) consumível pelas próximas features.
2. WHEN as duas referências são iguais THEN o sistema SHALL impedir ou avisar antes de aceitar como comparação útil.

**Teste independente:** Selecionar duas branches distintas → estado persiste na sessão; persistência cross-session até consolidar em RF-003.

---

## Edge cases

- WHEN HEAD detached THEN o sistema SHALL expor esse estado (“detached HEAD @ &lt;hash curto&gt;”) em vez de nome de branch inexistente.
- WHEN há falha na operação Git (binário ausente vs. erro de biblioteca) THEN a mensagem SHOULD orientar o próximo passo quando causas forem determináveis.
- WHEN há muitos branches (&gt; 500) THEN a UX SHOULD manter tempo de resposta perceptível alinhável ao RNF-001 (**medir na implementação**).

---

## Rastreio de requisitos

| ID | Story | Estado |
|----|-------|--------|
| GIT-R01 | P1: Validar repositório | Pending |
| GIT-R02 | P1: Histórico MRU persistente | Pending |
| GIT-R03 | P1: Listar branches + destacar atual | Pending |
| GIT-R04 | P2: Filtro de branches | Pending |
| GIT-R05 | P2: Par base/compare para escopo futuro | Pending |

**Próximo passo TLC:** seguir [tasks.md](./tasks.md) (fase **Implement**); opcional `design.md` se `git2`/libgit2 falharem no ambiente alvo.

---

## Critérios de sucesso da feature

- [ ] Núcleo P1 RF-001+RF-002 demonstrável **offline**.
- [ ] Pasta não-Git: erro explícito, sem silent fail.
- [ ] Lista recente sobrevive ao reinício da app após MVP desta slice.
- [ ] Módulos em **`src/features/git/`** + **`src-tauri`** com comandos IPC explícitos, como em [`docs/ARCH-GUIDELINES.md`](../../docs/ARCH-GUIDELINES.md).
