import { create } from "zustand";

/** Narrativas a aplicar quando `useRepositoryScopeSummary` tiver `data` carregado (carregar rascunho). */
type PendingEvidenceNarrativesStore = {
  pending: { technical: string; corporate: string } | null;
  setPending: (technical: string, corporate: string) => void;
  clearPending: () => void;
};

export const usePendingEvidenceNarrativesStore = create<PendingEvidenceNarrativesStore>(
  (set) => ({
    pending: null,
    setPending: (technical, corporate) => set({ pending: { technical, corporate } }),
    clearPending: () => set({ pending: null }),
  }),
);
