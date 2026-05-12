use std::path::PathBuf;

use crate::services::file_export;

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> {
    file_export::write_utf8_file(PathBuf::from(path).as_path(), &contents)
}
