/** Screenshot anexado pelo utilizador; a lista em sessão sincroniza com SQLite por repositório. */
export type EvidenceScreenshot = {
  id: string;
  fileName: string;
  /** data:image/…;base64,… */
  dataUrl: string;
  caption: string;
};

export const MAX_EVIDENCE_SCREENSHOTS = 12;
export const MAX_SCREENSHOT_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
