use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

const ROOT_DIR: &str = "evidence_documents";
const INDEX_FILE: &str = "index.json";
const DOCUMENT_FILE: &str = "document.html";
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
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveEvidenceDocumentResult {
    pub id: String,
    pub html_path: String,
}

pub struct EvidenceDocumentsStore {
    root: PathBuf,
    max_entries: usize,
}

impl EvidenceDocumentsStore {
    pub fn for_app(app: &AppHandle) -> Result<Self, String> {
        Self::for_app_with_max(app, DEFAULT_MAX_ENTRIES)
    }

    fn for_app_with_max(app: &AppHandle, max_entries: usize) -> Result<Self, String> {
        let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        Ok(Self {
            root: dir.join(ROOT_DIR),
            max_entries,
        })
    }

    #[cfg(test)]
    fn with_root(root: PathBuf, max_entries: usize) -> Self {
        Self { root, max_entries }
    }

    fn index_path(&self) -> PathBuf {
        self.root.join(INDEX_FILE)
    }

    fn doc_dir(&self, id: &str) -> PathBuf {
        self.root.join(id)
    }

    fn html_path_for_id(&self, id: &str) -> PathBuf {
        self.doc_dir(id).join(DOCUMENT_FILE)
    }

    fn read_index(&self) -> Result<Vec<IndexEntry>, String> {
        let p = self.index_path();
        if !p.exists() {
            return Ok(Vec::new());
        }
        let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
        let data: IndexFile = serde_json::from_str(&raw).unwrap_or_default();
        Ok(data.entries)
    }

    fn write_index(&self, entries: &[IndexEntry]) -> Result<(), String> {
        fs::create_dir_all(&self.root).map_err(|e| e.to_string())?;
        let data = IndexFile {
            entries: entries.to_vec(),
        };
        let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
        let mut f = fs::File::create(self.index_path()).map_err(|e| e.to_string())?;
        f.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
        Ok(())
    }

    fn now_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }

    pub fn save(
        &self,
        html: String,
        repository_path: String,
        base_ref: String,
        compare_ref: String,
    ) -> Result<SaveEvidenceDocumentResult, String> {
        fs::create_dir_all(&self.root).map_err(|e| e.to_string())?;

        let mut entries = self.read_index()?;
        while entries.len() >= self.max_entries {
            if let Some(old) = entries.pop() {
                let dir = self.doc_dir(&old.id);
                if dir.exists() {
                    fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
                }
            } else {
                break;
            }
        }

        let id = Uuid::new_v4().to_string();
        let dir = self.doc_dir(&id);
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

        let html_path = dir.join(DOCUMENT_FILE);
        fs::write(&html_path, html).map_err(|e| e.to_string())?;

        let html_path_str = normalize_path(&html_path);

        entries.insert(
            0,
            IndexEntry {
                id: id.clone(),
                saved_at_ms: Self::now_ms(),
                repository_path,
                base_ref,
                compare_ref,
            },
        );
        self.write_index(&entries)?;

        Ok(SaveEvidenceDocumentResult {
            id,
            html_path: html_path_str,
        })
    }

    pub fn list(&self) -> Result<Vec<SavedEvidenceDocumentInfo>, String> {
        let entries = self.read_index()?;
        Ok(entries
            .into_iter()
            .map(|e| SavedEvidenceDocumentInfo {
                html_path: normalize_path(&self.html_path_for_id(&e.id)),
                id: e.id,
                saved_at_ms: e.saved_at_ms,
                repository_path: e.repository_path,
                base_ref: e.base_ref,
                compare_ref: e.compare_ref,
            })
            .collect())
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
) -> Result<SaveEvidenceDocumentResult, String> {
    EvidenceDocumentsStore::for_app(app)?.save(html, repository_path, base_ref, compare_ref)
}

pub fn list_documents(app: &AppHandle) -> Result<Vec<SavedEvidenceDocumentInfo>, String> {
    EvidenceDocumentsStore::for_app(app)?.list()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn save_then_list_returns_entry_with_html_path() {
        let tmp = tempfile::tempdir().unwrap();
        let store = EvidenceDocumentsStore::with_root(tmp.path().join(ROOT_DIR), 10);

        let r = store
            .save(
                "<html>x</html>".to_string(),
                "/repo".to_string(),
                "main".to_string(),
                "feat".to_string(),
            )
            .unwrap();

        assert!(Path::new(&r.html_path).exists());
        let list = store.list().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, r.id);
        assert_eq!(list[0].repository_path, "/repo");
        assert_eq!(list[0].base_ref, "main");
        assert_eq!(list[0].compare_ref, "feat");
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
        let store = EvidenceDocumentsStore::with_root(tmp.path().join(ROOT_DIR), 2);

        let first = store
            .save("a".into(), "r".into(), "a".into(), "b".into())
            .unwrap();
        let second = store
            .save("b".into(), "r".into(), "a".into(), "b".into())
            .unwrap();
        assert_eq!(count_subdirs(&store.root), 2);

        let third = store
            .save("c".into(), "r".into(), "a".into(), "b".into())
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
}
