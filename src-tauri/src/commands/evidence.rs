use tauri::AppHandle;

use crate::services::evidence_app_state::{
    self, CreateEvidenceTemplateResult, EvidenceAppPersistedSnapshot,
};
use crate::services::evidence_documents::{
    delete_document, list_documents, load_document_draft, save_document, EvidenceDocumentsStore,
    LoadEvidenceDocumentDraftResult, SaveEvidenceDocumentResult, SavedEvidenceDocumentInfo,
};
use crate::services::repository_screenshots::{
    self, RepositoryEvidenceScreenshotInput, RepositoryEvidenceScreenshotRow,
};

#[tauri::command]
pub fn save_evidence_document(
    app: AppHandle,
    html: String,
    repository_path: String,
    base_ref: String,
    compare_ref: String,
    template_label: Option<String>,
    change_id: Option<String>,
    environment: Option<String>,
    document_title: Option<String>,
    draft_json: Option<String>,
) -> Result<SaveEvidenceDocumentResult, String> {
    save_document(
        &app,
        html,
        repository_path,
        base_ref,
        compare_ref,
        template_label,
        change_id,
        environment,
        document_title,
        draft_json,
    )
}

#[tauri::command]
pub fn load_evidence_document_draft(
    app: AppHandle,
    id: String,
) -> Result<LoadEvidenceDocumentDraftResult, String> {
    load_document_draft(&app, id)
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
    layout_key: Option<String>,
) -> Result<CreateEvidenceTemplateResult, String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    evidence_app_state::create_custom_template(&conn, label, layout_key)
}

#[tauri::command]
pub fn set_evidence_template_layout(
    app: AppHandle,
    template_id: String,
    layout_key: String,
) -> Result<(), String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    evidence_app_state::set_template_layout(&conn, template_id, layout_key)
}

#[tauri::command]
pub fn set_evidence_template_header_images(
    app: AppHandle,
    template_id: String,
    header_image_left: String,
    header_image_right: String,
) -> Result<(), String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    evidence_app_state::set_template_header_images(
        &conn,
        template_id,
        header_image_left,
        header_image_right,
    )
}

#[tauri::command]
pub fn delete_evidence_custom_template(app: AppHandle, id: String) -> Result<(), String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    evidence_app_state::delete_custom_template(&conn, &id)
}

#[tauri::command]
pub fn list_repository_evidence_screenshots(
    app: AppHandle,
    repository_path: String,
) -> Result<Vec<RepositoryEvidenceScreenshotRow>, String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let conn = store.conn()?;
    repository_screenshots::list_repository_screenshots(&conn, &repository_path)
}

#[tauri::command]
pub fn sync_repository_evidence_screenshots(
    app: AppHandle,
    repository_path: String,
    screenshots: Vec<RepositoryEvidenceScreenshotInput>,
) -> Result<(), String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let mut conn = store.conn()?;
    repository_screenshots::sync_repository_screenshots(&mut conn, &repository_path, screenshots)
}
