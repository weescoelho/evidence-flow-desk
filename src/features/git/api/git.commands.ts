import { invoke } from "@tauri-apps/api/core";

import type {
  ListBranchesResponse,
  MultiBranchScopeSummary,
  ValidateGitRepositoryResponse,
} from "../types/git";

export function validateGitRepository(path: string) {
  return invoke<ValidateGitRepositoryResponse>("validate_git_repository", {
    path,
  });
}

export function listBranches(path: string) {
  return invoke<ListBranchesResponse>("list_branches", { path });
}

export function getMultiBranchScopeSummary(
  path: string,
  branchRefs: string[],
) {
  return invoke<MultiBranchScopeSummary>("get_multi_branch_scope_summary", {
    path,
    branchRefs,
  });
}

export function recentRepositoriesList() {
  return invoke<string[]>("recent_repositories_list");
}

export function recentRepositoriesAdd(path: string) {
  return invoke<void>("recent_repositories_add", { path });
}

export function recentRepositoriesRemove(path: string) {
  return invoke<void>("recent_repositories_remove", { path });
}
