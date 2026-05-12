use git2::{BranchType, ErrorClass, ErrorCode, Repository};

use crate::models::git::{GitBranchRow, ListBranchesResponse, ValidateGitRepositoryResponse};
use crate::models::GitCommandError;

pub fn validate_repository(path: &str) -> Result<ValidateGitRepositoryResponse, GitCommandError> {
    let canonical_path = resolve_path(path)?;
    let _repo = open_repo(&canonical_path)?;
    Ok(ValidateGitRepositoryResponse { canonical_path })
}

pub fn list_branches(path: &str) -> Result<ListBranchesResponse, GitCommandError> {
    let canonical_path = resolve_path(path)?;
    let repo = open_repo(&canonical_path)?;
    list_branches_inner(repo)
}

/// Abre o repositório no caminho indicado (canonicalizado). Uso interno por outros serviços Git.
pub(crate) fn open_repository(path: &str) -> Result<Repository, GitCommandError> {
    let canonical_path = resolve_path(path)?;
    open_repo(&canonical_path)
}

fn resolve_path(path: &str) -> Result<String, GitCommandError> {
    std::fs::canonicalize(path)
        .map(|p| p.to_string_lossy().to_string())
        .map_err(map_io_error)
}

fn map_io_error(e: std::io::Error) -> GitCommandError {
    match e.kind() {
        std::io::ErrorKind::PermissionDenied => {
            GitCommandError::permission_denied(e.to_string())
        }
        std::io::ErrorKind::NotFound => {
            GitCommandError::not_a_git_repository(format!("caminho não encontrado: {e}"))
        }
        _ => GitCommandError::io(e.to_string()),
    }
}

fn open_repo(canonical_path: &str) -> Result<Repository, GitCommandError> {
    Repository::open(canonical_path).map_err(|e| map_git2_open_error(canonical_path, e))
}

fn map_git2_open_error(path: &str, e: git2::Error) -> GitCommandError {
    match e.code() {
        ErrorCode::NotFound => GitCommandError::not_a_git_repository(format!(
            "«{path}» não é um repositório Git válido ({})",
            e.message()
        )),
        ErrorCode::Auth => GitCommandError::permission_denied(e.message().to_string()),
        _ if e.class() == ErrorClass::Os && e.message().contains("Permission denied") => {
            GitCommandError::permission_denied(e.message().to_string())
        }
        _ => GitCommandError::not_a_git_repository(format!(
            "«{path}» não é um repositório Git válido ({})",
            e.message()
        )),
    }
}

fn list_branches_inner(repo: Repository) -> Result<ListBranchesResponse, GitCommandError> {
    let head = repo
        .head()
        .map_err(|e| GitCommandError::io(e.message().to_string()))?;

    let head_branch_name = if head.is_branch() {
        head.shorthand().map(std::string::ToString::to_string)
    } else {
        None
    };

    let detached = head_branch_name.is_none();

    let head_display = if let Some(ref name) = head_branch_name {
        name.clone()
    } else {
        let oid = head.target().ok_or_else(|| {
            GitCommandError::io("HEAD não aponta para um objeto válido".to_string())
        })?;
        let full = oid.to_string();
        let short = if full.len() >= 7 {
            &full[..7]
        } else {
            full.as_str()
        };
        format!("detached @ {short}")
    };

    let mut branches = Vec::new();

    for br in repo
        .branches(Some(BranchType::Local))
        .map_err(|e| GitCommandError::io(e.message().to_string()))?
    {
        let (branch, _) = br.map_err(|e| GitCommandError::io(e.message().to_string()))?;
        let name = branch
            .name()
            .map_err(|e| GitCommandError::io(e.message().to_string()))?
            .unwrap_or("")
            .to_string();
        if name.is_empty() {
            continue;
        }
        let is_head = head_branch_name.as_ref() == Some(&name);
        branches.push(GitBranchRow { name, is_head });
    }

    branches.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(ListBranchesResponse {
        branches,
        head_display,
        detached,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::process::Command;

    fn init_repo(dir: &std::path::Path) {
        fs::create_dir_all(dir).unwrap();
        let status = Command::new("git")
            .args(["init"])
            .current_dir(dir)
            .status()
            .expect("git init");
        assert!(status.success(), "git init failed");
        fs::write(dir.join("README.md"), "# t\n").unwrap();
        let status = Command::new("git")
            .args(["add", "README.md"])
            .current_dir(dir)
            .status()
            .unwrap();
        assert!(status.success());
        let status = Command::new("git")
            .args(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-m", "init"])
            .current_dir(dir)
            .status()
            .unwrap();
        assert!(status.success());
        let status = Command::new("git")
            .args([
                "-c",
                "user.email=t@t",
                "-c",
                "user.name=t",
                "branch",
                "feature-x",
            ])
            .current_dir(dir)
            .status()
            .unwrap();
        assert!(status.success());
    }

    #[test]
    fn validate_accepts_git_repo() {
        let tmp = tempfile::tempdir().unwrap();
        init_repo(tmp.path());
        let path = tmp.path().to_string_lossy();
        let r = validate_repository(&path).unwrap();
        assert!(!r.canonical_path.is_empty());
    }

    #[test]
    fn validate_rejects_plain_folder() {
        let tmp = tempfile::tempdir().unwrap();
        fs::write(tmp.path().join("a.txt"), "x").unwrap();
        let err = validate_repository(&tmp.path().to_string_lossy()).unwrap_err();
        assert_eq!(err.code, "not_a_git_repository");
    }

    #[test]
    fn list_branches_lists_locals_and_head() {
        let tmp = tempfile::tempdir().unwrap();
        init_repo(tmp.path());
        let path = tmp.path().to_string_lossy().to_string();
        let res = list_branches(&path).unwrap();
        assert!(res.branches.iter().any(|b| b.name == "feature-x"));
        assert!(res.branches.iter().any(|b| b.is_head));
        assert!(!res.detached);
    }
}
