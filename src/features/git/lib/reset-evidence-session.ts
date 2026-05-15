import { usePendingEvidenceNarrativesStore } from "@/features/document/store/pending-evidence-narratives-store";
import { useEvidenceMetadataStore } from "@/features/document/store/evidence-metadata-store";
import { useEvidenceAttachmentsStore } from "@/features/evidence/store/attachments-store";

import { useGitStore } from "../store/git-store";

/** Repõe Git, metadados de sessão do relatório, anexos e pending de narrativas para uma evidência nova. */
export function resetEvidenceSession(): void {
  usePendingEvidenceNarrativesStore.getState().clearPending();
  useEvidenceMetadataStore.getState().resetSession();
  useGitStore.setState({
    repositoryPath: null,
    validationError: null,
    errorCode: null,
    branches: [],
    headDisplay: "",
    detached: false,
    recentRepos: useGitStore.getState().recentRepos,
    branchFilter: "",
    selectedBranches: [],
  });
  useEvidenceAttachmentsStore.getState().clear();
}
