use tauri::AppHandle;

use crate::models::git::{
    ListBranchesResponse, MultiBranchScopeSummary, ValidateGitRepositoryResponse,
};
use crate::models::GitCommandError;
use crate::services::{git_history, git_repository, recent_repos};

#[tauri::command]
pub fn get_multi_branch_scope_summary(
    path: String,
    branch_refs: Vec<String>,
) -> Result<MultiBranchScopeSummary, GitCommandError> {
    git_history::multi_branch_scope_summary(&path, branch_refs)
}

#[tauri::command]
pub fn validate_git_repository(
    path: String,
) -> Result<ValidateGitRepositoryResponse, GitCommandError> {
    git_repository::validate_repository(&path)
}

#[tauri::command]
pub fn list_branches(path: String) -> Result<ListBranchesResponse, GitCommandError> {
    git_repository::list_branches(&path)
}

#[tauri::command]
pub fn recent_repositories_list(app: AppHandle) -> Result<Vec<String>, String> {
    recent_repos::list(&app)
}

#[tauri::command]
pub fn recent_repositories_add(app: AppHandle, path: String) -> Result<(), String> {
    recent_repos::add(&app, path)
}

#[tauri::command]
pub fn recent_repositories_remove(app: AppHandle, path: String) -> Result<(), String> {
    recent_repos::remove(&app, path)
}
