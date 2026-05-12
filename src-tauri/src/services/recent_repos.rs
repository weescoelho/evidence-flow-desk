use std::fs;
use std::io::Write;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const FILE_NAME: &str = "recent_repositories.json";
pub const MAX_ENTRIES: usize = 10;

#[derive(Debug, Default, Serialize, Deserialize)]
struct StoreFile {
    entries: Vec<String>,
}

pub struct RecentReposStore {
    file_path: PathBuf,
}

impl RecentReposStore {
    pub fn for_app(app: &AppHandle) -> Result<Self, String> {
        let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        Ok(Self {
            file_path: dir.join(FILE_NAME),
        })
    }

    #[cfg(test)]
    fn with_file(path: PathBuf) -> Self {
        Self { file_path: path }
    }

    pub fn list(&self) -> Result<Vec<String>, String> {
        if !self.file_path.exists() {
            return Ok(Vec::new());
        }
        let raw = fs::read_to_string(&self.file_path).map_err(|e| e.to_string())?;
        let data: StoreFile = serde_json::from_str(&raw).unwrap_or_default();
        Ok(data.entries)
    }

    pub fn add(&self, path: &str) -> Result<(), String> {
        let canonical = fs::canonicalize(path).map_err(|e| e.to_string())?;
        let s = canonical.to_string_lossy().to_string();
        let mut entries = self.list()?;
        entries.retain(|e| e != &s);
        entries.insert(0, s);
        entries.truncate(MAX_ENTRIES);
        self.write(&entries)
    }

    pub fn remove_path(&self, path: &str) -> Result<(), String> {
        let target_canon = fs::canonicalize(path).ok();
        let mut entries = self.list()?;
        entries.retain(|e| {
            if e == path {
                return false;
            }
            match (fs::canonicalize(e), target_canon.as_ref()) {
                (Ok(a), Some(b)) => a != *b,
                _ => true,
            }
        });
        self.write(&entries)
    }

    fn write(&self, entries: &[String]) -> Result<(), String> {
        let data = StoreFile {
            entries: entries.to_vec(),
        };
        let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
        if let Some(parent) = self.file_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let mut f = fs::File::create(&self.file_path).map_err(|e| e.to_string())?;
        f.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
        Ok(())
    }
}

pub fn list(app: &AppHandle) -> Result<Vec<String>, String> {
    RecentReposStore::for_app(app)?.list()
}

pub fn add(app: &AppHandle, path: String) -> Result<(), String> {
    RecentReposStore::for_app(app)?.add(&path)
}

pub fn remove(app: &AppHandle, path: String) -> Result<(), String> {
    RecentReposStore::for_app(app)?.remove_path(&path)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mru_dedupes_and_truncates() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join("recent_repositories.json");
        let store = RecentReposStore::with_file(f);

        let a = tmp.path().join("a");
        let b = tmp.path().join("b");
        fs::create_dir_all(&a).unwrap();
        fs::create_dir_all(&b).unwrap();
        let pa = a.canonicalize().unwrap().to_string_lossy().to_string();
        let pb = b.canonicalize().unwrap().to_string_lossy().to_string();

        store.add(&pa).unwrap();
        store.add(&pb).unwrap();
        store.add(&pa).unwrap();

        let entries = store.list().unwrap();
        assert_eq!(entries[0], pa);
        assert_eq!(entries[1], pb);
    }

    #[test]
    fn remove_drops_matching_entry() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join("recent_repositories.json");
        let store = RecentReposStore::with_file(f);
        let a = tmp.path().join("r1");
        fs::create_dir_all(&a).unwrap();
        let pa = a.canonicalize().unwrap().to_string_lossy().to_string();
        store.add(&pa).unwrap();
        store.remove_path(&pa).unwrap();
        assert!(store.list().unwrap().is_empty());
    }
}
