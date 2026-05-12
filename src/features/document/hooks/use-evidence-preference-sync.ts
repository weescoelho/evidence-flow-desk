import { useEffect, useRef } from "react";

import {
  evidencePreferenceKeys,
  setEvidencePreference,
} from "../api/evidence-app-state.commands";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";

const DEBOUNCE_MS = 480;

/**
 * Grava Change ID / Ambiente no SQLite após hidratação (evita sobrescrever valores
 * vindos do disco no primeiro render).
 */
export function useEvidencePreferenceSync() {
  const hydrated = useEvidenceMetadataStore((s) => s.hydrated);
  const changeId = useEvidenceMetadataStore((s) => s.changeId);
  const environment = useEvidenceMetadataStore((s) => s.environment);

  const skipFirst = useRef(true);

  useEffect(() => {
    if (!hydrated) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void setEvidencePreference(evidencePreferenceKeys.changeId, changeId);
      void setEvidencePreference(evidencePreferenceKeys.environment, environment);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [changeId, environment, hydrated]);
}
