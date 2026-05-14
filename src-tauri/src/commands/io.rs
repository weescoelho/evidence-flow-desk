use std::path::PathBuf;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64_STANDARD;

use crate::services::file_export;

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> {
    file_export::write_utf8_file(PathBuf::from(path).as_path(), &contents)
}

/** Grava ficheiro binário (ex.: PDF) a partir de base64 para evitar JSON enorme com `Vec<u8>`. */
#[tauri::command]
pub fn write_binary_file_base64(path: String, contents_b64: String) -> Result<(), String> {
    let bytes = B64_STANDARD
        .decode(contents_b64.trim())
        .map_err(|e| e.to_string())?;
    file_export::write_bytes_file(PathBuf::from(path).as_path(), &bytes)
}
