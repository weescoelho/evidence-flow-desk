import { create } from "zustand";

import type {
  EvidenceAppPersistedSnapshot,
  PersistedEvidenceTemplate,
} from "../api/evidence-app-state.commands";

export type { PersistedEvidenceTemplate } from "../api/evidence-app-state.commands";

/** Id do template integrado (seed SQLite / fallback). */
export const DEFAULT_BUILTIN_TEMPLATE_ID = "default";

/** Quando SQLite ainda não respondeu (ex.: testes Vitest). */
export const FALLBACK_EVIDENCE_TEMPLATES: PersistedEvidenceTemplate[] = [
  {
    id: DEFAULT_BUILTIN_TEMPLATE_ID,
    label: "Homologação — padrão enterprise",
    isBuiltin: true,
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
  exportDefaultDirectory: string | null;

  setTemplates: (templates: PersistedEvidenceTemplate[]) => void;
  setActiveTemplateId: (id: string) => void;
  setChangeId: (value: string) => void;
  setEnvironment: (value: string) => void;
  setExportDefaultDirectory: (path: string | null) => void;

  hydrateFromSnapshot: (snapshot: EvidenceAppPersistedSnapshot) => void;
  hydrateFallbackLocal: () => void;
  resetSession: () => void;
};

function normalizeTemplates(
  list: PersistedEvidenceTemplate[] | undefined,
): PersistedEvidenceTemplate[] {
  if (list?.length) {
    return list;
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
    exportDefaultDirectory: null,

    setTemplates: (templates) =>
      set((s) => {
        const next = normalizeTemplates(templates);
        const activeTemplateId = resolveActiveId(s.activeTemplateId, next);
        return { templates: next, activeTemplateId };
      }),

    setActiveTemplateId: (activeTemplateId) => set({ activeTemplateId }),

    setChangeId: (changeId) => set({ changeId }),
    setEnvironment: (environment) => set({ environment }),
    setExportDefaultDirectory: (exportDefaultDirectory) =>
      set({ exportDefaultDirectory }),

    hydrateFromSnapshot: (snapshot) => {
      const templates = normalizeTemplates(snapshot.templates);
      const prefs = snapshot.preferences;
      const activeTemplateId = resolveActiveId(
        prefs.evidenceActiveTemplateId ?? undefined,
        templates,
      );
      set({
        hydrated: true,
        templates,
        activeTemplateId,
        changeId: prefs.evidenceChangeId ?? "",
        environment: prefs.evidenceEnvironment ?? "",
        exportDefaultDirectory: prefs.exportDefaultDirectory ?? null,
      });
    },

    hydrateFallbackLocal: () => {
      set({
        hydrated: true,
        templates: [...FALLBACK_EVIDENCE_TEMPLATES],
        activeTemplateId: DEFAULT_BUILTIN_TEMPLATE_ID,
        changeId: "",
        environment: "",
        exportDefaultDirectory: null,
      });
    },

    resetSession: () =>
      set((state) => ({
        activeTemplateId: DEFAULT_BUILTIN_TEMPLATE_ID,
        changeId: "",
        environment: "",
        exportDefaultDirectory: null,
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
