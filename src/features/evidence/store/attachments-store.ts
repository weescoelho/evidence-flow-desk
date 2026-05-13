import { create } from "zustand";

import { useGitStore } from "@/features/git/store/git-store";
import { invokeErrorMessage } from "@/lib/invoke-error-message";

import {
  listRepositoryEvidenceScreenshots,
  syncRepositoryEvidenceScreenshots,
} from "../api/repository-screenshots.commands";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_EVIDENCE_SCREENSHOTS,
  MAX_SCREENSHOT_FILE_BYTES,
  type EvidenceScreenshot,
} from "../types";

type AttachmentsState = {
  attachments: EvidenceScreenshot[];

  /**
   * Recarrega anexos a partir da BD SQLite para o caminho canónico do repositório.
   */
  hydrateFromPersistence: (repositoryPath: string) => Promise<void>;
  /**
   * Valida ficheiros síncrono; leitura assíncrona acumula no fim.
   * Devolve avisos (tipo/tamanho/limite); erros de leitura aparecem no estado `lastAddError`.
   */
  addFromFiles: (files: File[]) => string[];
  remove: (id: string) => void;
  updateCaption: (id: string, caption: string) => void;
  clear: () => void;
  /** Substitui a lista (ex.: carregar rascunho); sincroniza com SQLite do repo activo. */
  replaceAttachmentsFromDraft: (items: EvidenceScreenshot[]) => void;
  lastAddError: string | null;
  clearLastAddError: () => void;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAttachmentsPersist(get: () => AttachmentsState) {
  const repoAtSchedule = useGitStore.getState().repositoryPath;
  if (!repoAtSchedule) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const repoNow = useGitStore.getState().repositoryPath;
    if (repoNow !== repoAtSchedule) return;
    const shots = get().attachments;
    void syncRepositoryEvidenceScreenshots(repoNow, shots).catch((e) => {
      useEvidenceAttachmentsStore.setState({
        lastAddError: invokeErrorMessage(
          e,
          "Não foi possível guardar capturas.",
        ),
      });
    });
  }, 450);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const useEvidenceAttachmentsStore = create<AttachmentsState>((set, get) => ({
  attachments: [],
  lastAddError: null,

  clearLastAddError: () => set({ lastAddError: null }),

  hydrateFromPersistence: async (repositoryPath) => {
    set({ lastAddError: null });
    try {
      const rows = await listRepositoryEvidenceScreenshots(repositoryPath);
      set({
        attachments: rows.map((r) => ({
          id: r.id,
          fileName: r.fileName,
          dataUrl: r.dataUrl,
          caption: r.caption,
        })),
      });
    } catch (e) {
      set({
        lastAddError: invokeErrorMessage(
          e,
          "Não foi possível carregar capturas guardadas.",
        ),
        attachments: [],
      });
    }
  },

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
        }));
        set((state) => ({
          attachments: [...state.attachments, ...newShots].slice(
            0,
            MAX_EVIDENCE_SCREENSHOTS,
          ),
        }));
        scheduleAttachmentsPersist(get);
      })
      .catch(() => {
        set({ lastAddError: "Não foi possível ler um ou mais ficheiros." });
      });

    return errors;
  },

  remove: (id) => {
    set((s) => ({
      attachments: s.attachments.filter((a) => a.id !== id),
    }));
    scheduleAttachmentsPersist(get);
  },

  updateCaption: (id, caption) => {
    set((s) => ({
      attachments: s.attachments.map((a) =>
        a.id === id ? { ...a, caption } : a,
      ),
    }));
    scheduleAttachmentsPersist(get);
  },

  clear: () => set({ attachments: [], lastAddError: null }),

  replaceAttachmentsFromDraft: (items) => {
    set({
      lastAddError: null,
      attachments: items.slice(0, MAX_EVIDENCE_SCREENSHOTS),
    });
    scheduleAttachmentsPersist(get);
  },
}));
