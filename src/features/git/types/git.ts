export type GitCommandErrorPayload = {
  code: string;
  message: string;
};

export type ValidateGitRepositoryResponse = {
  canonicalPath: string;
};

export type GitBranchRow = {
  name: string;
  isHead: boolean;
  isRemote: boolean;
};

export type ListBranchesResponse = {
  branches: GitBranchRow[];
  headDisplay: string;
  detached: boolean;
};

export type CommitRow = {
  hash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  committedAtUnix: number;
  summary: string;
  message: string;
  conventionalType: string | null;
};

export type FileChangeStatus =
  | "added"
  | "deleted"
  | "modified"
  | "renamed"
  | "copied"
  | "other";

export type FileChangeRow = {
  path: string;
  pathBefore: string | null;
  pathAfter: string | null;
  status: FileChangeStatus;
  linesAdded: number;
  linesRemoved: number;
};

export type BranchScopeEntry = {
  branchRef: string;
  commits: CommitRow[];
  commitsTruncated: boolean;
};

export type MultiBranchScopeSummary = {
  branches: BranchScopeEntry[];
  files: FileChangeRow[];
  commonAncestorHash?: string;
  commitsTruncated: boolean;
};
