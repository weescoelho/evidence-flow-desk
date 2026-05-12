import { invoke } from "@tauri-apps/api/core";

/** Chaves estáveis na BD SQLite (mirror de `src-tauri/services/evidence_app_state.rs`). */
export const evidencePreferenceKeys = {
  exportDefaultDirectory: "export.default_directory",
  activeTemplateId: "evidence.active_template_id",
  changeId: "evidence.change_id",
  environment: "evidence.environment",
} as const;

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
