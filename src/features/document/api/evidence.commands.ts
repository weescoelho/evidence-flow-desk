import { invoke } from "@tauri-apps/api/core";

export type SaveEvidenceDocumentResult = {
  id: string;
  htmlPath: string;
};

export type SavedEvidenceDocumentInfo = {
  id: string;
  savedAtMs: number;
  repositoryPath: string;
  /** Legado escopo base→compare; vazio em registos novos. */
  baseRef: string;
  compareRef: string;
  branchRefs?: string[];
  htmlPath: string;
  templateLabel?: string | null;
  changeId?: string | null;
  environment?: string | null;
  documentTitle?: string | null;
  hasDraft: boolean;
};

export type LoadEvidenceDocumentDraftResult = {
  draftJson: string;
  htmlPath: string;
};

export function saveEvidenceDocument(args: {
  html: string;
  repositoryPath: string;
  branchRefs: string[];
  templateLabel?: string | null;
  changeId?: string | null;
  environment?: string | null;
  documentTitle?: string | null;
  draftJson?: string | null;
}) {
  return invoke<SaveEvidenceDocumentResult>("save_evidence_document", {
    html: args.html,
    repositoryPath: args.repositoryPath,
    branchRefs: args.branchRefs,
    templateLabel: args.templateLabel ?? null,
    changeId: args.changeId ?? null,
    environment: args.environment ?? null,
    documentTitle: args.documentTitle ?? null,
    draftJson: args.draftJson ?? null,
  });
}

export function loadEvidenceDocumentDraft(id: string) {
  return invoke<LoadEvidenceDocumentDraftResult>("load_evidence_document_draft", {
    id,
  });
}

export function listSavedEvidenceDocuments() {
  return invoke<SavedEvidenceDocumentInfo[]>("list_saved_evidence_documents");
}

export function deleteSavedEvidenceDocument(id: string) {
  return invoke<void>("delete_saved_evidence_document", { id });
}
