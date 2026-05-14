use std::fs;
use std::path::Path;

fn ensure_parent_dir(path: &Path) -> Result<(), String> {
    if path.as_os_str().is_empty() {
        return Err("Caminho vazio.".to_string());
    }
    if !path.is_absolute() {
        return Err("É necessário um caminho absoluto.".to_string());
    }
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

pub fn write_utf8_file(path: &Path, contents: &str) -> Result<(), String> {
    ensure_parent_dir(path)?;
    fs::write(path, contents.as_bytes()).map_err(|e| e.to_string())
}

pub fn write_bytes_file(path: &Path, contents: &[u8]) -> Result<(), String> {
    ensure_parent_dir(path)?;
    fs::write(path, contents).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_relative_path() {
        let err = write_utf8_file(Path::new("relative.txt"), "x").unwrap_err();
        assert!(err.contains("absoluto"));
    }

    #[test]
    fn writes_file() {
        let tmp = tempfile::tempdir().unwrap();
        let p = tmp.path().join("out.html");
        write_utf8_file(&p, "<p>hi</p>").unwrap();
        assert_eq!(fs::read_to_string(&p).unwrap(), "<p>hi</p>");
    }

    #[test]
    fn writes_binary_file() {
        let tmp = tempfile::tempdir().unwrap();
        let p = tmp.path().join("out.bin");
        write_bytes_file(&p, &[0x00, 0xff, 0x7f]).unwrap();
        assert_eq!(fs::read(&p).unwrap(), vec![0x00, 0xff, 0x7f]);
    }
}
