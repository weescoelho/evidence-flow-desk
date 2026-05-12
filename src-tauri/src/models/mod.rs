pub mod git;

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommandError {
    pub code: String,
    pub message: String,
}

impl GitCommandError {
    pub fn not_a_git_repository(message: impl Into<String>) -> Self {
        Self {
            code: "not_a_git_repository".to_string(),
            message: message.into(),
        }
    }

    pub fn permission_denied(message: impl Into<String>) -> Self {
        Self {
            code: "permission_denied".to_string(),
            message: message.into(),
        }
    }

    pub fn io(message: impl Into<String>) -> Self {
        Self {
            code: "io_error".to_string(),
            message: message.into(),
        }
    }
}
