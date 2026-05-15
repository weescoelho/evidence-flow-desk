use std::collections::{BTreeMap, HashMap};

use git2::{DiffFindOptions, Patch, Revwalk, Sort};

use crate::models::git::{
    BranchScopeEntry, CommitRow, FileChangeRow, FileChangeStatus, MultiBranchScopeSummary,
};
use crate::models::GitCommandError;
use crate::services::git_repository;

const MAX_COMMITS: usize = 2000;

/// Agrega commits e diff de ficheiros desde o ancestral comum de todas as refs até ao tip de cada branch.
pub fn multi_branch_scope_summary(
    path: &str,
    branch_refs: Vec<String>,
) -> Result<MultiBranchScopeSummary, GitCommandError> {
    let repo = git_repository::open_repository(path)?;

    let mut ordered_unique: Vec<(String, git2::Oid)> = Vec::new();
    let mut seen_oid: HashMap<git2::Oid, ()> = HashMap::new();

    for raw in branch_refs {
        let r = raw.trim();
        if r.is_empty() {
            continue;
        }
        let oid = repo
            .revparse_single(r)
            .map_err(|e| {
                GitCommandError::io(format!(
                    "ref de branch inválida «{r}»: {}",
                    e.message()
                ))
            })?
            .id();
        if seen_oid.insert(oid, ()).is_none() {
            ordered_unique.push((r.to_string(), oid));
        }
    }

    if ordered_unique.is_empty() {
        return Ok(MultiBranchScopeSummary {
            branches: vec![],
            files: vec![],
            common_ancestor_hash: None,
            commits_truncated: false,
        });
    }

    let oids: Vec<git2::Oid> = ordered_unique.iter().map(|(_, o)| *o).collect();

    let ancestor_oid = if oids.len() == 1 {
        let tip = oids[0];
        ancestor_for_single_branch_tip(&repo, tip)?
    } else {
        repo.merge_base_many(&oids).map_err(|e| {
            GitCommandError::io(format!(
                "não foi possível calcular o ancestral comum das branches: {}",
                e.message()
            ))
        })?
    };

    let common_ancestor_hash = Some(ancestor_oid.to_string());

    let mut branches: Vec<BranchScopeEntry> = Vec::new();
    let mut file_accumulator: BTreeMap<String, FileChangeRow> = BTreeMap::new();
    let mut any_truncated = false;

    for (ref_name, tip_oid) in ordered_unique {
        let (commits, truncated) = walk_commits(&repo, ancestor_oid, tip_oid)?;
        if truncated {
            any_truncated = true;
        }
        let files_for_tip = diff_files(&repo, ancestor_oid, tip_oid)?;
        merge_files_into(&mut file_accumulator, files_for_tip);
        branches.push(BranchScopeEntry {
            branch_ref: ref_name,
            commits,
            commits_truncated: truncated,
        });
    }

    let files: Vec<FileChangeRow> = file_accumulator.into_values().collect();

    Ok(MultiBranchScopeSummary {
        branches,
        files,
        common_ancestor_hash,
        commits_truncated: any_truncated,
    })
}

fn resolve_ref_oid(repo: &git2::Repository, shorthand: &str) -> Option<git2::Oid> {
    repo.revparse_single(shorthand).ok().map(|obj| obj.id())
}

/// Com uma única ref: usar `merge_base` com uma branch de integração (`develop`, `main`, …) quando
/// existir, para não reduzir o escopo ao último commit quando `HEAD` coincide com o tip.
fn ancestor_for_single_branch_tip(
    repo: &git2::Repository,
    tip: git2::Oid,
) -> Result<git2::Oid, GitCommandError> {
    const INTEGRATION_HEADS: &[&str] = &["develop", "main", "master", "trunk"];

    for shorthand in INTEGRATION_HEADS {
        if let Some(other_tip) = resolve_ref_oid(repo, shorthand) {
            if let Ok(base) = repo.merge_base(other_tip, tip) {
                return Ok(base);
            }
        }
    }

    let head_oid = repo
        .head()
        .ok()
        .and_then(|h| h.peel_to_commit().ok().map(|c| c.id()));

    match head_oid {
        Some(h) if h != tip => repo.merge_base(h, tip).map_err(|e| {
            GitCommandError::io(format!(
                "não foi possível calcular o ancestral comum (HEAD vs branch): {}",
                e.message()
            ))
        }),
        _ => {
            let commit = repo
                .find_commit(tip)
                .map_err(|e| GitCommandError::io(e.message()))?;
            if commit.parent_count() > 0 {
                Ok(commit
                    .parent_id(0)
                    .map_err(|e| GitCommandError::io(e.message()))?)
            } else {
                Ok(tip)
            }
        }
    }
}

fn merge_files_into(acc: &mut BTreeMap<String, FileChangeRow>, incoming: Vec<FileChangeRow>) {
    for f in incoming {
        let key = f.path.clone();
        acc.entry(key)
            .and_modify(|existing| {
                existing.lines_added += f.lines_added;
                existing.lines_removed += f.lines_removed;
                if existing.status != f.status {
                    existing.status = FileChangeStatus::Modified;
                }
            })
            .or_insert(f);
    }
}

fn walk_commits(
    repo: &git2::Repository,
    base_oid: git2::Oid,
    compare_oid: git2::Oid,
) -> Result<(Vec<CommitRow>, bool), GitCommandError> {
    if base_oid == compare_oid {
        return Ok((vec![], false));
    }
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

    fn repo_two_feature_branches() -> (tempfile::TempDir, String) {
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
        let main_name = default_branch(tmp.path());

        Command::new("git")
            .args(["checkout", "-b", "feat-a"])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        fs::write(tmp.path().join("a.txt"), "a\n").unwrap();
        Command::new("git")
            .args(["add", "a.txt"])
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
                "feat: a",
            ])
            .current_dir(tmp.path())
            .status()
            .unwrap();

        Command::new("git")
            .args(["checkout", &main_name])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        Command::new("git")
            .args(["checkout", "-b", "feat-b"])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        fs::write(tmp.path().join("b.txt"), "b\n").unwrap();
        Command::new("git")
            .args(["add", "b.txt"])
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
                "feat: b",
            ])
            .current_dir(tmp.path())
            .status()
            .unwrap();

        (tmp, main_name)
    }

    #[test]
    fn multi_scope_empty_when_no_refs() {
        let (tmp, _) = repo_two_feature_branches();
        let path = tmp.path().to_string_lossy().to_string();
        let s = super::multi_branch_scope_summary(&path, vec![]).unwrap();
        assert!(s.branches.is_empty());
        assert!(s.files.is_empty());
        assert!(!s.commits_truncated);
    }

    #[test]
    fn multi_scope_two_branches_lists_each_and_merges_files() {
        let (tmp, _) = repo_two_feature_branches();
        let path = tmp.path().to_string_lossy().to_string();
        let s = super::multi_branch_scope_summary(&path, vec!["feat-a".into(), "feat-b".into()])
            .unwrap();
        assert_eq!(s.branches.len(), 2);
        assert_eq!(s.branches[0].commits.len(), 1);
        assert_eq!(s.branches[1].commits.len(), 1);
        assert!(s.common_ancestor_hash.is_some());
        assert!(
            s.files.iter().any(|f| f.path.ends_with("a.txt"))
                && s.files.iter().any(|f| f.path.ends_with("b.txt")),
            "files={:?}",
            s.files
        );
    }

    #[test]
    fn multi_scope_single_branch_uses_mainline_merge_base_when_head_on_branch() {
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
        let main_name = default_branch(tmp.path());

        Command::new("git")
            .args(["checkout", "-b", "feat-a"])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        fs::write(tmp.path().join("a.txt"), "a\n").unwrap();
        Command::new("git")
            .args(["add", "a.txt"])
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
                "feat: a1",
            ])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        fs::write(tmp.path().join("a.txt"), "a2\n").unwrap();
        Command::new("git")
            .args(["add", "a.txt"])
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
                "feat: a2",
            ])
            .current_dir(tmp.path())
            .status()
            .unwrap();

        let path = tmp.path().to_string_lossy().to_string();
        let s = super::multi_branch_scope_summary(&path, vec!["feat-a".into()]).unwrap();
        assert_eq!(s.branches.len(), 1, "mainline={main_name}");
        assert_eq!(
            s.branches[0].commits.len(),
            2,
            "com HEAD na própria branch, o escopo deve ir até {main_name}, não só o último commit"
        );
    }

    #[test]
    fn multi_scope_single_branch_uses_head_for_ancestor_when_diverged() {
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

        Command::new("git")
            .args(["checkout", "-b", "solo"])
            .current_dir(tmp.path())
            .status()
            .unwrap();
        fs::write(tmp.path().join("solo.txt"), "x\n").unwrap();
        Command::new("git")
            .args(["add", "solo.txt"])
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
                "feat: solo",
            ])
            .current_dir(tmp.path())
            .status()
            .unwrap();

        let path = tmp.path().to_string_lossy().to_string();
        let s = super::multi_branch_scope_summary(&path, vec!["solo".into()]).unwrap();
        assert_eq!(s.branches.len(), 1);
        assert_eq!(s.branches[0].commits.len(), 1);
        assert!(
            s.files.iter().any(|f| f.path.ends_with("solo.txt")),
            "files={:?}",
            s.files
        );
    }
}
