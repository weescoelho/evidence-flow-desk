# Architecture Guidelines - EvidenceFlow Desktop

This document defines the architectural principles and structure for the EvidenceFlow Desktop application, following a **Vertical Slice Architecture** approach.

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Architecture Overview](#2-architecture-overview)
3. [Project Structure](#3-project-structure)
4. [Vertical Slice Organization](#4-vertical-slice-organization)
5. [Module Boundaries](#5-module-boundaries)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [State Management](#7-state-management)
8. [Tauri/Rust Backend Guidelines](#8-taurirust-backend-guidelines)
9. [Data Flow](#9-data-flow)
10. [Error Handling](#10-error-handling)
11. [Testing Strategy](#11-testing-strategy)
12. [Code Quality](#12-code-quality)
13. [Evolution Guidelines](#13-evolution-guidelines)

---

## 1. Core Principles

### 1.1 Vertical Slice Architecture

Organize code by **features**, not by technical layers. Each feature is a self-contained slice that includes everything it needs.

```
Traditional Layered (AVOID)          Vertical Slice (PREFER)
├── components/                       features/
│   ├── Button.tsx                       git/
│   ├── Modal.tsx                       │   ├── components/
│   └── Table.tsx                       │   ├── hooks/
├── hooks/                              │   ├── services/
│   ├── useGit.ts                       │   ├── types/
│   └── usePDF.ts                       │   └── api/
│   services/                           evidence/
│   ├── git.ts                          │   ├── components/
│   └── pdf.ts                          │   ├── hooks/
│   types/                               │   ├── services/
│   ├── git.ts                          │   └── types/
│   └── pdf.ts                          screenshots/
└── ...                                    └── ...
```

### 1.2 Key Principles

| Principle | Description |
|-----------|-------------|
| **Cohesion** | Related code lives together in the same slice |
| **Low Coupling** | Modules communicate through well-defined interfaces |
| **Single Responsibility** | Each module has one clear purpose |
| **Open/Closed** | Open for extension, closed for modification |
| **Dependency Inversion** | Depend on abstractions, not concretions |

### 1.3 Dependency Rules

```
UI Layer
    ↓
Feature Module (Self-contained)
    ↓
Shared Services / Core
    ↓
Infrastructure (Tauri Commands, SQLite, File System)
```

**Rules:**
- Features CAN depend on Shared/Core
- Features CANNOT depend on other Features directly
- UI components CAN depend on Feature hooks/services
- Never create circular dependencies

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                            │
│  (React Components, Pages, shadcn/ui, TailwindCSS)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Feature Slices                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │   Git   │ │Evidence │ │Screensh.│ │Template │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared / Core                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Types  │ │ Services│ │  Hooks  │ │  Utils  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Tauri   │ │ SQLite  │ │ File    │ │  PDF    │          │
│  │Commands │ │         │ │ System  │ │ Engine  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

### 3.1 Frontend (src/)

```
src/
├── app/                          # Application entry & routing
│   ├── App.tsx
│   └── main.tsx
│
├── features/                     # Vertical slices (PRIMARY)
│   ├── git/
│   ├── evidence/
│   ├── screenshots/
│   ├── templates/
│   ├── ai/
│   └── settings/
│
├── components/                   # Shared UI components ONLY
│   ├── ui/                       # shadcn/ui components
│   └── shared/                   # Truly shared components
│
├── core/                         # Shared utilities & services
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── lib/
│
├── pages/                        # Page compositions (optional)
├── store/                        # Global state (Zustand)
├── layouts/                     # Layout components
└── styles/                      # Global styles
```

### 3.2 Backend (src-tauri/src/)

```
src-tauri/src/
├── main.rs                       # Entry point
├── lib.rs                         # Tauri setup & commands
│
├── commands/                     # Tauri command handlers
│   ├── git/
│   ├── evidence/
│   ├── screenshots/
│   └── templates/
│
├── services/                     # Business logic
│   ├── git_service.rs
│   ├── pdf_service.rs
│   └── storage_service.rs
│
├── models/                       # Data models
│   ├── commit.rs
│   ├── file_change.rs
│   └── evidence.rs
│
└── infrastructure/               # External integrations
    ├── git/
    ├── database/
    └── filesystem/
```

---

## 4. Vertical Slice Organization

### 4.1 Feature Slice Template

Each feature follows this structure:

```
feature-name/
├── components/                   # Feature-specific UI components
│   ├── index.ts                  # Public exports
│   ├── FeatureList.tsx
│   ├── FeatureCard.tsx
│   └── FeatureModal.tsx
│
├── hooks/                        # Feature-specific hooks
│   ├── useFeature.ts
│   ├── useFeatureState.ts
│   └── useFeatureActions.ts
│
├── services/                     # Feature business logic
│   ├── feature.service.ts       # Service class/functions
│   └── feature.types.ts          # Service-specific types
│
├── types/                        # Feature-specific types
│   ├── index.ts
│   ├── feature.models.ts
│   └── feature.api.ts
│
├── api/                          # Tauri command invocations
│   ├── feature.commands.ts       # Invoke commands
│   └── feature.events.ts         # Listen to events
│
└── index.ts                      # Module public API
```

### 4.2 Example: Git Feature Slice

```
features/
└── git/
    ├── components/
    │   ├── index.ts
    │   ├── RepositorySelector.tsx
    │   ├── BranchList.tsx
    │   ├── CommitList.tsx
    │   ├── CommitDetails.tsx
    │   └── DiffViewer.tsx
    │
    ├── hooks/
    │   ├── index.ts
    │   ├── useRepository.ts
    │   ├── useBranches.ts
    │   ├── useCommits.ts
    │   └── useDiff.ts
    │
    ├── services/
    │   ├── git.service.ts
    │   └── git.types.ts
    │
    ├── types/
    │   ├── index.ts
    │   ├── commit.model.ts
    │   ├── branch.model.ts
    │   └── diff.model.ts
    │
    ├── api/
    │   ├── git.commands.ts
    │   └── git.events.ts
    │
    └── index.ts
```

### 4.3 Feature Index Export Pattern

```typescript
// features/git/index.ts

// Components
export { RepositorySelector } from './components/RepositorySelector'
export { BranchList } from './components/BranchList'
export { CommitList } from './components/CommitList'
export { CommitDetails } from './components/CommitDetails'
export { DiffViewer } from './components/DiffViewer'

// Hooks
export { useRepository } from './hooks/useRepository'
export { useBranches } from './hooks/useBranches'
export { useCommits } from './hooks/useCommits'
export { useDiff } from './hooks/useDiff'

// Types
export type { Commit, Branch, Diff, Repository } from './types'

// Services
export { GitService } from './services/git.service'
```

---

## 5. Module Boundaries

### 5.1 Feature Independence

Features must be **independent** and communicate through:

1. **Public API** (exports from index.ts)
2. **Store** (shared state)
3. **Events** (cross-feature communication)
4. **Tauri Commands** (backend communication)

### 5.2 Forbidden Patterns

```typescript
// ❌ WRONG: Direct import between features
import { CommitList } from '@/features/git/components/CommitList'
import { useEvidenceStore } from '@/features/evidence/store' // IN FEATURE

// ✅ CORRECT: Use store or context
import { useCommitStore } from '@/store/commit.store'
import { useEvidenceStore } from '@/store/evidence.store'
```

### 5.3 Module Communication

```
┌──────────┐         ┌──────────┐
│   Git    │         │ Evidence │
│ Feature  │         │ Feature  │
└────┬─────┘         └────┬─────┘
     │                     │
     ▼                     ▼
┌────────────┐     ┌────────────┐
│ Git Store  │     │Evidence    │
│            │     │  Store     │
└────────────┘     └────────────┘
     │                     │
     └──────────┬──────────┘
                ▼
         ┌────────────┐
         │  Shared    │
         │  Services  │
         └────────────┘
```

---

## 6. Cross-Cutting Concerns

### 6.1 Shared Services (core/services/)

Services used by multiple features:

```
core/
└── services/
    ├── storage.service.ts       # SQLite operations
    ├── template.service.ts      # Template rendering
    ├── pdf.service.ts            # PDF generation
    ├── ai.service.ts             # AI provider abstraction
    └── notification.service.ts  # Toast notifications
```

### 6.2 Shared Hooks (core/hooks/)

```
core/
└── hooks/
    ├── useAsync.ts               # Generic async handler
    ├── useDebounce.ts            # Debounce utility
    ├── useLocalStorage.ts        # Persistence hook
    └── useErrorBoundary.ts       # Error handling
```

### 6.3 Shared Types (core/types/)

```
core/
└── types/
    ├── index.ts
    ├── common.types.ts           # Shared interfaces
    ├── api.types.ts              # API response types
    └── error.types.ts            # Error types
```

---

## 7. State Management

### 7.1 Store Structure

Use **Zustand** for global state. Each domain has its own store:

```
store/
├── index.ts
├── commit.store.ts               # Git commits state
├── branch.store.ts               # Branches state
├── evidence.store.ts             # Evidence documents
├── screenshot.store.ts           # Screenshots
├── template.store.ts             # Templates
├── settings.store.ts            # App settings
└── ui.store.ts                   # UI state (modals, sidebar)
```

### 7.2 Store Pattern

```typescript
// store/evidence.store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface EvidenceState {
  documents: EvidenceDocument[]
  currentDocument: EvidenceDocument | null
  isLoading: boolean
  error: string | null
}

interface EvidenceActions {
  createDocument: (data: CreateEvidenceDTO) => Promise<void>
  updateDocument: (id: string, data: UpdateEvidenceDTO) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  setCurrentDocument: (doc: EvidenceDocument | null) => void
}

export const useEvidenceStore = create<EvidenceState & EvidenceActions>()(
  immer((set, get) => ({
    documents: [],
    currentDocument: null,
    isLoading: false,
    error: null,

    createDocument: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const doc = await evidenceService.create(data)
        set((state) => {
          state.documents.push(doc)
          state.isLoading = false
        })
      } catch (error) {
        set({ error: error.message, isLoading: false })
      }
    },
    // ... other actions
  }))
)
```

### 7.3 Feature-Specific State

Feature-specific state lives **within the feature**, not in global store:

```typescript
// features/git/hooks/useGitState.ts
// Local state for git feature only
// Only promote to global store when needed by other features
```

---

## 8. Tauri/Rust Backend Guidelines

### 8.1 Command Organization

```
src-tauri/src/
├── lib.rs                         # Command registration
├── commands/
│   ├── mod.rs
│   ├── git/
│   │   ├── mod.rs
│   │   ├── list_branches.rs
│   │   ├── get_commits.rs
│   │   └── get_diff.rs
│   ├── evidence/
│   │   ├── mod.rs
│   │   ├── create.rs
│   │   ├── list.rs
│   │   └── export_pdf.rs
│   └── screenshots/
│       ├── mod.rs
│       ├── capture.rs
│       └── list.rs
```

### 8.2 Command Pattern

```rust
// src-tauri/src/commands/git/get_commits.rs
use crate::models::Commit;
use crate::services::git_service::GitService;
use tauri::command;

#[derive(Serialize)]
pub struct GetCommitsRequest {
    pub repository_path: String,
    pub branch: Option<String>,
    pub limit: Option<u32>,
}

#[derive(Serialize)]
pub struct GetCommitsResponse {
    pub commits: Vec<Commit>,
    pub total: u32,
}

#[command]
pub async fn get_commits(request: GetCommitsRequest) -> Result<GetCommitsResponse, String> {
    GitService::new()
        .list_commits(&request.repository_path, request.branch.as_deref(), request.limit)
        .map_err(|e| e.to_string())
}
```

### 8.3 Model Pattern

```rust
// src-tauri/src/models/commit.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Commit {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub email: String,
    pub date: String,
    pub message: String,
    pub message_short: String,
    pub commit_type: CommitType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CommitType {
    Feat,
    Fix,
    Refactor,
    Docs,
    Chore,
    Perf,
    Test,
    Other,
}
```

---

## 9. Data Flow

### 9.1 Unidirectional Data Flow

```
User Action
    │
    ▼
React Component
    │
    ▼
Feature Hook (useXxx)
    │
    ▼
Store Action (dispatch)
    │
    ▼
Service Layer (calls Tauri command)
    │
    ▼
Tauri Command (Rust)
    │
    ▼
Infrastructure (Git, SQLite, FileSystem)
    │
    ▼
Return Result
    │
    ▼
Store Update
    │
    ▼
Component Re-render
```

### 9.2 API Layer Pattern

```typescript
// features/git/api/git.commands.ts
import { invoke } from '@tauri-apps/api/core'

export async function listBranches(repoPath: string): Promise<Branch[]> {
  return invoke<Branch[]>('commands:git:list_branches', { repoPath })
}

export async function getCommits(
  repoPath: string,
  options?: { branch?: string; limit?: number }
): Promise<CommitResponse> {
  return invoke<CommitResponse>('commands:git:get_commits', {
    repositoryPath: repoPath,
    branch: options?.branch,
    limit: options?.limit,
  })
}

export async function getDiff(
  repoPath: string,
  commitHash: string
): Promise<Diff> {
  return invoke<Diff>('commands:git:get_diff', {
    repositoryPath: repoPath,
    commitHash,
  })
}
```

---

## 10. Error Handling

### 10.1 Error Types

```typescript
// core/types/error.types.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class GitError extends AppError {
  constructor(message: string, code: 'REPO_NOT_FOUND' | 'INVALID_GIT' | 'NO_COMMITS') {
    super(message, code)
    this.name = 'GitError'
  }
}

export class EvidenceError extends AppError {
  constructor(
    message: string,
    code: 'DOC_NOT_FOUND' | 'EXPORT_FAILED' | 'TEMPLATE_INVALID'
  ) {
    super(message, code)
    this.name = 'EvidenceError'
  }
}
```

### 10.2 Error Handling in Hooks

```typescript
// core/hooks/useAsync.ts
export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  options?: { immediate?: boolean }
) {
  const [state, setState] = useState<AsyncState<T, E>>({
    loading: options?.immediate ?? true,
    error: null,
    data: null,
  })

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await asyncFunction()
      setState({ loading: false, error: null, data })
    } catch (error) {
      setState({ loading: false, error: error as E, data: null })
    }
  }, [asyncFunction])

  return { ...state, execute }
}
```

---

## 11. Testing Strategy

### 11.1 Test Structure

```
features/
└── git/
    ├── components/
    ├── hooks/
    ├── services/
    └── __tests__/
        ├── git.service.test.ts
        ├── useGit.test.tsx
        └── RepositorySelector.test.tsx
```

### 11.2 Test Patterns

```typescript
// __tests__/git.service.test.ts
describe('GitService', () => {
  describe('listBranches', () => {
    it('should return empty array for invalid repository', async () => {
      const service = new GitService()
      await expect(service.listBranches('/invalid/path')).rejects.toThrow(
        GitError
      )
    })
  })
})

// __tests__/useGit.test.tsx
describe('useBranches', () => {
  it('should fetch branches on mount', async () => {
    const { result } = renderHook(() => useBranches('/valid/repo'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.branches).toHaveLength(3)
  })
})
```

### 11.3 Test Coverage Goals

| Layer | Target |
|-------|--------|
| Services | 80%+ |
| Hooks | 70%+ |
| Components | 60%+ (user interactions) |

---

## 12. Code Quality

### 12.1 TypeScript Rules

- **NO `any`**: Use `unknown` and type guards
- **Explicit types**: All function parameters and returns
- **Strict mode**: Enable in tsconfig.json
- **Naming conventions**: Follow existing project style

```typescript
// ❌ AVOID
function processData(data: any): any {
  return data.map((item: any) => item.id)
}

// ✅ PREFER
function processData<T extends { id: string }>(data: T[]): string[] {
  return data.map((item) => item.id)
}
```

### 12.2 React Component Rules

- **Small components**: Max 150 lines preferred
- **Extract logic**: Use custom hooks for business logic
- **Props interface**: Always define explicit interface
- **Composition**: Prefer composition over prop drilling

```typescript
// ❌ AVOID
export function ComplexComponent({ data, onAction, filter, sort, ...props }) {
  // 200+ lines
}

// ✅ PREFER
export function ComplexComponent({ data, ...props }: ComplexProps) {
  const { filtered, sorted } = useDataProcessing(data)
  const { handlers } = useDataActions()
  return (
    <div {...props}>
      <DataList data={filtered} />
      <DataControls onSort={handlers.sort} />
    </div>
  )
}
```

---

## 13. Evolution Guidelines

### 13.1 Adding a New Feature

1. Create new slice under `features/`
2. Follow the feature template structure
3. Define public API in `index.ts`
4. Add store slice if needed
5. Add Tauri commands if needed
6. Write tests
7. Update documentation

### 13.2 Modifying Existing Features

1. Changes stay within the feature slice
2. Maintain public API compatibility
3. Update exports if structure changes
4. Update tests
5. Update documentation

### 13.3 Extracting Shared Code

When code is needed by multiple features:

1. Create shared module in `core/`
2. Move code to shared location
3. Update imports in features
4. Ensure backward compatibility
5. Update tests

### 13.4 Module Promotion Rules

| From | To | When |
|------|-----|------|
| Feature local | Feature store | Other features need access |
| Feature service | Core service | Multiple features use it |
| Feature type | Core type | Multiple features use it |
| Feature component | Shared component | UI reuse across features |

### 13.5 Architecture Decision Records (ADR)

Document significant architecture decisions:

```
docs/adr/
├── 001-vertical-slice-architecture.md
├── 002-tauri-for-desktop-runtime.md
├── 003-sqlite-for-local-storage.md
└── 004-choosing-zustand-for-state.md
```

ADR Template:
```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated

## Context
What is the issue?

## Decision
What is the change?

## Consequences
- Positive
- Negative
```

---

## Quick Reference

### Import Priority Order

```typescript
// 1. React & Framework
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. External Libraries
import { invoke } from '@tauri-apps/api/core'
import { cn } from '@/lib/utils'

// 3. Feature (self)
import { useCommits } from '@/features/git/hooks'

// 4. Shared/Core
import { useAsync } from '@/core/hooks'
import { AppError } from '@/core/types'

// 5. UI Components
import { Button } from '@/components/ui/button'
```

### File Naming Conventions

| Type | Convention | Example |
|------|-------------|---------|
| Components | PascalCase | `CommitList.tsx` |
| Hooks | camelCase with `use` | `useCommits.ts` |
| Services | camelCase | `git.service.ts` |
| Types | PascalCase | `commit.model.ts` |
| Stores | `.store.ts` suffix | `commit.store.ts` |
| Commands | `.commands.ts` suffix | `git.commands.ts` |
| Tests | `.test.ts` suffix | `useCommits.test.ts` |

### Layer Access Rules

```
UI Components
    │
    ├── ✅ Can import from: hooks, components, stores
    └── ❌ Cannot import from: other feature components directly

Hooks
    │
    ├── ✅ Can import from: services, types, stores, api
    └── ❌ Cannot import from: other feature hooks directly

Services
    │
    ├── ✅ Can import from: types, other services (core only)
    └── ❌ Cannot import from: components, hooks

Stores
    │
    ├── ✅ Can import from: types
    └── ❌ Cannot import from: components, hooks
```

---

## See Also

- [Clean Code Guidelines](./CLEAN-CODE-GUIDELINES.md)
- [Product Requirements](./prd.md)
