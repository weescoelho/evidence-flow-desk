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
  templateLabel?: string | null;
  changeId?: string | null;
  environment?: string | null;
  documentTitle?: string | null;
};

export function saveEvidenceDocument(args: {
  html: string;
  repositoryPath: string;
  baseRef: string;
  compareRef: string;
  templateLabel?: string | null;
  changeId?: string | null;
  environment?: string | null;
  documentTitle?: string | null;
}) {
  return invoke<SaveEvidenceDocumentResult>("save_evidence_document", {
    html: args.html,
    repositoryPath: args.repositoryPath,
    baseRef: args.baseRef,
    compareRef: args.compareRef,
    templateLabel: args.templateLabel ?? null,
    changeId: args.changeId ?? null,
    environment: args.environment ?? null,
    documentTitle: args.documentTitle ?? null,
  });
}

export function listSavedEvidenceDocuments() {
  return invoke<SavedEvidenceDocumentInfo[]>("list_saved_evidence_documents");
}

export function deleteSavedEvidenceDocument(id: string) {
  return invoke<void>("delete_saved_evidence_document", { id });
}
