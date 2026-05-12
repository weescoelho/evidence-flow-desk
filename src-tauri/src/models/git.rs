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

#[derive(Debug, Clone, Serialize)]
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
pub struct RepositoryScopeSummary {
    pub commits: Vec<CommitRow>,
    pub files: Vec<FileChangeRow>,
    pub commits_truncated: bool,
}
