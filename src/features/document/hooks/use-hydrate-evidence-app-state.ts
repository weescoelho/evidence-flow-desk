import { useEffect } from "react";

import { loadEvidenceAppPersistedState } from "../api/evidence-app-state.commands";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";

/** Hidrata preferences + templates do SQLite (RF-015). Em ambiente sem Tauri, faz fallback local. */
export function useHydrateEvidenceAppState() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snapshot = await loadEvidenceAppPersistedState();
        if (!cancelled) {
          useEvidenceMetadataStore.getState().hydrateFromSnapshot(snapshot);
        }
      } catch {
        if (!cancelled) {
          useEvidenceMetadataStore.getState().hydrateFallbackLocal();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
