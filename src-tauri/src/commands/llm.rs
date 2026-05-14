use tauri::AppHandle;

use crate::services::evidence_app_state::{self as app_state, KEY_AI_GEMINI_API_BASE, KEY_AI_GEMINI_API_KEY, KEY_AI_GEMINI_MODEL};
use crate::services::evidence_documents::EvidenceDocumentsStore;
use crate::services::llm_gemini::{
    generate_content, system_prompt_corporate, system_prompt_technical_rewrite,
    DEFAULT_GEMINI_API_BASE, DEFAULT_GEMINI_MODEL,
};
use rusqlite::Connection;

fn read_gemini_prefs(conn: &Connection) -> Result<(String, String, String), String> {
    app_state::ensure_app_state_tables(conn)?;
    let base = app_state::get_preference_or(conn, KEY_AI_GEMINI_API_BASE)
        .unwrap_or_else(|| DEFAULT_GEMINI_API_BASE.to_string());
    let model = app_state::get_preference_or(conn, KEY_AI_GEMINI_MODEL)
        .unwrap_or_else(|| DEFAULT_GEMINI_MODEL.to_string());
    let key = app_state::get_preference_or(conn, KEY_AI_GEMINI_API_KEY).unwrap_or_default();
    Ok((base, model, key))
}

/// RF-007 — resumo corporativo via Google Gemini; envio só neste comando (RNF-002).
///
/// Comando assíncrono: o IPC não bloqueia o loop de UI; o pedido HTTP com
/// `reqwest::blocking` corre só em [`tauri::async_runtime::spawn_blocking`]
/// (uso dentro de um worker Tokio normal provoca panic ao libertar o runtime).
#[tauri::command]
pub async fn llm_generate_corporate_summary(
    app: AppHandle,
    technical_summary: String,
    tone: String,
) -> Result<String, String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let (base, model, key) = {
        let conn = store.conn()?;
        read_gemini_prefs(&conn)?
    };
    let system = system_prompt_corporate(&tone);
    let user_text = format!("Contexto técnico a converter:\n\n{}", technical_summary);
    let inner = tauri::async_runtime::spawn_blocking(move || {
        generate_content(&base, &key, &model, &system, &user_text)
    })
    .await
    .map_err(|e| e.to_string())?;
    inner
}

/// Reescreve o resumo técnico com Gemini (RF-017 subset).
#[tauri::command]
pub async fn llm_rewrite_technical_summary(
    app: AppHandle,
    technical_summary: String,
    tone: String,
) -> Result<String, String> {
    let store = EvidenceDocumentsStore::for_app(&app)?;
    let (base, model, key) = {
        let conn = store.conn()?;
        read_gemini_prefs(&conn)?
    };
    let system = system_prompt_technical_rewrite(&tone);
    let user_text = format!("Texto actual:\n\n{}", technical_summary);
    let inner = tauri::async_runtime::spawn_blocking(move || {
        generate_content(&base, &key, &model, &system, &user_text)
    })
    .await
    .map_err(|e| e.to_string())?;
    inner
}
