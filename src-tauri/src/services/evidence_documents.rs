use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

pub(crate) const ROOT_DIR: &str = "evidence_documents";
/// Legado antes de SQLite (RF-015); migrado uma vez quando a base está vazia.
const LEGACY_INDEX_FILE: &str = "index.json";
const DOCUMENT_FILE: &str = "document.html";
/// Metadamos em SQLite; blobs HTML ficam nos subdirectórios sob `ROOT_DIR`.
const DB_FILE_NAME: &str = "evidence_documents_index.sqlite3";
const DEFAULT_MAX_ENTRIES: usize = 50;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct IndexEntry {
    id: String,
    saved_at_ms: u64,
    repository_path: String,
    base_ref: String,
    compare_ref: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct IndexFile {
    entries: Vec<IndexEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedEvidenceDocumentInfo {
    pub id: String,
    pub saved_at_ms: u64,
    pub repository_path: String,
    pub base_ref: String,
    pub compare_ref: String,
    pub html_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub change_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document_title: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveEvidenceDocumentResult {
    pub id: String,
    pub html_path: String,
}

pub struct EvidenceDocumentsStore {
    root: PathBuf,
    db_path: PathBuf,
    max_entries: usize,
}

impl EvidenceDocumentsStore {
    pub fn for_app(app: &AppHandle) -> Result<Self, String> {
        Self::for_app_with_max(app, DEFAULT_MAX_ENTRIES)
    }

    fn for_app_with_max(app: &AppHandle, max_entries: usize) -> Result<Self, String> {
        let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let root = dir.join(ROOT_DIR);
        let db_path = dir.join(DB_FILE_NAME);
        let store = Self {
            root,
            db_path,
            max_entries,
        };
        store.ensure_schema_and_maybe_migrate_legacy()?;
        Ok(store)
    }

    #[cfg(test)]
    fn with_paths(root: PathBuf, db_path: PathBuf, max_entries: usize) -> Result<Self, String> {
        fs::create_dir_all(&root).map_err(|e| e.to_string())?;
        if let Some(p) = db_path.parent() {
            fs::create_dir_all(p).map_err(|e| e.to_string())?;
        }
        let store = Self {
            root,
            db_path,
            max_entries,
        };
        store.ensure_schema_and_maybe_migrate_legacy()?;
        Ok(store)
    }

    pub(crate) fn conn(&self) -> Result<Connection, String> {
        let c = Connection::open(&self.db_path).map_err(|e| e.to_string())?;
        c.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;",
        )
        .map_err(|e| e.to_string())?;
        Ok(c)
    }

    fn ensure_schema_and_maybe_migrate_legacy(&self) -> Result<(), String> {
        fs::create_dir_all(&self.root).map_err(|e| e.to_string())?;
        let mut conn = self.conn()?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS saved_evidence_documents (
                id TEXT PRIMARY KEY NOT NULL,
                saved_at_ms INTEGER NOT NULL,
                repository_path TEXT NOT NULL,
                base_ref TEXT NOT NULL,
                compare_ref TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_saved_ev_saved_at_desc
                ON saved_evidence_documents(saved_at_ms DESC);
            CREATE INDEX IF NOT EXISTS idx_saved_ev_saved_at_asc
                ON saved_evidence_documents(saved_at_ms ASC);
            ",
        )
        .map_err(|e| e.to_string())?;

        Self::migrate_legacy_json_if_needed(&self.root, &mut conn)?;
        Self::ensure_saved_documents_extra_columns(&conn)?;
        crate::services::evidence_app_state::ensure_app_state_tables(&conn)?;
        Ok(())
    }

    fn ensure_saved_documents_extra_columns(conn: &Connection) -> Result<(), String> {
        let mut stmt = conn
            .prepare("PRAGMA table_info(saved_evidence_documents)")
            .map_err(|e| e.to_string())?;
        let cols: HashSet<String> = stmt
            .query_map([], |row| row.get::<_, String>(1))
            .map_err(|e| e.to_string())?
            .collect::<Result<_, _>>()
            .map_err(|e| e.to_string())?;

        let alters = [
            (
                "template_label",
                "ALTER TABLE saved_evidence_documents ADD COLUMN template_label TEXT",
            ),
            (
                "change_id",
                "ALTER TABLE saved_evidence_documents ADD COLUMN change_id TEXT",
            ),
            (
                "environment",
                "ALTER TABLE saved_evidence_documents ADD COLUMN environment TEXT",
            ),
            (
                "document_title",
                "ALTER TABLE saved_evidence_documents ADD COLUMN document_title TEXT",
            ),
        ];

        for (name, sql) in alters {
            if !cols.contains(name) {
                conn.execute_batch(sql).map_err(|e| e.to_string())?;
            }
        }

        Ok(())
    }

    fn migrate_legacy_json_if_needed(root: &Path, conn: &mut Connection) -> Result<(), String> {
        let legacy = root.join(LEGACY_INDEX_FILE);
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM saved_evidence_documents", [], |r| r.get(0))
            .map_err(|e| e.to_string())?;

        if count > 0 || !legacy.exists() {
            return Ok(());
        }

        let raw = fs::read_to_string(&legacy).map_err(|e| e.to_string())?;
        let data: IndexFile = serde_json::from_str(&raw).unwrap_or_default();

        let tx = conn.transaction().map_err(|e| e.to_string())?;
        for e in &data.entries {
            tx.execute(
                "INSERT OR IGNORE INTO saved_evidence_documents
                 (id, saved_at_ms, repository_path, base_ref, compare_ref)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    e.id,
                    e.saved_at_ms,
                    &e.repository_path,
                    &e.base_ref,
                    &e.compare_ref,
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        tx.commit().map_err(|e| e.to_string())?;

        let backup_path = legacy.with_extension("json.migrated");
        fs::rename(&legacy, &backup_path).map_err(|e| e.to_string())?;

        Ok(())
    }

    fn doc_dir(&self, id: &str) -> PathBuf {
        self.root.join(id)
    }

    fn html_path_for_id(&self, id: &str) -> PathBuf {
        self.doc_dir(id).join(DOCUMENT_FILE)
    }

    fn now_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }

    fn row_count(conn: &Connection) -> Result<i64, rusqlite::Error> {
        conn.query_row("SELECT COUNT(*) FROM saved_evidence_documents", [], |r| r.get(0))
    }

    fn delete_oldest_row_and_disk(&self, conn: &Connection) -> Result<Option<String>, String> {
        let id_opt: Option<String> = conn
            .query_row(
                "SELECT id FROM saved_evidence_documents
                 ORDER BY saved_at_ms ASC, id ASC
                 LIMIT 1",
                [],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;

        let Some(id) = id_opt else {
            return Ok(None);
        };

        let changed = conn
            .execute("DELETE FROM saved_evidence_documents WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        if changed == 0 {
            return Err("Inconsistência ao eliminar documento mais antigo.".to_string());
        }

        let dir = self.doc_dir(&id);
        if dir.exists() {
            fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
        }

        Ok(Some(id))
    }

    /// Mantém menos de `max_entries` registos antes de inserir (comportamento igual ao índice JSON).
    fn prune_until_under_capacity_before_insert(&self, conn: &Connection) -> Result<(), String> {
        loop {
            let count = Self::row_count(conn).map_err(|e| e.to_string())?;
            if (count as usize) < self.max_entries {
                return Ok(());
            }
            if self.delete_oldest_row_and_disk(conn)?.is_none() {
                return Ok(());
            }
        }
    }

    fn normalize_opt(s: Option<String>) -> Option<String> {
        s.and_then(|t| {
            let t = t.trim();
            if t.is_empty() {
                None
            } else {
                Some(t.to_string())
            }
        })
    }

    pub fn save(
        &self,
        html: String,
        repository_path: String,
        base_ref: String,
        compare_ref: String,
        template_label: Option<String>,
        change_id: Option<String>,
        environment: Option<String>,
        document_title: Option<String>,
    ) -> Result<SaveEvidenceDocumentResult, String> {
        fs::create_dir_all(&self.root).map_err(|e| e.to_string())?;

        let conn = self.conn()?;
        self.prune_until_under_capacity_before_insert(&conn)?;

        let id = Uuid::new_v4().to_string();
        let dir = self.doc_dir(&id);
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

        let html_path = dir.join(DOCUMENT_FILE);
        fs::write(&html_path, html).map_err(|e| e.to_string())?;

        let html_path_str = normalize_path(&html_path);

        let template_label = Self::normalize_opt(template_label);
        let change_id = Self::normalize_opt(change_id);
        let environment = Self::normalize_opt(environment);
        let document_title = Self::normalize_opt(document_title);

        conn.execute(
            "INSERT INTO saved_evidence_documents
             (id, saved_at_ms, repository_path, base_ref, compare_ref,
              template_label, change_id, environment, document_title)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                id,
                Self::now_ms(),
                repository_path,
                base_ref,
                compare_ref,
                template_label,
                change_id,
                environment,
                document_title,
            ],
        )
        .map_err(|e| {
            let _ = fs::remove_dir_all(&dir); // rollback directório novo
            e.to_string()
        })?;

        Ok(SaveEvidenceDocumentResult {
            id,
            html_path: html_path_str,
        })
    }

    pub fn list(&self) -> Result<Vec<SavedEvidenceDocumentInfo>, String> {
        let conn = self.conn()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, saved_at_ms, repository_path, base_ref, compare_ref,
                        template_label, change_id, environment, document_title
                 FROM saved_evidence_documents
                 ORDER BY saved_at_ms DESC, id DESC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                Ok(SavedEvidenceDocumentInfo {
                    id: row.get(0)?,
                    saved_at_ms: row.get(1)?,
                    repository_path: row.get(2)?,
                    base_ref: row.get(3)?,
                    compare_ref: row.get(4)?,
                    template_label: row.get(5)?,
                    change_id: row.get(6)?,
                    environment: row.get(7)?,
                    document_title: row.get(8)?,
                    html_path: String::new(),
                })
            })
            .map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for r in rows {
            let mut e = r.map_err(|e| e.to_string())?;
            e.html_path = normalize_path(&self.html_path_for_id(&e.id));
            result.push(e);
        }

        Ok(result)
    }

    /// Remove entrada e pasta no disco. Rejeita ids malformados (path traversal).
    pub fn remove_by_id(&self, id: &str) -> Result<(), String> {
        Uuid::parse_str(id).map_err(|_| "Identificador de documento inválido.".to_string())?;

        let conn = self.conn()?;
        let changed = conn
            .execute("DELETE FROM saved_evidence_documents WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;

        if changed == 0 {
            return Err("Documento não encontrado.".to_string());
        }

        let dir = self.doc_dir(id);
        if dir.exists() {
            fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
        }

        Ok(())
    }
}

fn normalize_path(p: &Path) -> String {
    p.to_string_lossy().to_string()
}

pub fn save_document(
    app: &AppHandle,
    html: String,
    repository_path: String,
    base_ref: String,
    compare_ref: String,
    template_label: Option<String>,
    change_id: Option<String>,
    environment: Option<String>,
    document_title: Option<String>,
) -> Result<SaveEvidenceDocumentResult, String> {
    EvidenceDocumentsStore::for_app(app)?.save(
        html,
        repository_path,
        base_ref,
        compare_ref,
        template_label,
        change_id,
        environment,
        document_title,
    )
}

pub fn list_documents(app: &AppHandle) -> Result<Vec<SavedEvidenceDocumentInfo>, String> {
    EvidenceDocumentsStore::for_app(app)?.list()
}

pub fn delete_document(app: &AppHandle, id: String) -> Result<(), String> {
    EvidenceDocumentsStore::for_app(app)?.remove_by_id(&id)
}

#[cfg(test)]
mod tests {
    use std::thread;
    use std::time::Duration;

    use super::*;

    #[test]
    fn save_then_list_returns_entry_with_html_path() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join(ROOT_DIR);
        let db = tmp.path().join("test_evidence.sqlite3");
        let store = EvidenceDocumentsStore::with_paths(root, db, 10).unwrap();

        let r = store
            .save(
                "<html>x</html>".to_string(),
                "/repo".to_string(),
                "main".to_string(),
                "feat".to_string(),
                Some("Tpl A".into()),
                Some("CHG-1".into()),
                Some("staging".into()),
                Some("Meu projeto — Evidência".into()),
            )
            .unwrap();

        assert!(Path::new(&r.html_path).exists());
        let list = store.list().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, r.id);
        assert_eq!(list[0].repository_path, "/repo");
        assert_eq!(list[0].base_ref, "main");
        assert_eq!(list[0].compare_ref, "feat");
        assert_eq!(list[0].template_label.as_deref(), Some("Tpl A"));
        assert_eq!(list[0].change_id.as_deref(), Some("CHG-1"));
        assert_eq!(list[0].environment.as_deref(), Some("staging"));
        assert_eq!(
            list[0].document_title.as_deref(),
            Some("Meu projeto — Evidência")
        );
    }

    fn count_subdirs(root: &Path) -> usize {
        if !root.exists() {
            return 0;
        }
        fs::read_dir(root)
            .unwrap()
            .filter(|e| {
                let e = e.as_ref().unwrap();
                e.file_type().map(|t| t.is_dir()).unwrap_or(false)
            })
            .count()
    }

    #[test]
    fn pruning_drops_oldest_when_at_capacity() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join(ROOT_DIR);
        let db = tmp.path().join("evidence.sqlite3");
        let store = EvidenceDocumentsStore::with_paths(root, db, 2).unwrap();

        let first = store
            .save("a".into(), "r".into(), "a".into(), "b".into(), None, None, None, None)
            .unwrap();
        thread::sleep(Duration::from_millis(12));
        let second = store
            .save("b".into(), "r".into(), "a".into(), "b".into(), None, None, None, None)
            .unwrap();
        assert_eq!(count_subdirs(&store.root), 2);

        thread::sleep(Duration::from_millis(12));
        let third = store
            .save("c".into(), "r".into(), "a".into(), "b".into(), None, None, None, None)
            .unwrap();

        assert!(!Path::new(&first.html_path).exists());
        assert!(Path::new(&second.html_path).exists());
        assert!(Path::new(&third.html_path).exists());
        assert_eq!(count_subdirs(&store.root), 2);

        let list = store.list().unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].id, third.id);
        assert_eq!(list[1].id, second.id);
    }

    #[test]
    fn remove_by_id_drops_entry_and_folder() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join(ROOT_DIR);
        let db = tmp.path().join("rm.sqlite3");
        let store = EvidenceDocumentsStore::with_paths(root, db, 10).unwrap();

        let r = store
            .save("x".into(), "/r".into(), "a".into(), "b".into(), None, None, None, None)
            .unwrap();
        assert!(Path::new(&r.html_path).exists());

        store.remove_by_id(&r.id).unwrap();

        assert!(!Path::new(&r.html_path).exists());
        assert!(store.list().unwrap().is_empty());
    }

    #[test]
    fn remove_by_id_rejects_non_uuid() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join(ROOT_DIR);
        let db = tmp.path().join("rej.sqlite3");
        let store = EvidenceDocumentsStore::with_paths(root, db, 10).unwrap();
        let err = store.remove_by_id("../etc").unwrap_err();
        assert!(err.contains("inválido"));
    }

    #[test]
    fn migrates_legacy_index_json_into_sqlite() {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().join(ROOT_DIR);
        fs::create_dir_all(&root).unwrap();
        let legacy_path = root.join(LEGACY_INDEX_FILE);
        let legacy = IndexFile {
            entries: vec![
                IndexEntry {
                    id: Uuid::new_v4().to_string(),
                    saved_at_ms: 100,
                    repository_path: "/x".into(),
                    base_ref: "m".into(),
                    compare_ref: "f".into(),
                },
                IndexEntry {
                    id: Uuid::new_v4().to_string(),
                    saved_at_ms: 200,
                    repository_path: "/y".into(),
                    base_ref: "a".into(),
                    compare_ref: "b".into(),
                },
            ],
        };
        let json = serde_json::to_string_pretty(&legacy).unwrap();
        fs::write(&legacy_path, json).unwrap();

        let db = tmp.path().join("migrate.sqlite3");
        let store = EvidenceDocumentsStore::with_paths(root.clone(), db, 50).unwrap();

        assert!(
            !legacy_path.exists(),
            "ficheiro legado deve ser renomeado após migração"
        );
        let migrated = legacy.entries.iter().map(|e| e.id.clone()).collect::<Vec<_>>();
        let list = store.list().unwrap();
        assert_eq!(list.len(), legacy.entries.len());
        for row in list {
            assert!(migrated.contains(&row.id));
        }
    }
}
