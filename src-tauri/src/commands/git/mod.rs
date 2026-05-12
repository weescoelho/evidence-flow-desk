use tauri::AppHandle;

use crate::models::git::{
    ListBranchesResponse, RepositoryScopeSummary, ValidateGitRepositoryResponse,
};
use crate::models::GitCommandError;
use crate::services::{git_history, git_repository, recent_repos};

#[tauri::command]
pub fn get_repository_scope_summary(
    path: String,
    base_ref: String,
    compare_ref: String,
) -> Result<RepositoryScopeSummary, GitCommandError> {
    git_history::repository_scope_summary(&path, &base_ref, &compare_ref)
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
