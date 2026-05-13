import { invoke } from "@tauri-apps/api/core";

/** Chaves estáveis na BD SQLite (mirror de `src-tauri/services/evidence_app_state.rs`). */
export const evidencePreferenceKeys = {
  exportDefaultDirectory: "export.default_directory",
  activeTemplateId: "evidence.active_template_id",
  changeId: "evidence.change_id",
  environment: "evidence.environment",
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
};

export type EvidencePreferencesSnapshot = {
  exportDefaultDirectory?: string | null;
  evidenceActiveTemplateId?: string | null;
  evidenceChangeId?: string | null;
  evidenceEnvironment?: string | null;
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
};

export function loadEvidenceAppPersistedState() {
  return invoke<EvidenceAppPersistedSnapshot>("load_evidence_app_persisted_state");
}

export function setEvidencePreference(key: string, value: string) {
  return invoke<void>("set_evidence_preference", { key, value });
}

export function createEvidenceCustomTemplate(label: string) {
  return invoke<CreateEvidenceTemplateResult>("create_evidence_custom_template", {
    label,
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
