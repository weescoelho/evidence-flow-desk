use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateGitRepositoryResponse {
    pub canonical_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitBranchRow {
    pub name: String,
    pub is_head: bool,
    pub is_remote: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListBranchesResponse {
    pub branches: Vec<GitBranchRow>,
    pub head_display: String,
    pub detached: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitRow {
    pub hash: String,
    pub short_hash: String,
    pub author_name: String,
    pub author_email: String,
    pub committed_at_unix: i64,
    pub summary: String,
    pub message: String,
    pub conventional_type: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum FileChangeStatus {
    Added,
    Deleted,
    Modified,
    Renamed,
    Copied,
    Other,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChangeRow {
    pub path: String,
    pub path_before: Option<String>,
    pub path_after: Option<String>,
    pub status: FileChangeStatus,
    pub lines_added: usize,
    pub lines_removed: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchScopeEntry {
    pub branch_ref: String,
    pub commits: Vec<CommitRow>,
    pub commits_truncated: bool,
}

/// Escopo agregado a partir de N branches (ancestral comum automático).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiBranchScopeSummary {
    pub branches: Vec<BranchScopeEntry>,
    pub files: Vec<FileChangeRow>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub common_ancestor_hash: Option<String>,
    /// `true` se qualquer entrada de branch atingiu o limite de commits.
    pub commits_truncated: bool,
}
