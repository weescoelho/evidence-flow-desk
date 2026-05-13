import { invoke } from "@tauri-apps/api/core";

/** Resposta do backend — alinhada a `EvidenceScreenshot`. */
export type PersistedRepositoryScreenshot = {
  id: string;
  fileName: string;
  dataUrl: string;
  caption: string;
};

export function listRepositoryEvidenceScreenshots(repositoryPath: string) {
  return invoke<PersistedRepositoryScreenshot[]>(
    "list_repository_evidence_screenshots",
    { repositoryPath },
  );
}

export function syncRepositoryEvidenceScreenshots(
  repositoryPath: string,
  screenshots: Array<{
    id: string;
    fileName: string;
    dataUrl: string;
    caption: string;
  }>,
) {
  return invoke<void>("sync_repository_evidence_screenshots", {
    repositoryPath,
    screenshots,
  });
}
