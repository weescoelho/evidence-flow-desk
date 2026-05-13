//! Preferências (`evidence_preferences`) e templates (`evidence_templates`) na mesma
//! BD que o índice de documentos (PRD §15 / RF-015).

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use rusqlite::{params, Connection, OptionalExtension};
use std::collections::HashSet;

pub const KEY_EXPORT_DEFAULT_DIRECTORY: &str = "export.default_directory";
pub const KEY_EVIDENCE_ACTIVE_TEMPLATE_ID: &str = "evidence.active_template_id";
pub const KEY_EVIDENCE_CHANGE_ID: &str = "evidence.change_id";
pub const KEY_EVIDENCE_ENVIRONMENT: &str = "evidence.environment";
pub const KEY_EVIDENCE_PRODUCT_NAME: &str = "evidence.product_name";
pub const KEY_EVIDENCE_RELEASE_VERSION: &str = "evidence.release_version";
pub const KEY_EVIDENCE_DEPLOYMENT_DATE: &str = "evidence.deployment_date";
pub const KEY_EVIDENCE_TECHNICAL_OWNER: &str = "evidence.technical_owner";
pub const KEY_EVIDENCE_APPROVER: &str = "evidence.approver";
pub const KEY_EVIDENCE_OUT_OF_SCOPE: &str = "evidence.out_of_scope";
pub const KEY_EVIDENCE_DOCUMENT_VERSION: &str = "evidence.document_version";
pub const KEY_EVIDENCE_DOCUMENT_REVISION_DATE: &str = "evidence.document_revision_date";
pub const KEY_EVIDENCE_DOCUMENT_REVISION_SUMMARY: &str = "evidence.document_revision_summary";
pub const KEY_EVIDENCE_DOCUMENT_REVISION_AUTHOR: &str = "evidence.document_revision_author";
pub const KEY_EVIDENCE_DOCUMENT_REVISION_HISTORY: &str = "evidence.document_revision_history";
pub const KEY_AI_GEMINI_API_KEY: &str = "ai.gemini.api_key";
pub const KEY_AI_GEMINI_MODEL: &str = "ai.gemini.model";
pub const KEY_AI_GEMINI_API_BASE: &str = "ai.gemini.api_base";

const KNOWN_KEYS: &[&str] = &[
    KEY_EXPORT_DEFAULT_DIRECTORY,
    KEY_EVIDENCE_ACTIVE_TEMPLATE_ID,
    KEY_EVIDENCE_CHANGE_ID,
    KEY_EVIDENCE_ENVIRONMENT,
    KEY_EVIDENCE_PRODUCT_NAME,
    KEY_EVIDENCE_RELEASE_VERSION,
    KEY_EVIDENCE_DEPLOYMENT_DATE,
    KEY_EVIDENCE_TECHNICAL_OWNER,
    KEY_EVIDENCE_APPROVER,
    KEY_EVIDENCE_OUT_OF_SCOPE,
    KEY_EVIDENCE_DOCUMENT_VERSION,
    KEY_EVIDENCE_DOCUMENT_REVISION_DATE,
    KEY_EVIDENCE_DOCUMENT_REVISION_SUMMARY,
    KEY_EVIDENCE_DOCUMENT_REVISION_AUTHOR,
    KEY_EVIDENCE_DOCUMENT_REVISION_HISTORY,
    KEY_AI_GEMINI_API_KEY,
    KEY_AI_GEMINI_MODEL,
    KEY_AI_GEMINI_API_BASE,
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
    pub evidence_product_name: Option<String>,
    pub evidence_release_version: Option<String>,
    pub evidence_deployment_date: Option<String>,
    pub evidence_technical_owner: Option<String>,
    pub evidence_approver: Option<String>,
    pub evidence_out_of_scope: Option<String>,
    pub evidence_document_version: Option<String>,
    pub evidence_document_revision_date: Option<String>,
    pub evidence_document_revision_summary: Option<String>,
    pub evidence_document_revision_author: Option<String>,
    pub evidence_document_revision_history: Option<String>,
    pub ai_gemini_api_base: Option<String>,
    pub ai_gemini_model: Option<String>,
    pub ai_gemini_api_key_configured: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EvidenceTemplateRecord {
    pub id: String,
    pub label: String,
    #[serde(rename = "isBuiltin")]
    pub is_builtin: bool,
    #[serde(rename = "layoutKey")]
    pub layout_key: String,
    /// Data URL `data:image/...;base64,...` para faixa no topo do PDF/HTML.
    pub header_image_left: Option<String>,
    pub header_image_right: Option<String>,
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
    #[serde(rename = "layoutKey")]
    pub layout_key: String,
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
    ensure_templates_layout_key_column(conn)?;
    ensure_template_header_image_columns(conn)?;
    migrate_default_template_to_market_standard(conn)?;
    Ok(())
}

fn migrate_default_template_to_market_standard(conn: &Connection) -> Result<(), String> {
    let n = conn
        .execute(
            "UPDATE evidence_templates SET layout_key = 'market_standard'
             WHERE id = 'default' AND layout_key = 'enterprise'",
            [],
        )
        .map_err(|e| e.to_string())?;
    if n > 0 {
        conn.execute(
            "UPDATE evidence_templates SET label = ?1
             WHERE id = 'default' AND label = 'Homologação — padrão enterprise'",
            params!["Homologação — padrão mercado (IEEE / ITIL)"],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn normalize_layout_key(raw: Option<String>) -> String {
    let s = raw
        .as_deref()
        .unwrap_or("enterprise")
        .trim()
        .to_ascii_lowercase();
    let allowed = ["enterprise", "minimal", "audit", "market_standard"];
    if allowed.contains(&s.as_str()) {
        s
    } else {
        "enterprise".to_string()
    }
}

const MAX_HEADER_IMAGE_DATA_URL_CHARS: usize = 4_500_000;

fn ensure_template_header_image_columns(conn: &Connection) -> Result<(), String> {
    let mut stmt = conn
        .prepare("PRAGMA table_info(evidence_templates)")
        .map_err(|e| e.to_string())?;
    let cols: HashSet<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .collect::<Result<_, _>>()
        .map_err(|e| e.to_string())?;

    if cols.contains("header_image_left") {
        return Ok(());
    }

    conn.execute_batch(
        "ALTER TABLE evidence_templates ADD COLUMN header_image_left TEXT;
         ALTER TABLE evidence_templates ADD COLUMN header_image_right TEXT;",
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn validate_header_image_data_url(raw: &str) -> Result<(), String> {
    let t = raw.trim();
    if t.is_empty() {
        return Ok(());
    }
    if t.len() > MAX_HEADER_IMAGE_DATA_URL_CHARS {
        return Err(
            "Imagem demasiado grande (máx. ~4,5 MB codificados em Base64).".to_string(),
        );
    }
    let lower = t.to_ascii_lowercase();
    if !lower.starts_with("data:image/") {
        return Err("A imagem deve ser uma data URL (data:image/…;base64,…).".to_string());
    }
    if !lower.contains(";base64,") {
        return Err(
            "Formato data URL inválido (é necessário encoding base64).".to_string(),
        );
    }
    // SVG pode carregar scripts; não usar no mesmo pipeline de raster.
    if lower.contains("image/svg") {
        return Err("SVG não é suportado; use PNG ou JPEG.".to_string());
    }
    Ok(())
}

fn ensure_templates_layout_key_column(conn: &Connection) -> Result<(), String> {
    let mut stmt = conn
        .prepare("PRAGMA table_info(evidence_templates)")
        .map_err(|e| e.to_string())?;
    let cols: HashSet<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .collect::<Result<_, _>>()
        .map_err(|e| e.to_string())?;

    if cols.contains("layout_key") {
        return Ok(());
    }

    conn.execute_batch(
        "ALTER TABLE evidence_templates ADD COLUMN layout_key TEXT NOT NULL DEFAULT 'enterprise';",
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

/// Valor de preferência não vazio, se existir.
pub fn get_preference_or(conn: &Connection, key: &str) -> Option<String> {
    pref_get(conn, key)
        .ok()
        .flatten()
        .filter(|s| !s.trim().is_empty())
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
        evidence_product_name: trim_opt(
            pref_get(conn, KEY_EVIDENCE_PRODUCT_NAME).map_err(|e| e.to_string())?,
        ),
        evidence_release_version: trim_opt(
            pref_get(conn, KEY_EVIDENCE_RELEASE_VERSION).map_err(|e| e.to_string())?,
        ),
        evidence_deployment_date: trim_opt(
            pref_get(conn, KEY_EVIDENCE_DEPLOYMENT_DATE).map_err(|e| e.to_string())?,
        ),
        evidence_technical_owner: trim_opt(
            pref_get(conn, KEY_EVIDENCE_TECHNICAL_OWNER).map_err(|e| e.to_string())?,
        ),
        evidence_approver: trim_opt(
            pref_get(conn, KEY_EVIDENCE_APPROVER).map_err(|e| e.to_string())?,
        ),
        evidence_out_of_scope: trim_opt(
            pref_get(conn, KEY_EVIDENCE_OUT_OF_SCOPE).map_err(|e| e.to_string())?,
        ),
        evidence_document_version: trim_opt(
            pref_get(conn, KEY_EVIDENCE_DOCUMENT_VERSION).map_err(|e| e.to_string())?,
        ),
        evidence_document_revision_date: trim_opt(
            pref_get(conn, KEY_EVIDENCE_DOCUMENT_REVISION_DATE).map_err(|e| e.to_string())?,
        ),
        evidence_document_revision_summary: trim_opt(
            pref_get(conn, KEY_EVIDENCE_DOCUMENT_REVISION_SUMMARY).map_err(|e| e.to_string())?,
        ),
        evidence_document_revision_author: trim_opt(
            pref_get(conn, KEY_EVIDENCE_DOCUMENT_REVISION_AUTHOR).map_err(|e| e.to_string())?,
        ),
        evidence_document_revision_history: pref_get(conn, KEY_EVIDENCE_DOCUMENT_REVISION_HISTORY)
            .map_err(|e| e.to_string())?
            .filter(|s| !s.trim().is_empty()),
        ai_gemini_api_base: trim_opt(
            pref_get(conn, KEY_AI_GEMINI_API_BASE).map_err(|e| e.to_string())?,
        ),
        ai_gemini_model: trim_opt(
            pref_get(conn, KEY_AI_GEMINI_MODEL).map_err(|e| e.to_string())?,
        ),
        ai_gemini_api_key_configured: pref_get(conn, KEY_AI_GEMINI_API_KEY)
            .map_err(|e| e.to_string())?
            .is_some_and(|s| !s.trim().is_empty()),
    };

    let mut stmt = conn
        .prepare(
            "SELECT id, label, is_builtin, layout_key,
                    header_image_left, header_image_right
             FROM evidence_templates
             ORDER BY is_builtin DESC, sort_order ASC, label ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let layout_raw: String = row.get(3)?;
            let left: Option<String> = row.get(4)?;
            let right: Option<String> = row.get(5)?;
            Ok(EvidenceTemplateRecord {
                id: row.get(0)?,
                label: row.get(1)?,
                is_builtin: row.get::<_, i64>(2)? != 0,
                layout_key: normalize_layout_key(Some(layout_raw)),
                header_image_left: left.filter(|s| !s.trim().is_empty()),
                header_image_right: right.filter(|s| !s.trim().is_empty()),
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

pub fn create_custom_template(
    conn: &Connection,
    label_raw: String,
    layout_key_raw: Option<String>,
) -> Result<CreateEvidenceTemplateResult, String> {
    ensure_app_state_tables(conn)?;
    let label = label_raw.trim().to_string();
    if label.is_empty() {
        return Err("Nome do template não pode ser vazio.".to_string());
    }
    if label.len() > 200 {
        return Err("Nome do template demasiado longo (max. 200).".to_string());
    }

    let layout_key = normalize_layout_key(layout_key_raw);

    let next_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM evidence_templates",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO evidence_templates (id, label, is_builtin, sort_order, layout_key)
         VALUES (?1, ?2, 0, ?3, ?4)",
        params![id, label, next_order, layout_key],
    )
    .map_err(|e| e.to_string())?;

    Ok(CreateEvidenceTemplateResult {
        id,
        label,
        is_builtin: false,
        layout_key,
    })
}

pub fn set_template_header_images(
    conn: &Connection,
    template_id: String,
    header_image_left: String,
    header_image_right: String,
) -> Result<(), String> {
    ensure_app_state_tables(conn)?;
    validate_header_image_data_url(&header_image_left)?;
    validate_header_image_data_url(&header_image_right)?;

    let left_val = header_image_left.trim();
    let right_val = header_image_right.trim();

    let n = conn
        .execute(
            "UPDATE evidence_templates SET
                header_image_left = ?1,
                header_image_right = ?2
             WHERE id = ?3",
            params![
                if left_val.is_empty() {
                    None::<String>
                } else {
                    Some(left_val.to_string())
                },
                if right_val.is_empty() {
                    None::<String>
                } else {
                    Some(right_val.to_string())
                },
                template_id,
            ],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Template não encontrado.".to_string());
    }
    Ok(())
}

pub fn set_template_layout(
    conn: &Connection,
    template_id: String,
    layout_key_raw: String,
) -> Result<(), String> {
    ensure_app_state_tables(conn)?;
    let layout_key = normalize_layout_key(Some(layout_key_raw));
    let n = conn
        .execute(
            "UPDATE evidence_templates SET layout_key = ?1 WHERE id = ?2",
            params![layout_key, template_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Template não encontrado.".to_string());
    }
    Ok(())
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
    fn seed_default_template_exists_and_uses_market_layout() {
        let (_tmp, conn) = open_schema();
        let s = load_snapshot(&conn).unwrap();
        let def = s.templates.iter().find(|t| t.id == "default").unwrap();
        assert!(def.is_builtin);
        assert_eq!(def.layout_key, "market_standard");
    }

    #[test]
    fn create_list_delete_custom_roundtrip() {
        let (_tmp, conn) = open_schema();
        let created = create_custom_template(&conn, "  QA release  ".into(), None).unwrap();
        assert_ne!(created.id, "default");
        assert_eq!(created.layout_key, "enterprise");
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
        assert!(!s.preferences.ai_gemini_api_key_configured);

        set_preference(
            &conn,
            KEY_AI_GEMINI_API_BASE.into(),
            "https://generativelanguage.googleapis.com/v1beta".into(),
        )
        .unwrap();
        set_preference(
            &conn,
            KEY_AI_GEMINI_MODEL.into(),
            "gemini-2.0-flash".into(),
        )
        .unwrap();
        set_preference(&conn, KEY_AI_GEMINI_API_KEY.into(), "fake-key".into()).unwrap();
        let s3 = load_snapshot(&conn).unwrap();
        assert_eq!(
            s3.preferences.ai_gemini_api_base,
            Some("https://generativelanguage.googleapis.com/v1beta".into())
        );
        assert_eq!(
            s3.preferences.ai_gemini_model,
            Some("gemini-2.0-flash".into())
        );
        assert!(s3.preferences.ai_gemini_api_key_configured);

        set_preference(&conn, KEY_AI_GEMINI_API_KEY.into(), "".into()).unwrap();
        let s4 = load_snapshot(&conn).unwrap();
        assert!(!s4.preferences.ai_gemini_api_key_configured);

        set_preference(&conn, KEY_EVIDENCE_CHANGE_ID.into(), "".into()).unwrap();
        let s2 = load_snapshot(&conn).unwrap();
        assert_eq!(s2.preferences.evidence_change_id, None);

        let err = set_preference(&conn, "unknown".into(), "x".into()).unwrap_err();
        assert!(err.contains("desconhecida"));
    }

    #[test]
    fn custom_template_respects_layout_and_set_updates() {
        let (_tmp, conn) = open_schema();
        let created =
            create_custom_template(&conn, "L".into(), Some("minimal".into())).unwrap();
        assert_eq!(created.layout_key, "minimal");

        set_template_layout(&conn, created.id.clone(), "audit".into()).unwrap();
        let list = load_snapshot(&conn).unwrap();
        let row = list.templates.iter().find(|t| t.id == created.id).unwrap();
        assert_eq!(row.layout_key, "audit");

        set_template_layout(&conn, "default".into(), "market_standard".into()).unwrap();
        let list2 = load_snapshot(&conn).unwrap();
        let def = list2.templates.iter().find(|t| t.id == "default").unwrap();
        assert_eq!(def.layout_key, "market_standard");
    }

    #[test]
    fn template_header_images_roundtrip() {
        let (_tmp, conn) = open_schema();
        let left = "data:image/png;base64,iVBORw0KGgo=".to_string();
        let right = "data:image/jpeg;base64,/9j/4AA=".to_string();
        set_template_header_images(&conn, "default".into(), left.clone(), right.clone()).unwrap();
        let s = load_snapshot(&conn).unwrap();
        let def = s.templates.iter().find(|t| t.id == "default").unwrap();
        assert_eq!(def.header_image_left.as_ref(), Some(&left));
        assert_eq!(def.header_image_right.as_ref(), Some(&right));
        set_template_header_images(&conn, "default".into(), "".into(), "".into()).unwrap();
        let s2 = load_snapshot(&conn).unwrap();
        let def2 = s2.templates.iter().find(|t| t.id == "default").unwrap();
        assert!(def2.header_image_left.is_none());
        assert!(def2.header_image_right.is_none());
    }

    #[test]
    fn template_header_accepts_charset_in_data_url() {
        let (_tmp, conn) = open_schema();
        let with_charset = "data:image/jpeg;charset=utf-8;base64,/9j/4AA=".to_string();
        set_template_header_images(
            &conn,
            "default".into(),
            with_charset.clone(),
            "".into(),
        )
        .unwrap();
        let s = load_snapshot(&conn).unwrap();
        let def = s.templates.iter().find(|t| t.id == "default").unwrap();
        assert_eq!(def.header_image_left.as_ref(), Some(&with_charset));
    }
}
