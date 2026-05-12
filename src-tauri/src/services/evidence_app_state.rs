//! Preferências (`evidence_preferences`) e templates (`evidence_templates`) na mesma
//! BD que o índice de documentos (PRD §15 / RF-015).

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use rusqlite::{params, Connection, OptionalExtension};

pub const KEY_EXPORT_DEFAULT_DIRECTORY: &str = "export.default_directory";
pub const KEY_EVIDENCE_ACTIVE_TEMPLATE_ID: &str = "evidence.active_template_id";
pub const KEY_EVIDENCE_CHANGE_ID: &str = "evidence.change_id";
pub const KEY_EVIDENCE_ENVIRONMENT: &str = "evidence.environment";

const KNOWN_KEYS: &[&str] = &[
    KEY_EXPORT_DEFAULT_DIRECTORY,
    KEY_EVIDENCE_ACTIVE_TEMPLATE_ID,
    KEY_EVIDENCE_CHANGE_ID,
    KEY_EVIDENCE_ENVIRONMENT,
];

pub fn is_known_preference_key(key: &str) -> bool {
    KNOWN_KEYS.iter().copied().any(|k| k == key)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EvidencePreferencesSnapshot {
    pub export_default_directory: Option<String>,
    pub evidence_active_template_id: Option<String>,
    pub evidence_change_id: Option<String>,
    pub evidence_environment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EvidenceTemplateRecord {
    pub id: String,
    pub label: String,
    #[serde(rename = "isBuiltin")]
    pub is_builtin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EvidenceAppPersistedSnapshot {
    pub preferences: EvidencePreferencesSnapshot,
    pub templates: Vec<EvidenceTemplateRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEvidenceTemplateResult {
    pub id: String,
    pub label: String,
    #[serde(rename = "isBuiltin")]
    pub is_builtin: bool,
}

/// Extensões de schema aplicadas sempre que se abre a BD (compatível com instalações antigas).
pub fn ensure_app_state_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS evidence_preferences (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS evidence_templates (
            id TEXT PRIMARY KEY NOT NULL,
            label TEXT NOT NULL,
            is_builtin INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0
        );
        INSERT OR IGNORE INTO evidence_templates (id, label, is_builtin, sort_order)
        VALUES ('default', 'Homologação — padrão enterprise', 1, 0);
        CREATE INDEX IF NOT EXISTS idx_templates_sort
            ON evidence_templates (is_builtin, sort_order, label);",
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn pref_get(conn: &Connection, key: &str) -> Result<Option<String>, rusqlite::Error> {
    conn.query_row(
        "SELECT value FROM evidence_preferences WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
    .optional()
}

fn pref_upsert(conn: &Connection, key: &str, value: &str) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO evidence_preferences (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}

pub fn load_snapshot(conn: &Connection) -> Result<EvidenceAppPersistedSnapshot, String> {
    ensure_app_state_tables(conn)?;

    let trim_opt = |v: Option<String>| v.filter(|s| !s.trim().is_empty());

    let preferences = EvidencePreferencesSnapshot {
        export_default_directory: trim_opt(
            pref_get(conn, KEY_EXPORT_DEFAULT_DIRECTORY).map_err(|e| e.to_string())?,
        ),
        evidence_active_template_id: trim_opt(
            pref_get(conn, KEY_EVIDENCE_ACTIVE_TEMPLATE_ID).map_err(|e| e.to_string())?,
        ),
        evidence_change_id: trim_opt(
            pref_get(conn, KEY_EVIDENCE_CHANGE_ID).map_err(|e| e.to_string())?,
        ),
        evidence_environment: trim_opt(
            pref_get(conn, KEY_EVIDENCE_ENVIRONMENT).map_err(|e| e.to_string())?,
        ),
    };

    let mut stmt = conn
        .prepare(
            "SELECT id, label, is_builtin FROM evidence_templates
             ORDER BY is_builtin DESC, sort_order ASC, label ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(EvidenceTemplateRecord {
                id: row.get(0)?,
                label: row.get(1)?,
                is_builtin: row.get::<_, i64>(2)? != 0,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut templates = Vec::new();
    for r in rows {
        templates.push(r.map_err(|e| e.to_string())?);
    }

    Ok(EvidenceAppPersistedSnapshot {
        preferences,
        templates,
    })
}

pub fn set_preference(conn: &Connection, key: String, value: String) -> Result<(), String> {
    ensure_app_state_tables(conn)?;
    if !is_known_preference_key(&key) {
        return Err(format!("Chave de preferência desconhecida: {}", key));
    }
    if value.is_empty() {
        conn.execute(
            "DELETE FROM evidence_preferences WHERE key = ?1",
            params![key],
        )
        .map_err(|e| e.to_string())?;
        return Ok(());
    }
    pref_upsert(conn, &key, &value).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn create_custom_template(conn: &Connection, label_raw: String) -> Result<CreateEvidenceTemplateResult, String> {
    ensure_app_state_tables(conn)?;
    let label = label_raw.trim().to_string();
    if label.is_empty() {
        return Err("Nome do template não pode ser vazio.".to_string());
    }
    if label.len() > 200 {
        return Err("Nome do template demasiado longo (max. 200).".to_string());
    }

    let next_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM evidence_templates",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO evidence_templates (id, label, is_builtin, sort_order)
         VALUES (?1, ?2, 0, ?3)",
        params![id, label, next_order],
    )
    .map_err(|e| e.to_string())?;

    Ok(CreateEvidenceTemplateResult {
        id,
        label,
        is_builtin: false,
    })
}

pub fn delete_custom_template(conn: &Connection, id: &str) -> Result<(), String> {
    ensure_app_state_tables(conn)?;
    Uuid::parse_str(id).map_err(|_| "Apenas templates personalizados (UUID) podem ser eliminados.".to_string())?;

    let is_builtin: i64 = conn
        .query_row(
            "SELECT is_builtin FROM evidence_templates WHERE id = ?1",
            params![id],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|_| "Template não encontrado.".to_string())?;

    if is_builtin != 0 {
        return Err("Templates integrados não podem ser eliminados.".to_string());
    }

    let n = conn
        .execute(
            "DELETE FROM evidence_templates WHERE id = ?1 AND is_builtin = 0",
            params![id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Template não encontrado.".to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use tempfile::tempdir;

    use super::*;

    fn open_schema() -> (tempfile::TempDir, Connection) {
        let tmp = tempdir().unwrap();
        let db_path = tmp.path().join("ev.sqlite");
        let conn = Connection::open(&db_path).expect("sqlite");
        conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")
            .unwrap();
        ensure_app_state_tables(&conn).unwrap();
        (tmp, conn)
    }

    #[test]
    fn seed_default_template_exists() {
        let (_tmp, conn) = open_schema();
        let s = load_snapshot(&conn).unwrap();
        assert!(s.templates.iter().any(|t| t.id == "default" && t.is_builtin));
    }

    #[test]
    fn create_list_delete_custom_roundtrip() {
        let (_tmp, conn) = open_schema();
        let created = create_custom_template(&conn, "  QA release  ".into()).unwrap();
        assert_ne!(created.id, "default");
        let list = load_snapshot(&conn).unwrap();
        assert!(list.templates.iter().any(|t| t.id == created.id));

        delete_custom_template(&conn, &created.id).unwrap();
        let list2 = load_snapshot(&conn).unwrap();
        assert!(!list2.templates.iter().any(|t| t.id == created.id));
    }

    #[test]
    fn preferences_roundtrip_known_keys_only() {
        let (_tmp, conn) = open_schema();
        set_preference(&conn, KEY_EVIDENCE_CHANGE_ID.into(), "CHG-1".into()).unwrap();
        let s = load_snapshot(&conn).unwrap();
        assert_eq!(s.preferences.evidence_change_id, Some("CHG-1".into()));

        set_preference(&conn, KEY_EVIDENCE_CHANGE_ID.into(), "".into()).unwrap();
        let s2 = load_snapshot(&conn).unwrap();
        assert_eq!(s2.preferences.evidence_change_id, None);

        let err = set_preference(&conn, "unknown".into(), "x".into()).unwrap_err();
        assert!(err.contains("desconhecida"));
    }
}
