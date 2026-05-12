# Tarefas: Repositório Git e branches (`git-repository-and-branches`)

**Especificação:** [spec.md](./spec.md)  
**Design:** _não criado_ — decisões técnicas mínimas descritas por tarefa abaixo.  
**Estado:** **Approved** (2026-05-12) — gates `pnpm test`, `pnpm build`, `cargo test`; UAT T12 verificado.

---

## Plano de execução

### Fase 1 — Fundação (testes + núcleo Rust)

```text
T1 ──→ (T2 ∥ T3*)
       ↓
      T4 → T5 → T6
```

\* **T3** pode iniciar em paralelo com **T2** após **T1** apenas se duas pessoas/agentes evitarem concorrer no mesmo arquivo; na prática **recomenda-se sequencial T1 → T2 → T3** para reduzir conflitos em `lib.rs`/`Cargo.toml`.

### Fase 2 — Front-end da feature (paralelo após T6)

```text
T6 ──→ T7 ──→ T8 ──┬→ T9  [P]
                   └→ T10 [P]   (após T8; T9/T10 não dependem um do outro)
```

### Fase 3 — P2 e integração

```text
T9, T10 ──→ T11 ──→ T12
```

---

## Desdobramento de tarefas

### T1: Infraestrutura Vitest + smoke test em `cn`

**O quê:** Adicionar Vitest, `@testing-library/react`, `jsdom`, script `pnpm test`, `vitest.config.ts`, e um teste mínimo para `cn()` em `src/lib/utils.test.ts`.

**Onde:** `package.json`, `vitest.config.ts`, `src/lib/utils.test.ts`, `tsconfig.json` (se `types`/`include` necessário).

**Depende de:** nada.

**Reutiliza:** `src/lib/utils.ts`.

**Requisito:** _Infra_ (habilita matriz em [.specs/codebase/TESTING.md](../../codebase/TESTING.md)).

**Ferramentas:** pnpm; MCP: n/a.

**Feito quando:**

- [ ] `pnpm test` executa e passa com ≥1 teste.
- [ ] `pnpm build` continua a passar.

**Testes:** unit (Vitest) — o próprio T1 entrega o teste de `cn`.

**Gate:** quick — `pnpm test && pnpm build`

**Commit sugerido:** `chore(test): add vitest and smoke test for cn`

---

### T2: Serviço Rust de acesso a repositório Git (`git2`)

**O quê:** Dependência `git2`; módulo (ex.: `src-tauri/src/services/git_repository.rs`) com: abrir repo por caminho, verificar válido, listar branches locais, resolver HEAD (nome de branch ou detached com hash curto). Testes Rust com repo temporário (`dev-dependencies`: `tempfile`).

**Onde:** `src-tauri/Cargo.toml`, `src-tauri/src/services/`, opcionalmente `src-tauri/src/models/` para DTOs.

**Depende de:** T1 opcional para ordem da equipe; logicamente pode ser apenas após código-base limpo (**recomendação: após T1**).

**Reutiliza:** padrões de erro em [.specs/codebase/CONVENTIONS.md](../../codebase/CONVENTIONS.md).

**Requisitos:** GIT-R01 (lógica), GIT-R03 (dados brutos para UI).

**Nota técnica:** `git2` liga-se a libgit2 (dependência nativa); se o ambiente falhar ao compilar, documentar alternativa (`gix` ou subprocesso `git`) em `design.md` numa próxima iteração — fora desta lista.

**Feito quando:**

- [ ] `cargo test --manifest-path src-tauri/Cargo.toml` passa nos testes novos (incl. repositório temporário inicializado com `git init`).
- [ ] Erros de permissão vs. “não é repo” distinguíveis na API interna.

**Testes:** unit (Rust).

**Gate:** `cargo test --manifest-path src-tauri/Cargo.toml && pnpm build`

**Commit sugerido:** `feat(tauri): add git repository service with tests`

---

### T3: Comandos IPC `validate_git_repository` + `list_branches` / HEAD

**O quê:** Handlers Tauri expostos que delegam ao serviço do T2; tipos serializados (Serde) para `{ branches, head_display, detached }`; registar em `lib.rs`; remover ou substituir o comando exemplo `greet` se já não for preciso.

**Onde:** `src-tauri/src/commands/git/` (mod), `src-tauri/src/lib.rs`.

**Depende de:** T2.

**Requisitos:** GIT-R01, GIT-R03.

**Feito quando:**

- [ ] `invoke` a partir do front (teste manual ou teste de integração futuro) retorna payloads estáveis documentados nos tipos TS em T6.
- [ ] `cargo test` e `pnpm build` passam.

**Testes:** unit nos Rust (_comandos finos_ podem reutilizar mocks do serviço se extrair trait; caso contrário testar via serviço já coberto em T2 — marcar **Tests: unit (Rust)** com nota “cobertura principal no T2”).

**Gate:** `cargo test --manifest-path src-tauri/Cargo.toml && pnpm build`

**Commit sugerido:** `feat(tauri): expose git validate and branch list commands`

---

### T4: `tauri-plugin-dialog` + capacidades para escolher pasta

**O quê:** Adicionar diálogo nativo “abrir pasta”; configurar permissões/capabilities Tauri v2 conforme docs oficiais; API no front `@tauri-apps/plugin-dialog`.

**Onde:** `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, arquivos `capabilities/*.json` ou equivalente gerados pelo projeto, `package.json` (deps front se necessário).

**Depende de:** T3 (para fluxo completo pode iniciar antes do T7 — combinar alterações em `lib.rs`/deps com segurança).

**Requisitos:** GIT-R01 (UX escolha pasta).

**Feito quando:**

- [ ] A app em modo dev abre o diálogo e devolve path sem panic.
- [ ] Build `pnpm tauri build` ou `pnpm build` + `cargo build` conforme workflow do doc.

**Testes:** none (UI nativo do SO; validação manual na T12).

**Gate:** `pnpm build` e compilação Tauri sem erros.

**Commit sugerido:** `feat(tauri): add folder dialog plugin and permissions`

---

### T5: Persistência MRU de repos (≤10 entradas)

**O quê:** Armazenar lista MRU absoluta/canônica sob diretório de dados da app; comandos `recent_repositories_list` / `recent_repositories_add` (ou nome equivalente); dedupe + truncamento 10.

**Onde:** `src-tauri/src/services/recent_repos.rs`, comandos registados em `lib.rs`; formato JSON aceitável se SQLite ainda não estiver instalado por decisão produto — alinhar mais tarde ao PRD §15 quando SQLite existir.

**Depende de:** T4 **e** T3 (ordenar comandos MRU na mesma onda que o plugin de diálogo para merges simples em `lib.rs`).

**Requisitos:** GIT-R02.

**Feito quando:**

- [ ] Reinício da app preserva MRU (teste manual ou teste Rust com diretório temporário dos dados da app, se aplicável).
- [ ] Entrada inválida ao reabrir remove ou notifica conforme spec.

**Testes:** unit (Rust) para lógica MRU em memória/arquivo temporário.

**Gate:** `cargo test --manifest-path src-tauri/Cargo.toml && pnpm build`

**Commit sugerido:** `feat(tauri): persist recent git repository paths`

---

### T6: Tipos + invocadores TypeScript (`features/git/api`)

**O quê:** Criar `src/features/git/types/`, `src/features/git/api/git.commands.ts` com funções tipadas que chamam `invoke` para todos os comandos expostos (validate, branches, MRU).

**Onde:** `src/features/git/`

**Depende de:** T3, T5 (assinaturas estáveis).

**Reutiliza:** `@tauri-apps/api/core`.

**Requisitos:** rastreio GIT-R01–R03 para contratos.

**Feito quando:**

- [ ] `tsc` sem erros; exports públicos pelo `features/git/index.ts` se existir barrel.

**Testes:** none (thin wrappers; regressão pelo build e uso em T8+).

**Gate:** `pnpm build`

*(Matriz [.specs/codebase/TESTING.md](../../codebase/TESTING.md): camada `invoke` fina não exige unit até haver mock pattern — regressão compilando.)*

**Commit sugerido:** `feat(git): add typed Tauri invoke helpers`

---

### T7: Store Zustand `git`-slice

**O quê:** Estado: `repositoryPath`, `validationError`, `branches`, `headDisplay`, `recentRepos`, `branchFilter`, `baseBranch`, `compareBranch`; acções assíncronas que chamam API do T6.

**Onde:** `src/features/git/store/` ou `src/store/git-store.ts` (!! preferir pasta da feature por guidelines).

**Depende de:** T6.

**Requisitos:** GIT-R01–R03, base para GIT-R04–R05.

**Feito quando:**

- [ ] Sem dependências circulares; importável pelos componentes.

**Testes:** unit opcional com store puro (Vitest) — **recomendado** se lógica de MRU merge no front; senão **none**, gate build.

**Gate:** `pnpm test` (se houver teste) `&&` `pnpm build`; se Tests none, `pnpm build` apenas.

**Commit sugerido:** `feat(git): add zustand store for repository and branches`

---

### T8: Hook `useGitRepository` (orquestra diálogo + comandos)

**O quê:** Hook que liga `open` do dialog (T4), validação, carregamento de branches, MRU refresh; tratamento de erro por tipo.

**Onde:** `src/features/git/hooks/use-git-repository.ts`

**Depende de:** T4, T7.

**Requisitos:** GIT-R01, GIT-R02, GIT-R03 (fluxo).

**Testes:** unit com `invoke` mockado (Vitest) — **recomendado** 1–2 casos (sucesso/erro).

**Gate:** `pnpm test && pnpm build`

**Commit sugerido:** `feat(git): add useGitRepository hook`

---

### T9: UI — seleção de repositório + lista recente + erros [P]

**O quê:** Componente(s) para botão “Escolher pasta”, lista MRU, mensagens de erro acessíveis; tokens `docs/UI-COMPONENTS.md`.

**Onde:** `src/features/git/components/repository-section.tsx` (ou nomes alinhados ao slice).

**Depende de:** T8.

**Requisitos:** GIT-R01, GIT-R02.

**Testes:** unit (RTL) com mocks — mínimo render + erro visível.

**Gate:** `pnpm test && pnpm build`

**Commit sugerido:** `feat(git): add repository selection UI`

---

### T10: UI — lista de branches + destaque da atual [P]

**O quê:** Lista scrollável; HEAD atual ou “detached @ abc123”; estado vazio explícito.

**Onde:** `src/features/git/components/branch-list.tsx`

**Depende de:** T8 (dados no store).

**Requisitos:** GIT-R03.

**Testes:** unit (RTL) com estado da store mockado.

**Gate:** `pnpm test && pnpm build`

**Commit sugerido:** `feat(git): add branch list UI`

---

### T11: P2 — filtro de branches + par base/compare

**O quê:** Campo de filtro (case-insensitive); seleção de duas branches com validação “iguais”; persistência só de sessão OK.

**Onde:** estender `branch-list.tsx` ou novos componentes; store T7.

**Depende de:** T9, T10.

**Requisitos:** GIT-R04, GIT-R05.

**Testes:** unit para função de filtro pura + 1 teste RTL se aplicável.

**Gate:** `pnpm test && pnpm build`

**Commit sugerido:** `feat(git): branch filter and compare selection`

---

### T12: Integração na shell da app + verificação manual

**O quê:** Compor `App.tsx` (ou `src/app/`) com layout base e secções da feature; checklist UAT alinhada à spec (pasta inválida, válida, MRU, branches, filtro, par compare).

**Onde:** `src/App.tsx`, possivelmente `src/layouts/`.

**Depende de:** T11.

**Requisitos:** todos GIT-R*.

**Testes:** none (E2E fora de escopo até ferramenta existir); validação humana.

**Gate:** `pnpm test && pnpm build` + checklist UAT em comentário breve no PR ou em `Verify` abaixo.

**Feito quando:**

- [x] Checklist: path não-Git mostra erro; Git válido lista branches; restart mantém MRU; filtro P2 funciona; aviso se base=compare.

**Commit sugerido:** `feat(app): wire git repository feature into main shell`

---

## Mapa de execução paralela

| Fase | Paralelo seguro | Notas |
|------|-----------------|-------|
| T9 e T10 | Sim (`[P]`) | Arquivos distintos; mesmo store — coordenar commits ou um PR único com dois commits atômicos. |
| T2 e T1 | Possível em equipe | Risco de merge em `package.json` se T1 altera e T2 não — preferir **T1 antes de T2**. |

---

## Verificação de granularidade

| Tarefa | Escopo | Estado |
|--------|--------|--------|
| T1 | 1 preocupação (tooling + 1 teste) | ✅ |
| T2 | 1 serviço Rust coeso | ✅ |
| T3 | Comandos IPC num módulo | ✅ |
| T4 | Plugin diálogo isolado | ✅ |
| T5 | Serviço MRU | ✅ |
| T6 | Camada API TS | ✅ |
| T7 | Store | ✅ |
| T8 | 1 hook | ✅ |
| T9–T10 | 1 componente principal cada | ✅ |
| T11 | P2 coeso (aceitável) | ✅ |
| T12 | Integração app | ✅ |

---

## Diagrama ↔ dependências (cross-check)

| Tarefa | Depende de (corpo) | Diagrama | Estado |
|--------|---------------------|----------|--------|
| T1 | — | Raiz | ✅ |
| T2 | T1 (recomendado) | Após T1 | ✅ |
| T3 | T2 | Após T2 | ✅ |
| T4 | T3 | Após T3 | ✅ |
| T5 | T4, T3 | Após T4 | ✅ |
| T6 | T3, T5 | Após T5 | ✅ |
| T7 | T6 | Após T6 | ✅ |
| T8 | T4, T7 | Após T7 | ✅ |
| T9 | T8 | Após T8 | ✅ |
| T10 | T8 | Após T8 (paralelo a T9) | ✅ |
| T11 | T9, T10 | Após ambos | ✅ |
| T12 | T11 | Final | ✅ |

---

## Co-localização de testes (matriz)

| Tarefa | Camada alterada | Matriz TESTING.md | Campo `Tests` | Estado |
|--------|-----------------|-------------------|---------------|--------|
| T1 | `src/lib` | Após adoção: unit Vitest | unit | ✅ |
| T2 | Rust serviço | unit `cargo test` | unit (Rust) | ✅ |
| T3 | Comandos finos | unit se testável; senão coberto por T2 | unit (Rust) com nota | ✅ |
| T4 | integração SO | none | none | ✅ |
| T5 | Rust MRU | unit | unit (Rust) | ✅ |
| T6 | API invoke | none até mock | none | ✅ |
| T7 | store | unit opcional | unit opcional / none + build | ✅ |
| T8 | hook | unit com mock | unit (recomendado) | ✅ |
| T9 | componente | unit RTL | unit | ✅ |
| T10 | componente | unit RTL | unit | ✅ |
| T11 | UI + filtros | unit | unit | ✅ |
| T12 | integração | E2E none | none + gates | ✅ |

---

## MCP / skills por tarefa (pergunta TLC)

Ao executar, por tarefa: **filesystem/código** disponível aqui; **Context7 MCP** recomendado para APIs Tauri 2/plugin-dialog; skill **tlc-spec-driven** já cobre estrutura. Ajustar se ativares MCPs específicos no IDE.

---

**Encerramento:** Feature concluída. Próximo marco: [git-commits-and-changes](../git-commits-and-changes/tasks.md) (RF-004 / RF-005).
