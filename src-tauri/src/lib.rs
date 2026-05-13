mod commands;
mod models;
mod services;

use commands::evidence::{
    create_evidence_custom_template, delete_evidence_custom_template,
    delete_saved_evidence_document, list_repository_evidence_screenshots,
    list_saved_evidence_documents, load_evidence_app_persisted_state, save_evidence_document,
    set_evidence_preference, set_evidence_template_header_images, set_evidence_template_layout,
    sync_repository_evidence_screenshots,
};
use commands::llm::{llm_generate_corporate_summary, llm_rewrite_technical_summary};
use commands::git::{
    get_repository_scope_summary, list_branches, recent_repositories_add,
    recent_repositories_list, recent_repositories_remove, validate_git_repository,
};
use commands::io::write_text_file;

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
            save_evidence_document,
            list_saved_evidence_documents,
            delete_saved_evidence_document,
            load_evidence_app_persisted_state,
            set_evidence_preference,
            create_evidence_custom_template,
            set_evidence_template_layout,
            set_evidence_template_header_images,
            delete_evidence_custom_template,
            list_repository_evidence_screenshots,
            sync_repository_evidence_screenshots,
            llm_generate_corporate_summary,
            llm_rewrite_technical_summary,
            write_text_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
