import { create } from "zustand";

/** MVP: único template; rótulos alinhados ao design (`product-ui-journey` UI-R03). */
export const TEMPLATE_OPTIONS = [
  { id: "default", label: "Homologação — padrão enterprise" },
] as const;

export type EvidenceTemplateId = (typeof TEMPLATE_OPTIONS)[number]["id"];

type EvidenceMetadataStore = {
  activeTemplateId: EvidenceTemplateId;
  changeId: string;
  environment: string;
  setActiveTemplateId: (id: EvidenceTemplateId) => void;
  setChangeId: (v: string) => void;
  setEnvironment: (v: string) => void;
  /** Limpa campos de sessão (ex.: troca de repositório); mantém template padrão. */
  resetSession: () => void;
};

export const useEvidenceMetadataStore = create<EvidenceMetadataStore>(
  (set) => ({
    activeTemplateId: "default",
    changeId: "",
    environment: "",
    setActiveTemplateId: (activeTemplateId) => set({ activeTemplateId }),
    setChangeId: (changeId) => set({ changeId }),
    setEnvironment: (environment) => set({ environment }),
    resetSession: () =>
      set({
        activeTemplateId: "default",
        changeId: "",
        environment: "",
      }),
  }),
);

export function activeTemplateLabel(id: EvidenceTemplateId): string {
  const o = TEMPLATE_OPTIONS.find((t) => t.id === id);
  return o?.label ?? id;
}
