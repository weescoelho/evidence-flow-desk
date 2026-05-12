/** Screenshot anexado pelo utilizador (dados em memória — sessão atual). */
export type EvidenceScreenshot = {
  id: string;
  fileName: string;
  /** data:image/…;base64,… */
  dataUrl: string;
  caption: string;
  /** Hash completo do commit quando associado (RF-014 subset). */
  linkedCommitHash: string | null;
};

export const MAX_EVIDENCE_SCREENSHOTS = 12;
export const MAX_SCREENSHOT_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
