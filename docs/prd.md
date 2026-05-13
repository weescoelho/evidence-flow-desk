# Product Requirements Document (PRD)

# EvidenceFlow Desktop

Sistema desktop para geração automatizada de evidências técnicas de desenvolvimento de software baseado em commits Git, screenshots e automações.

---

# 1. Visão Geral

## Objetivo

O objetivo do sistema é automatizar a criação de documentos de evidência técnica utilizados em processos corporativos de:

- homologação
- auditoria
- sustentação
- governança
- gestão de mudanças
- compliance
- release management

O sistema deverá analisar alterações realizadas em repositórios Git e gerar automaticamente documentos PDF contendo:

- commits
- diffs resumidos
- arquivos alterados
- screenshots
- resumos técnicos
- release notes
- rastreabilidade da mudança

O produto será uma aplicação desktop desenvolvida com Tauri, funcionando localmente e suportando operação offline.

---

# 2. Problema

Atualmente a geração de evidências é feita manualmente, causando:

- alto custo operacional
- retrabalho
- documentação inconsistente
- perda de rastreabilidade
- baixa qualidade visual
- dificuldades em auditoria
- dificuldade em gerar release notes
- screenshots manuais repetitivas

Os times técnicos frequentemente precisam:

- copiar commits manualmente
- escrever resumos técnicos
- tirar prints
- montar documentos Word/PDF
- organizar evidências
- padronizar documentos

Esse processo é lento e sujeito a falhas.

---

# 3. Objetivos do Produto

## Objetivos Principais

- Automatizar geração de evidências
- Padronizar documentação técnica
- Reduzir tempo operacional
- Melhorar rastreabilidade
- Melhorar experiência de auditoria
- Melhorar qualidade visual
- Permitir operação local/offline
- Facilitar geração de release notes

---

# 4. Público-Alvo

## Primário

- Desenvolvedores
- Tech Leads
- QA Engineers
- DevOps
- Analistas de sustentação

## Secundário

- Auditoria
- Governança
- Gestão
- Compliance
- Gerentes de projeto

---

# 5. Stack Tecnológica

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Zustand
- TanStack Query

## Desktop Runtime

- Tauri

## Backend Local

- Rust

## Persistência

- SQLite

## Template Engine

- Handlebars ou EJS

## PDF Engine

- HTML → PDF

## Syntax Highlight

- Shiki

---

# 6. Arquitetura

## Arquitetura Geral

```txt
UI Layer
↓
Application Layer
↓
Domain Layer
↓
Infrastructure Layer
```

---

## Estrutura Modular

```txt
core/
  git-engine
  ai-engine
  template-engine
  pdf-engine
  screenshot-engine
  storage-engine

apps/
  desktop/
```

---

## Estrutura de Diretórios

```txt
src/
  components/
  pages/
  modules/
    git/
    evidence/
    screenshots/
    templates/
    ai/
    settings/
  services/
  store/
  hooks/

src-tauri/
  src/
    commands/
    services/
    models/
    git/
    pdf/
    screenshots/
```

---

# 7. Requisitos Funcionais

# RF-001 — Seleção de Repositório

O sistema deve permitir selecionar um repositório Git local.

## Critérios

- Detectar automaticamente se é Git
- Exibir erro se inválido
- Persistir histórico recente

---

# RF-002 — Leitura de Branches

O sistema deve listar branches disponíveis.

## Critérios

- Exibir branch atual
- Permitir busca
- Permitir comparação entre branches

---

# RF-003 — Seleção de Escopo

O usuário deve conseguir gerar evidências por:

- branch
- intervalo de commits
- tag
- pull request
- merge request

---

# RF-004 — Extração de Commits

O sistema deve extrair:

- hash
- autor
- data
- mensagem
- tipo

## Tipos suportados

- feat
- fix
- refactor
- docs
- chore
- perf
- test

---

# RF-005 — Extração de Alterações

O sistema deve identificar:

- arquivos adicionados
- modificados
- removidos
- renomeados

## Métricas

- linhas adicionadas
- linhas removidas

---

# RF-006 — Resumo Técnico Automático

O sistema deve gerar resumo técnico baseado em commits e diffs.

## Exemplo

Entrada:

```txt
fix: corrige timeout da API
```

Saída:

```txt
Realizado ajuste no controle de timeout das integrações da API visando maior estabilidade operacional.
```

---

# RF-007 — Resumo Corporativo

O sistema deve transformar linguagem técnica em linguagem corporativa.

---

# RF-008 — Release Notes

O sistema deve gerar release notes automaticamente.

---

# RF-009 — Sistema de Templates

O sistema deve suportar múltiplos templates de documento.

## Configurações

- logo
- cores
- cabeçalho
- rodapé
- fontes
- seções

---

# RF-010 — Preview do Documento

O sistema deve permitir preview em tempo real.

---

# RF-011 — Exportação PDF

O sistema deve exportar PDF com:

- paginação automática
- cabeçalho
- rodapé
- imagens
- tabelas
- syntax highlight

---

# RF-012 — Screenshots Manuais

O usuário deve conseguir anexar screenshots manualmente.

---

# RF-013 — Automação de Screenshots

**Fora do escopo.** A automação de browser (incl. Playwright) não faz parte do produto. Evidências visuais via **screenshots manuais** — ver RF-012.

---

# RF-014 — Associação de Evidências

O usuário deve associar screenshots a:

- commits
- funcionalidades
- etapas

---

# RF-015 — Histórico de Evidências

O sistema deve armazenar documentos gerados localmente.

---

# RF-016 — Busca e Filtros

O sistema deve permitir filtros por:

- commit
- autor
- data
- arquivo
- tipo

---

# RF-017 — Integração com IA

O sistema deve suportar:

- OpenAI
- Ollama
- LM Studio
- OpenRouter

---

# RF-018 — Funcionamento Offline

O sistema deve funcionar sem internet.

---

# RF-019 — Comparação Visual

O sistema deve permitir screenshots before/after.

---

# RF-020 — Integrações Futuras

O sistema deverá possuir arquitetura preparada para:

- Jira
- Azure DevOps
- ServiceNow

---

# 8. Requisitos Não Funcionais

# RNF-001 — Performance

O sistema deve processar:

- até 1000 commits
- até 500 arquivos

em menos de 30 segundos.

---

# RNF-002 — Segurança

Todo processamento deve ocorrer localmente.

Nenhum código deve ser enviado externamente sem autorização explícita.

---

# RNF-003 — Compatibilidade

Sistemas suportados:

- Windows
- Linux
- macOS

---

# RNF-004 — UX

A interface deve ser:

- moderna
- minimalista
- rápida
- intuitiva

---

# RNF-005 — Escalabilidade

A arquitetura deve permitir futura evolução SaaS.

---

# 9. Fluxo Principal

## Happy Path

```txt
Selecionar repositório
↓
Selecionar commits
↓
Analisar alterações
↓
Gerar resumo
↓
Adicionar screenshots
↓
Preview
↓
Exportar PDF
```

---

# 10. Modelagem Inicial

## Commit

```ts
type Commit = {
  hash: string
  author: string
  date: string
  message: string
  type: string
}
```

---

## FileChange

```ts
type FileChange = {
  path: string
  additions: number
  deletions: number
  status: string
}
```

---

## Screenshot

```ts
type Screenshot = {
  id: string
  path: string
  description: string
  relatedCommit?: string
}
```

---

## EvidenceDocument

```ts
type EvidenceDocument = {
  id: string
  project: string
  changeId: string
  environment: string
  generatedAt: string

  commits: Commit[]
  files: FileChange[]
  screenshots: Screenshot[]

  summary: string
}
```

---

# 11. Estrutura do Documento Gerado

# Cabeçalho

- Projeto
- Ambiente
- Responsável
- Data
- Change ID
- Branch

---

# Seções

## Resumo Executivo

## Commits

## Arquivos Alterados

## Métricas

## Evidências Visuais

## Release Notes

## Aprovação

---

# 12. Sistema de Templates

## Estrutura

```json
{
  "name": "Enterprise Default",
  "logo": "logo.png",
  "colors": {
    "primary": "#0F172A"
  },
  "sections": [
    "summary",
    "commits",
    "files",
    "screenshots"
  ]
}
```

---

# 13. Sistema de IA

## Objetivos

- gerar resumo técnico
- gerar resumo corporativo
- categorizar commits
- identificar impacto
- gerar release notes

---

## Interface

```ts
interface AIProvider {
  summarize(diff: string): Promise<string>
}
```

---

# 14. Sistema de Screenshots

No **MVP**, as evidências visuais são **anexos manuais** (PNG, JPEG, WebP, GIF) com validação e limite na aplicação — ver **RF-012**. As imagens podem **persistir por repositório** (SQLite local).

A automação de browser e pipelines do tipo *goto* / *click* / *screenshot* (**RF-013**) está **fora do escopo**; não há execução de «passos» Playwright nem fila de acções integrada.

---

# 15. Persistência

## SQLite

O sistema deve persistir:

- templates
- histórico
- preferências
- documentos gerados
- capturas de evidência por repositório (imagens, metadados SQLite)

---

# 16. MVP

## Inclusos

- seleção Git
- leitura commits
- leitura diff
- resumo simples
- templates básicos
- exportação PDF
- screenshots manuais
- assistência IA **opcional** via Google Gemini (resumo corporativo / reescrita do resumo técnico quando o utilizador configura a API — subset RF-017)

## Não Inclusos

- autenticação
- colaboração
- sincronização cloud
- OCR
- Jira
- motores de IA adicionais e pipelines completos RF-007/008/017 (além do **subset** Gemini opcional em Configurações)
- automação de browser (Playwright ou equivalente)

---

# 17. Roadmap

# Fase 2

- IA local
- Jira
- Azure DevOps
- comparação visual

---

# Fase 3

- SaaS
- dashboard
- analytics
- colaboração
- assinatura digital

---

# 18. Diferenciais Competitivos

- execução local
- operação offline
- IA opcional
- integração Git nativa
- foco corporativo
- geração visual avançada

---

# 19. Critérios de Sucesso

## Métricas

- Redução de 80% no tempo operacional
- Padronização documental
- Melhor rastreabilidade
- Menos retrabalho
- Melhor experiência de auditoria

---

# 20. Possíveis Nomes

- EvidenceFlow
- DeployProof
- AuditSnap
- ReleaseEvidence
- GitEvidence
- ChangeProof
- CommitAudit

---

# 21. Considerações de UX

## Navegação

- sidebar
- wizard step-by-step
- preview em tempo real

---

## Sidebar

```txt
Repositories
Templates
Screenshots
Documents
Settings
```

---

## Wizard

```txt
Step 1 → Selecionar repositório
Step 2 → Selecionar commits
Step 3 → Configurar evidências
Step 4 → Preview
Step 5 → Exportar
```

---

# 22. Restrições Técnicas

- Deve funcionar offline
- Não depender de backend
- Deve suportar monorepos
- Deve suportar grandes volumes
- Deve permitir futura extração para CLI

---

# 23. Considerações Futuras

## Possíveis Evoluções

- OCR
- IA multimodal
- geração automática por PR
- geração automática por tag
- análise de impacto
- análise semântica de código
- integração CI/CD

---

# 24. Conceito Final

O produto deverá funcionar como uma plataforma desktop especializada em:

- rastreabilidade técnica
- geração automatizada de evidências
- release management
- documentação corporativa
- auditoria técnica

com foco em:

- produtividade
- padronização
- qualidade visual
- automação
- operação offline
- integração com Git