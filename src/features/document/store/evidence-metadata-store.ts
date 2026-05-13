import { create } from "zustand";

import type {
  EvidenceAppPersistedSnapshot,
  PersistedEvidenceTemplate,
} from "../api/evidence-app-state.commands";
import {
  DEFAULT_GEMINI_API_BASE,
  DEFAULT_GEMINI_MODEL,
  evidencePreferenceKeys,
  setEvidencePreference,
} from "../api/evidence-app-state.commands";
import {
  normalizeDocumentRevisionRow,
  parseDocumentRevisionHistoryJson,
  revisionRowsAreEqual,
  serializeDocumentRevisionHistory,
  MAX_DOCUMENT_REVISION_HISTORY_ROWS,
  type DocumentRevisionRow,
} from "../lib/document-revision-history";
import {
  normalizeEvidenceTemplateLayoutKey,
  type EvidenceTemplateLayoutKey,
} from "../lib/evidence-template-layouts";

export type { DocumentRevisionRow };

export type { PersistedEvidenceTemplate } from "../api/evidence-app-state.commands";

/** Id do template integrado (seed SQLite / fallback). */
export const DEFAULT_BUILTIN_TEMPLATE_ID = "default";

/** Quando SQLite ainda não respondeu (ex.: testes Vitest). */
export const FALLBACK_EVIDENCE_TEMPLATES: PersistedEvidenceTemplate[] = [
  {
    id: DEFAULT_BUILTIN_TEMPLATE_ID,
    label: "Homologação — padrão mercado (IEEE / ITIL)",
    isBuiltin: true,
    layoutKey: "market_standard",
  },
];

/** Alias semântico para ids de template vindos do servidor. */
export type EvidenceTemplateId = string;

type EvidenceMetadataStore = {
  /** `true` após hidratação Tauri ou fallback local (evita gravar defaults por cima). */
  hydrated: boolean;
  templates: PersistedEvidenceTemplate[];
  activeTemplateId: string;
  changeId: string;
  environment: string;
  productName: string;
  releaseVersion: string;
  deploymentDate: string;
  technicalOwner: string;
  approver: string;
  outOfScope: string;
  documentVersion: string;
  documentRevisionDate: string;
  documentRevisionSummary: string;
  documentRevisionAuthor: string;
  /** Revisões já registadas para a tabela «Controle de versões» (RF HTML mercado). */
  documentRevisionHistory: DocumentRevisionRow[];
  exportDefaultDirectory: string | null;
  /** Google Gemini (RF-017) — chave na BD, não no estado React. */
  aiGeminiApiBase: string;
  aiGeminiModel: string;
  aiGeminiApiKeyConfigured: boolean;

  setTemplates: (templates: PersistedEvidenceTemplate[]) => void;
  setActiveTemplateId: (id: string) => void;
  setChangeId: (value: string) => void;
  setEnvironment: (value: string) => void;
  setProductName: (value: string) => void;
  setReleaseVersion: (value: string) => void;
  setDeploymentDate: (value: string) => void;
  setTechnicalOwner: (value: string) => void;
  setApprover: (value: string) => void;
  setOutOfScope: (value: string) => void;
  setDocumentVersion: (value: string) => void;
  setDocumentRevisionDate: (value: string) => void;
  setDocumentRevisionSummary: (value: string) => void;
  setDocumentRevisionAuthor: (value: string) => void;
  setDocumentRevisionHistory: (rows: DocumentRevisionRow[]) => void;
  setExportDefaultDirectory: (path: string | null) => void;
  setAiGeminiApiBase: (value: string) => void;
  setAiGeminiModel: (value: string) => void;
  setAiGeminiApiKeyConfigured: (value: boolean) => void;

  hydrateFromSnapshot: (snapshot: EvidenceAppPersistedSnapshot) => void;
  hydrateFallbackLocal: () => void;
  resetSession: () => void;
};

function resolveDocumentRevisionHistoryFromPreferences(
  prefs: EvidenceAppPersistedSnapshot["preferences"],
): { rows: DocumentRevisionRow[]; seedToSqlite: boolean } {
  const fromKey = parseDocumentRevisionHistoryJson(
    prefs.evidenceDocumentRevisionHistory ?? undefined,
  );
  if (fromKey.length > 0) {
    return { rows: fromKey, seedToSqlite: false };
  }
  const v = (prefs.evidenceDocumentVersion ?? "").trim();
  const d = (prefs.evidenceDocumentRevisionDate ?? "").trim();
  const sum = (prefs.evidenceDocumentRevisionSummary ?? "").trim();
  const a = (prefs.evidenceDocumentRevisionAuthor ?? "").trim();
  if (v || d || sum || a) {
    return {
      rows: [{ version: v, date: d, summary: sum, author: a }],
      seedToSqlite: true,
    };
  }
  return { rows: [], seedToSqlite: false };
}

/**
 * Grava em `documentRevisionHistory` a revisão correspondente aos quatro campos atuais,
 * se não for duplicada da última entrada. Usar após exportar/gravar HTML ou PDF.
 */
export function commitCurrentDocumentRevisionToHistory(): boolean {
  const s = useEvidenceMetadataStore.getState();
  const row = normalizeDocumentRevisionRow({
    version: s.documentVersion,
    date: s.documentRevisionDate,
    summary: s.documentRevisionSummary,
    author: s.documentRevisionAuthor,
  });
  if (!row.version && !row.date && !row.summary && !row.author) {
    return false;
  }
  const hist = s.documentRevisionHistory;
  const last = hist[hist.length - 1];
  if (last && revisionRowsAreEqual(last, row)) {
    return false;
  }
  const next = [...hist, row].slice(-MAX_DOCUMENT_REVISION_HISTORY_ROWS);
  s.setDocumentRevisionHistory(next);
  if (s.hydrated) {
    void setEvidencePreference(
      evidencePreferenceKeys.documentRevisionHistory,
      serializeDocumentRevisionHistory(next),
    );
  }
  return true;
}

function normalizeTemplates(
  list: PersistedEvidenceTemplate[] | undefined,
): PersistedEvidenceTemplate[] {
  if (list?.length) {
    return list.map((t) => ({
      ...t,
      layoutKey: normalizeEvidenceTemplateLayoutKey(t.layoutKey),
    }));
  }
  return [...FALLBACK_EVIDENCE_TEMPLATES];
}

function resolveActiveId(
  requested: string | null | undefined,
  templates: PersistedEvidenceTemplate[],
): string {
  const id =
    typeof requested === "string" && requested.trim().length > 0
      ? requested.trim()
      : DEFAULT_BUILTIN_TEMPLATE_ID;
  if (templates.some((t) => t.id === id)) return id;
  return DEFAULT_BUILTIN_TEMPLATE_ID;
}

export const useEvidenceMetadataStore = create<EvidenceMetadataStore>(
  (set) => ({
    hydrated: false,
    templates: [...FALLBACK_EVIDENCE_TEMPLATES],
    activeTemplateId: DEFAULT_BUILTIN_TEMPLATE_ID,
    changeId: "",
    environment: "",
    productName: "",
    releaseVersion: "",
    deploymentDate: "",
    technicalOwner: "",
    approver: "",
    outOfScope: "",
    documentVersion: "",
    documentRevisionDate: "",
    documentRevisionSummary: "",
    documentRevisionAuthor: "",
    documentRevisionHistory: [],
    exportDefaultDirectory: null,
    aiGeminiApiBase: DEFAULT_GEMINI_API_BASE,
    aiGeminiModel: DEFAULT_GEMINI_MODEL,
    aiGeminiApiKeyConfigured: false,

    setTemplates: (templates) =>
      set((s) => {
        const next = normalizeTemplates(templates);
        const activeTemplateId = resolveActiveId(s.activeTemplateId, next);
        return { templates: next, activeTemplateId };
      }),

    setActiveTemplateId: (activeTemplateId) => set({ activeTemplateId }),

    setChangeId: (changeId) => set({ changeId }),
    setEnvironment: (environment) => set({ environment }),
    setProductName: (productName) => set({ productName }),
    setReleaseVersion: (releaseVersion) => set({ releaseVersion }),
    setDeploymentDate: (deploymentDate) => set({ deploymentDate }),
    setTechnicalOwner: (technicalOwner) => set({ technicalOwner }),
    setApprover: (approver) => set({ approver }),
    setOutOfScope: (outOfScope) => set({ outOfScope }),
    setDocumentVersion: (documentVersion) => set({ documentVersion }),
    setDocumentRevisionDate: (documentRevisionDate) =>
      set({ documentRevisionDate }),
    setDocumentRevisionSummary: (documentRevisionSummary) =>
      set({ documentRevisionSummary }),
    setDocumentRevisionAuthor: (documentRevisionAuthor) =>
      set({ documentRevisionAuthor }),
    setDocumentRevisionHistory: (documentRevisionHistory) =>
      set({ documentRevisionHistory }),
    setExportDefaultDirectory: (exportDefaultDirectory) =>
      set({ exportDefaultDirectory }),
    setAiGeminiApiBase: (aiGeminiApiBase) => set({ aiGeminiApiBase }),
    setAiGeminiModel: (aiGeminiModel) => set({ aiGeminiModel }),
    setAiGeminiApiKeyConfigured: (aiGeminiApiKeyConfigured) =>
      set({ aiGeminiApiKeyConfigured }),

    hydrateFromSnapshot: (snapshot) => {
      const templates = normalizeTemplates(snapshot.templates);
      const prefs = snapshot.preferences;
      const activeTemplateId = resolveActiveId(
        prefs.evidenceActiveTemplateId ?? undefined,
        templates,
      );
      const { rows: documentRevisionHistory, seedToSqlite } =
        resolveDocumentRevisionHistoryFromPreferences(prefs);
      set({
        hydrated: true,
        templates,
        activeTemplateId,
        changeId: prefs.evidenceChangeId ?? "",
        environment: prefs.evidenceEnvironment ?? "",
        productName: prefs.evidenceProductName ?? "",
        releaseVersion: prefs.evidenceReleaseVersion ?? "",
        deploymentDate: prefs.evidenceDeploymentDate ?? "",
        technicalOwner: prefs.evidenceTechnicalOwner ?? "",
        approver: prefs.evidenceApprover ?? "",
        outOfScope: prefs.evidenceOutOfScope ?? "",
        documentVersion: prefs.evidenceDocumentVersion ?? "",
        documentRevisionDate: prefs.evidenceDocumentRevisionDate ?? "",
        documentRevisionSummary: prefs.evidenceDocumentRevisionSummary ?? "",
        documentRevisionAuthor: prefs.evidenceDocumentRevisionAuthor ?? "",
        documentRevisionHistory,
        exportDefaultDirectory: prefs.exportDefaultDirectory ?? null,
        aiGeminiApiBase:
          prefs.aiGeminiApiBase?.trim() || DEFAULT_GEMINI_API_BASE,
        aiGeminiModel: prefs.aiGeminiModel?.trim() || DEFAULT_GEMINI_MODEL,
        aiGeminiApiKeyConfigured: prefs.aiGeminiApiKeyConfigured ?? false,
      });
      if (seedToSqlite && documentRevisionHistory.length > 0) {
        void setEvidencePreference(
          evidencePreferenceKeys.documentRevisionHistory,
          serializeDocumentRevisionHistory(documentRevisionHistory),
        );
      }
    },

    hydrateFallbackLocal: () => {
      set({
        hydrated: true,
        templates: [...FALLBACK_EVIDENCE_TEMPLATES],
        activeTemplateId: DEFAULT_BUILTIN_TEMPLATE_ID,
        changeId: "",
        environment: "",
        productName: "",
        releaseVersion: "",
        deploymentDate: "",
        technicalOwner: "",
        approver: "",
        outOfScope: "",
        documentVersion: "",
        documentRevisionDate: "",
        documentRevisionSummary: "",
        documentRevisionAuthor: "",
        documentRevisionHistory: [],
        exportDefaultDirectory: null,
        aiGeminiApiBase: DEFAULT_GEMINI_API_BASE,
        aiGeminiModel: DEFAULT_GEMINI_MODEL,
        aiGeminiApiKeyConfigured: false,
      });
    },

    resetSession: () =>
      set((state) => ({
        activeTemplateId: DEFAULT_BUILTIN_TEMPLATE_ID,
        changeId: "",
        environment: "",
        productName: "",
        releaseVersion: "",
        deploymentDate: "",
        technicalOwner: "",
        approver: "",
        outOfScope: "",
        documentVersion: "",
        documentRevisionDate: "",
        documentRevisionSummary: "",
        documentRevisionAuthor: "",
        documentRevisionHistory: [],
        exportDefaultDirectory: null,
        aiGeminiApiBase: state.aiGeminiApiBase,
        aiGeminiModel: state.aiGeminiModel,
        aiGeminiApiKeyConfigured: state.aiGeminiApiKeyConfigured,
        templates:
          state.templates.length > 0
            ? state.templates
            : [...FALLBACK_EVIDENCE_TEMPLATES],
      })),
  }),
);

/** Rótulo do template para o HTML/PDF. */
export function activeTemplateLabel(id: string): string {
  const t = useEvidenceMetadataStore.getState().templates.find((x) => x.id === id);
  return t?.label ?? id;
}

/** Chave de layout persistida no template para o gerador HTML/PDF. */
export function activeTemplateLayoutKey(id: string): EvidenceTemplateLayoutKey {
  const t = useEvidenceMetadataStore.getState().templates.find((x) => x.id === id);
  return normalizeEvidenceTemplateLayoutKey(t?.layoutKey);
}
