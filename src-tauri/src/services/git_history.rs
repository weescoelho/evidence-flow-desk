use git2::{DiffFindOptions, Patch, Revwalk, Sort};

use crate::models::git::{
    CommitRow, FileChangeRow, FileChangeStatus, RepositoryScopeSummary,
};
use crate::models::GitCommandError;
use crate::services::git_repository;

const MAX_COMMITS: usize = 2000;

pub fn repository_scope_summary(
    path: &str,
    base_ref: &str,
    compare_ref: &str,
) -> Result<RepositoryScopeSummary, GitCommandError> {
    let repo = git_repository::open_repository(path)?;

    let base_oid = repo
        .revparse_single(base_ref)
        .map_err(|e| {
            GitCommandError::io(format!(
                "ref base inválida «{base_ref}»: {}",
                e.message()
            ))
        })?
        .id();
    let compare_oid = repo
        .revparse_single(compare_ref)
        .map_err(|e| {
            GitCommandError::io(format!(
                "ref compare inválida «{compare_ref}»: {}",
                e.message()
            ))
        })?
        .id();

    if base_oid == compare_oid {
        return Ok(RepositoryScopeSummary {
            commits: vec![],
            files: vec![],
            commits_truncated: false,
        });
    }

    let merge_base_oid = repo.merge_base(base_oid, compare_oid).map_err(|e| {
        GitCommandError::io(format!(
            "não foi possível calcular o ancestral comum entre as refs: {}",
            e.message()
        ))
    })?;

    let (commits, commits_truncated) = walk_commits(&repo, base_oid, compare_oid)?;
    let files = diff_files(&repo, merge_base_oid, compare_oid)?;

    Ok(RepositoryScopeSummary {
        commits,
        files,
        commits_truncated,
    })
}

fn walk_commits(
    repo: &git2::Repository,
    base_oid: git2::Oid,
    compare_oid: git2::Oid,
) -> Result<(Vec<CommitRow>, bool), GitCommandError> {
    let mut rw: Revwalk<'_> = repo.revwalk().map_err(|e| GitCommandError::io(e.message()))?;
    rw.set_sorting(Sort::TOPOLOGICAL | Sort::TIME)
        .map_err(|e| GitCommandError::io(e.message()))?;
    rw.push(compare_oid)
        .map_err(|e| GitCommandError::io(e.message()))?;
    rw.hide(base_oid)
        .map_err(|e| GitCommandError::io(e.message()))?;

    let mut commits: Vec<CommitRow> = Vec::new();
    let mut truncated = false;

    for item in rw {
        let oid = item.map_err(|e| GitCommandError::io(e.message()))?;
        if commits.len() >= MAX_COMMITS {
            truncated = true;
            break;
        }
        let commit = repo
            .find_commit(oid)
            .map_err(|e| GitCommandError::io(e.message()))?;
        commits.push(commit_to_row(&commit));
    }

    Ok((commits, truncated))
}

fn commit_to_row(commit: &git2::Commit<'_>) -> CommitRow {
    let full = commit.id().to_string();
    let author = commit.author();
    let name = author.name().unwrap_or("").to_string();
    let email = author.email().unwrap_or("").to_string();
    let time = author.when().seconds();
    let message = commit.message().unwrap_or("").to_string();
    let summary = message.lines().next().unwrap_or("").trim().to_string();
    let conventional_type = parse_conventional_type(&message);
    CommitRow {
        short_hash: short_hash_hex(&full),
        hash: full,
        author_name: name,
        author_email: email,
        committed_at_unix: time,
        summary,
        message,
        conventional_type,
    }
}

fn short_hash_hex(full: &str) -> String {
    if full.len() >= 7 {
        full[..7].to_string()
    } else {
        full.to_string()
    }
}

fn parse_conventional_type(message: &str) -> Option<String> {
    let first = message.lines().next()?.trim();
    if first.is_empty() {
        return None;
    }
    let head = first.split(':').next()?.trim();
    let ty = head.split('(').next()?.trim().to_lowercase();
    const TYPES: &[&str] = &[
        "feat", "fix", "refactor", "docs", "chore", "perf", "test",
    ];
    if TYPES.iter().any(|t| *t == ty.as_str()) {
        Some(ty)
    } else {
        None
    }
}

fn diff_files(
    repo: &git2::Repository,
    old_oid: git2::Oid,
    new_oid: git2::Oid,
) -> Result<Vec<FileChangeRow>, GitCommandError> {
    let old_commit = repo
        .find_commit(old_oid)
        .map_err(|e| GitCommandError::io(e.message()))?;
    let new_commit = repo
        .find_commit(new_oid)
        .map_err(|e| GitCommandError::io(e.message()))?;
    let old_tree = old_commit.tree().map_err(|e| GitCommandError::io(e.message()))?;
    let new_tree = new_commit.tree().map_err(|e| GitCommandError::io(e.message()))?;
    let mut diff = repo
        .diff_tree_to_tree(Some(&old_tree), Some(&new_tree), None)
        .map_err(|e| GitCommandError::io(e.message()))?;

    let mut find_opts = DiffFindOptions::new();
    find_opts.renames(true);
    diff.find_similar(Some(&mut find_opts))
        .map_err(|e| GitCommandError::io(e.message()))?;

    let mut files: Vec<FileChangeRow> = Vec::new();
    for i in 0..diff.deltas().len() {
        let delta = diff.get_delta(i).expect("índice de delta válido");
        let status = map_status(delta.status());
        let path_old = delta
            .old_file()
            .path()
            .and_then(|p| p.to_str())
            .map(String::from);
        let path_new = delta
            .new_file()
            .path()
            .and_then(|p| p.to_str())
            .map(String::from);
        let path = path_new
            .clone()
            .or(path_old.clone())
            .unwrap_or_else(|| "<unknown>".to_string());

        let (lines_added, lines_removed) = match Patch::from_diff(&diff, i) {
            Ok(Some(p)) => match p.line_stats() {
                Ok((_ctx, add, del)) => (add, del),
                Err(_) => (0, 0),
            },
            _ => (0, 0),
        };

        files.push(FileChangeRow {
            path,
            path_before: path_old,
            path_after: path_new,
            status,
            lines_added,
            lines_removed,
        });
    }

    Ok(files)
}

fn map_status(status: git2::Delta) -> FileChangeStatus {
    use git2::Delta::*;
    match status {
        Added => FileChangeStatus::Added,
        Deleted => FileChangeStatus::Deleted,
        Modified => FileChangeStatus::Modified,
        Renamed => FileChangeStatus::Renamed,
        Copied => FileChangeStatus::Copied,
        _ => FileChangeStatus::Other,
    }
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::process::Command;

    fn default_branch(repo: &std::path::Path) -> String {
        let out = Command::new("git")
            .args(["branch", "--show-current"])
            .current_dir(repo)
            .output()
            .expect("git branch --show-current");
        assert!(out.status.success());
        String::from_utf8(out.stdout).unwrap().trim().to_string()
    }

    fn repo_feature_ahead_of_default() -> (tempfile::TempDir, String) {
        let tmp = tempfile::tempdir().unwrap();
        fs::create_dir_all(tmp.path()).unwrap();
        Command::new("git")
            .args(["init"])
            .current_dir(tmp.path())
            .status()
            .expect("git init");
        fs::write(tmp.path().join("README.md"), "# t\n").unwrap();
        Command::new("git")
            .args(["add", "."])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        Command::new("git")
            .args([
                "-c",
                "user.email=t@t",
                "-c",
                "user.name=t",
                "commit",
                "-m",
                "init",
            ])
            .current_dir(tmp.path())
            .status()
            .unwrap();

        let base = default_branch(tmp.path());

        Command::new("git")
            .args(["checkout", "-b", "feature-x"])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        fs::write(tmp.path().join("new.txt"), "hello\n").unwrap();
        Command::new("git")
            .args(["add", "new.txt"])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        Command::new("git")
            .args([
                "-c",
                "user.email=t@t",
                "-c",
                "user.name=t",
                "commit",
                "-m",
                "feat: add file",
            ])
            .current_dir(tmp.path())
            .status()
            .unwrap();

        (tmp, base)
    }

    #[test]
    fn scope_lists_commits_and_files_between_branches() {
        let (tmp, base) = repo_feature_ahead_of_default();
        let path = tmp.path().to_string_lossy().to_string();
        let s = super::repository_scope_summary(&path, &base, "feature-x").expect("scope summary");
        assert_eq!(s.commits.len(), 1, "commits={:?}", s.commits);
        assert_eq!(s.commits[0].conventional_type.as_deref(), Some("feat"));
        assert!(
            s.files.iter().any(|f| f.path.ends_with("new.txt")),
            "files={:?}",
            s.files
        );
        assert!(!s.commits_truncated);
    }

    #[test]
    fn scope_empty_when_same_ref() {
        let (tmp, base) = repo_feature_ahead_of_default();
        let path = tmp.path().to_string_lossy().to_string();
        let s = super::repository_scope_summary(&path, &base, &base).unwrap();
        assert!(s.commits.is_empty());
        assert!(s.files.is_empty());
        assert!(!s.commits_truncated);
    }

    #[test]
    fn scope_accepts_tag_as_base_ref() {
        let (tmp, base) = repo_feature_ahead_of_default();
        let path = tmp.path().to_string_lossy().to_string();
        Command::new("git")
            .args(["checkout", &base])
            .current_dir(tmp.path())
            .status()
            .expect("checkout base");
        Command::new("git")
            .args(["tag", "v1.0.0"])
            .current_dir(tmp.path())
            .status()
            .expect("git tag");
        Command::new("git")
            .args(["checkout", "feature-x"])
            .current_dir(tmp.path())
            .status()
            .expect("checkout feature");

        let s = super::repository_scope_summary(&path, "v1.0.0", "feature-x").expect("scope");
        assert_eq!(s.commits.len(), 1);
        assert_eq!(s.commits[0].conventional_type.as_deref(), Some("feat"));
        assert!(
            s.files.iter().any(|f| f.path.ends_with("new.txt")),
            "files={:?}",
            s.files
        );
    }
}
