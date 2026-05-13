import { create } from "zustand";

/**
 * Permite que outras vistas (ex.: Documentos) peçam ao assistente «Nova evidência»
 * que salte para um passo após carregar um rascunho.
 */
type EvidenceWizardUiStore = {
  jumpToStep: number | null;
  requestJumpToStep: (step: number) => void;
  clearJump: () => void;
};

export const useEvidenceWizardUiStore = create<EvidenceWizardUiStore>((set) => ({
  jumpToStep: null,
  requestJumpToStep: (step) => set({ jumpToStep: step }),
  clearJump: () => set({ jumpToStep: null }),
}));
