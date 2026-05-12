import { create } from "zustand";

import type { CommitRow } from "@/features/git/types/git";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_EVIDENCE_SCREENSHOTS,
  MAX_SCREENSHOT_FILE_BYTES,
  type EvidenceScreenshot,
} from "../types";

type AttachmentsState = {
  scopeCommits: CommitRow[];
  attachments: EvidenceScreenshot[];

  setScopeCommits: (commits: CommitRow[]) => void;
  /**
   * Valida ficheiros síncrono; leitura assíncrona acumula no fim.
   * Devolve avisos (tipo/tamanho/limite); erros de leitura aparecem no estado `lastAddError`.
   */
  addFromFiles: (files: File[]) => string[];
  remove: (id: string) => void;
  updateCaption: (id: string, caption: string) => void;
  updateLinkedCommit: (id: string, hash: string | null) => void;
  clear: () => void;
  lastAddError: string | null;
  clearLastAddError: () => void;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const useEvidenceAttachmentsStore = create<AttachmentsState>((set, get) => ({
  scopeCommits: [],
  attachments: [],
  lastAddError: null,

  clearLastAddError: () => set({ lastAddError: null }),

  setScopeCommits: (scopeCommits) => set({ scopeCommits }),

  addFromFiles: (files) => {
    const errors: string[] = [];
    set({ lastAddError: null });

    const attachments = get().attachments;
    let room = MAX_EVIDENCE_SCREENSHOTS - attachments.length;
    if (room <= 0) {
      return [`Limite de ${MAX_EVIDENCE_SCREENSHOTS} imagens atingido.`];
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (room <= 0) {
        errors.push("Alguns ficheiros foram ignorados — limite de imagens.");
        break;
      }
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        errors.push(
          `Ignorado (${file.name}): tipo não suportado (use PNG, JPEG, WebP ou GIF).`,
        );
        continue;
      }
      if (file.size > MAX_SCREENSHOT_FILE_BYTES) {
        errors.push(
          `Ignorado (${file.name}): ficheiro excede ${MAX_SCREENSHOT_FILE_BYTES / (1024 * 1024)} MB.`,
        );
        continue;
      }
      validFiles.push(file);
      room--;
    }

    if (validFiles.length === 0) {
      return errors;
    }

    void Promise.all(validFiles.map((f) => readFileAsDataUrl(f)))
      .then((urls) => {
        const newShots: EvidenceScreenshot[] = urls.map((dataUrl, i) => ({
          id: crypto.randomUUID(),
          fileName: validFiles[i]!.name,
          dataUrl,
          caption: "",
          linkedCommitHash: null,
        }));
        set((state) => ({
          attachments: [...state.attachments, ...newShots].slice(
            0,
            MAX_EVIDENCE_SCREENSHOTS,
          ),
        }));
      })
      .catch(() => {
        set({ lastAddError: "Não foi possível ler um ou mais ficheiros." });
      });

    return errors;
  },

  remove: (id) =>
    set((s) => ({
      attachments: s.attachments.filter((a) => a.id !== id),
    })),

  updateCaption: (id, caption) =>
    set((s) => ({
      attachments: s.attachments.map((a) =>
        a.id === id ? { ...a, caption } : a,
      ),
    })),

  updateLinkedCommit: (id, hash) =>
    set((s) => ({
      attachments: s.attachments.map((a) =>
        a.id === id ? { ...a, linkedCommitHash: hash } : a,
      ),
    })),

  clear: () =>
    set({ attachments: [], scopeCommits: [], lastAddError: null }),
}));
