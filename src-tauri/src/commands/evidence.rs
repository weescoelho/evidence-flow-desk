use tauri::AppHandle;

use crate::services::evidence_documents::{
    list_documents, save_document, SaveEvidenceDocumentResult, SavedEvidenceDocumentInfo,
};

#[tauri::command]
pub fn save_evidence_document(
    app: AppHandle,
    html: String,
    repository_path: String,
    base_ref: String,
    compare_ref: String,
) -> Result<SaveEvidenceDocumentResult, String> {
    save_document(
        &app,
        html,
        repository_path,
        base_ref,
        compare_ref,
    )
}

#[tauri::command]
pub fn list_saved_evidence_documents(
    app: AppHandle,
) -> Result<Vec<SavedEvidenceDocumentInfo>, String> {
    list_documents(&app)
}
