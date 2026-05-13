import { invoke } from "@tauri-apps/api/core";

/** Chaves estáveis na BD SQLite (mirror de `src-tauri/services/evidence_app_state.rs`). */
export const evidencePreferenceKeys = {
  exportDefaultDirectory: "export.default_directory",
  activeTemplateId: "evidence.active_template_id",
  changeId: "evidence.change_id",
  environment: "evidence.environment",
  productName: "evidence.product_name",
  releaseVersion: "evidence.release_version",
  deploymentDate: "evidence.deployment_date",
  technicalOwner: "evidence.technical_owner",
  approver: "evidence.approver",
  outOfScope: "evidence.out_of_scope",
  documentVersion: "evidence.document_version",
  documentRevisionDate: "evidence.document_revision_date",
  documentRevisionSummary: "evidence.document_revision_summary",
  documentRevisionAuthor: "evidence.document_revision_author",
  aiGeminiApiKey: "ai.gemini.api_key",
  aiGeminiModel: "ai.gemini.model",
  aiGeminiApiBase: "ai.gemini.api_base",
} as const;

/** Por defeito: Google AI (AI Studio). */
export const DEFAULT_GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
export const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";

export type PersistedEvidenceTemplate = {
  id: string;
  label: string;
  isBuiltin: boolean;
  /** Variante visual do documento (`enterprise` | `minimal` | `audit`). */
  layoutKey?: string;
  /** Data URLs gravadas por template — faixa no topo do PDF/HTML. */
  headerImageLeft?: string | null;
  headerImageRight?: string | null;
};

export type EvidencePreferencesSnapshot = {
  exportDefaultDirectory?: string | null;
  evidenceActiveTemplateId?: string | null;
  evidenceChangeId?: string | null;
  evidenceEnvironment?: string | null;
  evidenceProductName?: string | null;
  evidenceReleaseVersion?: string | null;
  evidenceDeploymentDate?: string | null;
  evidenceTechnicalOwner?: string | null;
  evidenceApprover?: string | null;
  evidenceOutOfScope?: string | null;
  evidenceDocumentVersion?: string | null;
  evidenceDocumentRevisionDate?: string | null;
  evidenceDocumentRevisionSummary?: string | null;
  evidenceDocumentRevisionAuthor?: string | null;
  aiGeminiApiBase?: string | null;
  aiGeminiModel?: string | null;
  aiGeminiApiKeyConfigured?: boolean;
};

export type EvidenceAppPersistedSnapshot = {
  preferences: EvidencePreferencesSnapshot;
  templates: PersistedEvidenceTemplate[];
};

export type CreateEvidenceTemplateResult = {
  id: string;
  label: string;
  isBuiltin: boolean;
  layoutKey: string;
};

export function loadEvidenceAppPersistedState() {
  return invoke<EvidenceAppPersistedSnapshot>("load_evidence_app_persisted_state");
}

export function setEvidencePreference(key: string, value: string) {
  return invoke<void>("set_evidence_preference", { key, value });
}

export function createEvidenceCustomTemplate(
  label: string,
  layoutKey?: string | null,
) {
  return invoke<CreateEvidenceTemplateResult>("create_evidence_custom_template", {
    label,
    layoutKey: layoutKey ?? null,
  });
}

export function setEvidenceTemplateLayout(templateId: string, layoutKey: string) {
  return invoke<void>("set_evidence_template_layout", {
    templateId,
    layoutKey,
  });
}

export function setEvidenceTemplateHeaderImages(
  templateId: string,
  headerImageLeft: string,
  headerImageRight: string,
) {
  return invoke<void>("set_evidence_template_header_images", {
    templateId,
    headerImageLeft,
    headerImageRight,
  });
}

export function deleteEvidenceCustomTemplate(id: string) {
  return invoke<void>("delete_evidence_custom_template", { id });
}

/** RF-007 / RNF-002 — Google Gemini; só na acção explícita do utilizador. */
export function llmGenerateCorporateSummary(technicalSummary: string, tone: string) {
  return invoke<string>("llm_generate_corporate_summary", {
    technicalSummary,
    tone,
  });
}

export function llmRewriteTechnicalSummary(technicalSummary: string, tone: string) {
  return invoke<string>("llm_rewrite_technical_summary", {
    technicalSummary,
    tone,
  });
}
