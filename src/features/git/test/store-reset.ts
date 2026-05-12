import { useEvidenceMetadataStore } from "@/features/document";
import { useEvidenceAttachmentsStore } from "@/features/evidence";

import { useGitStore } from "../store/git-store";

export function resetGitStore() {
  useEvidenceMetadataStore.getState().resetSession();
  useGitStore.setState({
    repositoryPath: null,
    validationError: null,
    errorCode: null,
    branches: [],
    headDisplay: "",
    detached: false,
    recentRepos: [],
    branchFilter: "",
    baseBranch: null,
    compareBranch: null,
  });
  useEvidenceAttachmentsStore.getState().clear();
}
