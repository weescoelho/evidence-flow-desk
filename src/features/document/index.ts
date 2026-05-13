export {
  EvidenceDocumentPreview,
  type EvidenceDocumentPreviewProps,
} from "./components/evidence-document-preview";
export { EvidenceDocumentMetadataSection } from "./components/evidence-document-metadata-section";
export { useEvidencePreferenceSync } from "./hooks/use-evidence-preference-sync";
export { useHydrateEvidenceAppState } from "./hooks/use-hydrate-evidence-app-state";
export {
  DEFAULT_BUILTIN_TEMPLATE_ID,
  FALLBACK_EVIDENCE_TEMPLATES,
  useEvidenceMetadataStore,
  activeTemplateLabel,
  type EvidenceTemplateId,
} from "./store/evidence-metadata-store";
export { SavedEvidenceDocumentsPanel } from "./components/saved-evidence-documents-panel";
export { EvidenceDocumentsLibraryView } from "./components/evidence-documents-library-view";
export { EvidenceAppSettingsView } from "./components/evidence-app-settings-view";
export { EvidenceTemplatesLibraryView } from "./components/evidence-templates-library-view";
export { EvidenceScreenshotsPlaceholderView } from "./components/evidence-screenshots-placeholder-view";
export {
  buildEvidenceBodyHtml,
  buildEvidencePrintHtml,
  wrapPrintDocument,
  type EvidenceDocumentPayload,
  type EvidenceScreenshotPayload,
  type EvidencePrintHtmlOptions,
} from "./lib/build-evidence-html";
export { printHtmlDocument } from "./lib/print-html";
export { writeTextFile } from "./api/io.commands";
export {
  deleteSavedEvidenceDocument,
  listSavedEvidenceDocuments,
  saveEvidenceDocument,
  type SaveEvidenceDocumentResult,
  type SavedEvidenceDocumentInfo,
} from "./api/evidence.commands";
