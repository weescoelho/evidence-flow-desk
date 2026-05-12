import { create } from "zustand";

import * as api from "../api/git.commands";
import { parseGitCommandError } from "../api/parse-git-error";
import { filterBranchNames } from "../lib/branch-filter";
import type { GitBranchRow } from "../types/git";

type SelectOptions = {
  fromRecent?: boolean;
};

type GitStore = {
  repositoryPath: string | null;
  validationError: string | null;
  errorCode: string | null;
  branches: GitBranchRow[];
  headDisplay: string;
  detached: boolean;
  recentRepos: string[];
  branchFilter: string;
  /** Ref Git resolvível (branch, tag, SHA, etc.) — ver RF-003. */
  baseBranch: string | null;
  /** Ref Git resolvível (branch, tag, SHA, etc.) — ver RF-003. */
  compareBranch: string | null;

  filteredBranchNames: () => string[];

  refreshRecentRepos: () => Promise<void>;
  selectRepository: (path: string, opts?: SelectOptions) => Promise<void>;
  setBranchFilter: (value: string) => void;
  setBaseBranch: (name: string | null) => void;
  setCompareBranch: (name: string | null) => void;
};

export const useGitStore = create<GitStore>((set, get) => ({
  repositoryPath: null,
  validationError: null,
  errorCode: null,
  branches: [],
  headDisplay: "",
  detached: false,
  recentRepos: [],
  branchFilter: "",
  baseBranch: null,
  compareBranch: null,

  filteredBranchNames: () => {
    const { branches, branchFilter } = get();
    const names = branches.map((b) => b.name);
    return filterBranchNames(names, branchFilter);
  },

  refreshRecentRepos: async () => {
    const list = await api.recentRepositoriesList();
    set({ recentRepos: list });
  },

  setBranchFilter: (branchFilter) => set({ branchFilter }),

  setBaseBranch: (baseBranch) => set({ baseBranch }),

  setCompareBranch: (compareBranch) => set({ compareBranch }),

  selectRepository: async (path: string, opts?: SelectOptions) => {
    set({
      validationError: null,
      errorCode: null,
    });

    try {
      const validated = await api.validateGitRepository(path);
      const nextPath = validated.canonicalPath;

      const listed = await api.listBranches(nextPath);
      const headName =
        listed.branches.find((b) => b.isHead)?.name ?? null;
      const compareCandidate =
        listed.branches.find((b) => b.name !== headName)?.name ??
        listed.branches[0]?.name ??
        null;

      set({
        repositoryPath: nextPath,
        branches: listed.branches,
        headDisplay: listed.headDisplay,
        detached: listed.detached,
        baseBranch: headName,
        compareBranch: compareCandidate,
      });

      await api.recentRepositoriesAdd(nextPath);
      await get().refreshRecentRepos();
    } catch (e) {
      const ge = parseGitCommandError(e);
      if (ge) {
        set({ validationError: ge.message, errorCode: ge.code });
        if (
          opts?.fromRecent &&
          (ge.code === "not_a_git_repository" || ge.code === "io_error")
        ) {
          try {
            await api.recentRepositoriesRemove(path);
            await get().refreshRecentRepos();
          } catch {
            /* MRU já vazio ou caminho inválido — ignorar */
          }
        }
      } else {
        set({
          validationError:
            e instanceof Error ? e.message : "Erro desconhecido ao abrir Git.",
          errorCode: "unknown",
        });
      }
      set({
        repositoryPath: null,
        branches: [],
        headDisplay: "",
        detached: false,
      });
    }
  },
}));
