import { invoke } from "@tauri-apps/api/core";

export type SaveEvidenceDocumentResult = {
  id: string;
  htmlPath: string;
};

export type SavedEvidenceDocumentInfo = {
  id: string;
  savedAtMs: number;
  repositoryPath: string;
  baseRef: string;
  compareRef: string;
  htmlPath: string;
};

export function saveEvidenceDocument(args: {
  html: string;
  repositoryPath: string;
  baseRef: string;
  compareRef: string;
}) {
  return invoke<SaveEvidenceDocumentResult>("save_evidence_document", {
    html: args.html,
    repositoryPath: args.repositoryPath,
    baseRef: args.baseRef,
    compareRef: args.compareRef,
  });
}

export function listSavedEvidenceDocuments() {
  return invoke<SavedEvidenceDocumentInfo[]>("list_saved_evidence_documents");
}
