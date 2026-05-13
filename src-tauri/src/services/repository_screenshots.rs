//! Capturas de evidência por repositório — mesma BD SQLite que `evidence_documents`.

use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

/// Alinhado a `MAX_SCREENSHOT_FILE_BYTES` / `MAX_EVIDENCE_SCREENSHOTS` no frontend.
const MAX_IMAGE_BYTES: usize = 5 * 1024 * 1024;
const MAX_SCREENSHOTS_PER_REPO: usize = 12;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryEvidenceScreenshotInput {
    pub id: String,
    pub file_name: String,
    pub data_url: String,
    pub caption: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryEvidenceScreenshotRow {
    pub id: String,
    pub file_name: String,
    pub data_url: String,
    pub caption: String,
}

fn migrate_drop_linked_commit_hash_if_present(conn: &Connection) -> Result<(), String> {
    let n: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('repository_evidence_screenshots') WHERE name = 'linked_commit_hash'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);
    if n > 0 {
        conn.execute(
            "ALTER TABLE repository_evidence_screenshots DROP COLUMN linked_commit_hash",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn ensure_repository_screenshots_table(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS repository_evidence_screenshots (
            id TEXT PRIMARY KEY NOT NULL,
            repository_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            image_blob BLOB NOT NULL,
            caption TEXT NOT NULL DEFAULT '',
            sort_index INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_repo_evidence_shots_path
            ON repository_evidence_screenshots (repository_path, sort_index ASC);",
    )
    .map_err(|e| e.to_string())?;
    migrate_drop_linked_commit_hash_if_present(conn)?;
    Ok(())
}

fn parse_image_data_url(data_url: &str) -> Result<(String, Vec<u8>), String> {
    let rest = data_url
        .strip_prefix("data:")
        .ok_or_else(|| "URL de imagem inválida.".to_string())?;
    let (meta, payload) = rest
        .split_once(',')
        .ok_or_else(|| "URL de imagem inválida.".to_string())?;
    if !meta.contains(";base64") {
        return Err("Apenas imagens em base64 (data URL) são suportadas.".to_string());
    }
    let mime = meta
        .split(';')
        .next()
        .unwrap_or("")
        .trim()
        .to_string();
    if !mime.starts_with("image/") {
        return Err("Tipo de imagem inválido.".to_string());
    }
    let bytes = B64
        .decode(payload.trim().as_bytes())
        .map_err(|_| "Decodificação base64 falhou.".to_string())?;
    if bytes.len() > MAX_IMAGE_BYTES {
        return Err(format!(
            "Imagem excede o limite de {} MB.",
            MAX_IMAGE_BYTES / (1024 * 1024)
        ));
    }
    Ok((mime, bytes))
}

fn row_to_data_url(mime: &str, blob: &[u8]) -> String {
    let enc = B64.encode(blob);
    format!("data:{};base64,{}", mime, enc)
}

pub fn list_repository_screenshots(
    conn: &Connection,
    repository_path: &str,
) -> Result<Vec<RepositoryEvidenceScreenshotRow>, String> {
    ensure_repository_screenshots_table(conn)?;
    let path = repository_path.trim();
    if path.is_empty() {
        return Err("Caminho do repositório vazio.".to_string());
    }

    let mut stmt = conn
        .prepare(
            "SELECT id, file_name, mime_type, image_blob, COALESCE(caption,'')
             FROM repository_evidence_screenshots
             WHERE repository_path = ?1
             ORDER BY sort_index ASC, id ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![path], |row| {
            let id: String = row.get(0)?;
            let file_name: String = row.get(1)?;
            let mime: String = row.get(2)?;
            let blob: Vec<u8> = row.get(3)?;
            let caption: String = row.get(4)?;
            Ok(RepositoryEvidenceScreenshotRow {
                id,
                file_name,
                data_url: row_to_data_url(&mime, &blob),
                caption,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn sync_repository_screenshots(
    conn: &mut Connection,
    repository_path: &str,
    items: Vec<RepositoryEvidenceScreenshotInput>,
) -> Result<(), String> {
    ensure_repository_screenshots_table(conn)?;
    let path = repository_path.trim();
    if path.is_empty() {
        return Err("Caminho do repositório vazio.".to_string());
    }
    if items.len() > MAX_SCREENSHOTS_PER_REPO {
        return Err(format!(
            "No máximo {} imagens por repositório.",
            MAX_SCREENSHOTS_PER_REPO
        ));
    }

    for item in &items {
        if item.file_name.len() > 500 {
            return Err("Nome de ficheiro demasiado longo.".to_string());
        }
        if item.id.len() > 80 || item.id.is_empty() {
            return Err("Identificador de captura inválido.".to_string());
        }
    }

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "DELETE FROM repository_evidence_screenshots WHERE repository_path = ?1",
        params![path],
    )
    .map_err(|e| e.to_string())?;

    for (sort_index, item) in items.iter().enumerate() {
        let (mime, blob) = parse_image_data_url(&item.data_url)?;
        tx.execute(
            "INSERT INTO repository_evidence_screenshots
             (id, repository_path, file_name, mime_type, image_blob, caption, sort_index)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                &item.id,
                path,
                &item.file_name,
                mime,
                blob,
                item.caption,
                sort_index as i64,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use tempfile::tempdir;

    #[test]
    fn round_trip_data_url() {
        let png_1px = vec![
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
            0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00,
            0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78,
            0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
        ];
        let url = row_to_data_url("image/png", &png_1px);
        let (mime, back) = parse_image_data_url(&url).unwrap();
        assert_eq!(mime, "image/png");
        assert_eq!(back, png_1px);
    }

    #[test]
    fn sync_and_list_repository() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("t.sqlite");
        let mut conn = Connection::open(&db_path).unwrap();
        ensure_repository_screenshots_table(&conn).unwrap();

        let repo = "/tmp/test-repo";
        let tiny_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        let data_url = format!("data:image/png;base64,{}", tiny_png);

        sync_repository_screenshots(
            &mut conn,
            repo,
            vec![RepositoryEvidenceScreenshotInput {
                id: "id-1".to_string(),
                file_name: "x.png".to_string(),
                data_url,
                caption: "c".to_string(),
            }],
        )
        .unwrap();

        let list = list_repository_screenshots(&conn, repo).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].file_name, "x.png");
        assert_eq!(list[0].caption, "c");
        assert!(list[0].data_url.starts_with("data:image/png;base64,"));
    }

    #[test]
    fn drops_legacy_linked_commit_column() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("legacy.sqlite");
        let conn = Connection::open(&db_path).unwrap();
        conn.execute_batch(
            "CREATE TABLE repository_evidence_screenshots (
                id TEXT PRIMARY KEY NOT NULL,
                repository_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                image_blob BLOB NOT NULL,
                caption TEXT NOT NULL DEFAULT '',
                linked_commit_hash TEXT,
                sort_index INTEGER NOT NULL
            );",
        )
        .unwrap();
        drop(conn);

        let conn = Connection::open(&db_path).unwrap();
        ensure_repository_screenshots_table(&conn).unwrap();
        let n: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('repository_evidence_screenshots') WHERE name = 'linked_commit_hash'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(n, 0);
    }
}
