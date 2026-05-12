use tauri::AppHandle;

use crate::services::evidence_app_state::{
    self, CreateEvidenceTemplateResult, EvidenceAppPersistedSnapshot,
};
use crate::services::evidence_documents::{
    delete_document, list_documents, save_document, EvidenceDocumentsStore,
    SaveEvidenceDocumentResult, SavedEvidenceDocumentInfo,
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

#[tauri::command]
pub fn delete_saved_evidence_document(app: AppHandle, id: String) -> Result<(), String> {
    delete_document(&app, id)
}

#[tauri::command]
pub fn load_evidence_app_persisted_state(
    app: AppHandle,
) -> Result<EvidenceAppPersistedSnapshot, String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    evidence_app_state::load_snapshot(&conn)
}

#[tauri::command]
pub fn set_evidence_preference(app: AppHandle, key: String, value: String) -> Result<(), String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    evidence_app_state::set_preference(&conn, key, value)
}

#[tauri::command]
pub fn create_evidence_custom_template(
    app: AppHandle,
    label: String,
) -> Result<CreateEvidenceTemplateResult, String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    evidence_app_state::create_custom_template(&conn, label)
}

#[tauri::command]
pub fn delete_evidence_custom_template(app: AppHandle, id: String) -> Result<(), String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    evidence_app_state::delete_custom_template(&conn, &id)
}
