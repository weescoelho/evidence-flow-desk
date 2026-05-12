import { invoke } from "@tauri-apps/api/core";

import type {
  ListBranchesResponse,
  RepositoryScopeSummary,
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

export function getRepositoryScopeSummary(
  path: string,
  baseRef: string,
  compareRef: string,
) {
  return invoke<RepositoryScopeSummary>("get_repository_scope_summary", {
    path,
    baseRef,
    compareRef,
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
