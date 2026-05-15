import { create } from "zustand";

import * as api from "../api/git.commands";
import { parseGitCommandError } from "../api/parse-git-error";
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
  /** Branches incluídas no documento (escopo multi-branch). */
  selectedBranches: string[];

  refreshRecentRepos: () => Promise<void>;
  selectRepository: (path: string, opts?: SelectOptions) => Promise<void>;
  setBranchFilter: (value: string) => void;
  setSelectedBranches: (names: string[]) => void;
  toggleBranch: (name: string) => void;
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
  selectedBranches: [],

  refreshRecentRepos: async () => {
    const list = await api.recentRepositoriesList();
    set({ recentRepos: list });
  },

  setBranchFilter: (branchFilter) => set({ branchFilter }),

  setSelectedBranches: (selectedBranches) => set({ selectedBranches }),

  toggleBranch: (name) => {
    const { selectedBranches } = get();
    if (selectedBranches.includes(name)) {
      set({
        selectedBranches: selectedBranches.filter((n) => n !== name),
      });
    } else {
      set({ selectedBranches: [...selectedBranches, name] });
    }
  },

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

      set({
        repositoryPath: nextPath,
        branches: listed.branches,
        headDisplay: listed.headDisplay,
        detached: listed.detached,
        selectedBranches: headName ? [headName] : [],
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
