mod commands;
mod models;
mod services;

use commands::git::{
    get_repository_scope_summary, list_branches, recent_repositories_add,
    recent_repositories_list, recent_repositories_remove, validate_git_repository,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            validate_git_repository,
            list_branches,
            get_repository_scope_summary,
            recent_repositories_list,
            recent_repositories_add,
            recent_repositories_remove,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
