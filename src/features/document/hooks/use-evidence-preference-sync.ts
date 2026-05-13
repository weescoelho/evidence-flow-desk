import { useEffect, useRef } from "react";

import {
  evidencePreferenceKeys,
  setEvidencePreference,
} from "../api/evidence-app-state.commands";
import { serializeDocumentRevisionHistory } from "../lib/document-revision-history";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";

const DEBOUNCE_MS = 480;

/**
 * Grava metadados do documento e Change ID / Ambiente no SQLite após hidratação
 * (evita sobrescrever valores vindos do disco no primeiro render).
 */
export function useEvidencePreferenceSync() {
  const hydrated = useEvidenceMetadataStore((s) => s.hydrated);
  const changeId = useEvidenceMetadataStore((s) => s.changeId);
  const environment = useEvidenceMetadataStore((s) => s.environment);
  const productName = useEvidenceMetadataStore((s) => s.productName);
  const releaseVersion = useEvidenceMetadataStore((s) => s.releaseVersion);
  const deploymentDate = useEvidenceMetadataStore((s) => s.deploymentDate);
  const technicalOwner = useEvidenceMetadataStore((s) => s.technicalOwner);
  const approver = useEvidenceMetadataStore((s) => s.approver);
  const outOfScope = useEvidenceMetadataStore((s) => s.outOfScope);
  const documentVersion = useEvidenceMetadataStore((s) => s.documentVersion);
  const documentRevisionDate = useEvidenceMetadataStore(
    (s) => s.documentRevisionDate,
  );
  const documentRevisionSummary = useEvidenceMetadataStore(
    (s) => s.documentRevisionSummary,
  );
  const documentRevisionAuthor = useEvidenceMetadataStore(
    (s) => s.documentRevisionAuthor,
  );
  const documentRevisionHistory = useEvidenceMetadataStore(
    (s) => s.documentRevisionHistory,
  );

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
      void setEvidencePreference(evidencePreferenceKeys.productName, productName);
      void setEvidencePreference(
        evidencePreferenceKeys.releaseVersion,
        releaseVersion,
      );
      void setEvidencePreference(
        evidencePreferenceKeys.deploymentDate,
        deploymentDate,
      );
      void setEvidencePreference(
        evidencePreferenceKeys.technicalOwner,
        technicalOwner,
      );
      void setEvidencePreference(evidencePreferenceKeys.approver, approver);
      void setEvidencePreference(evidencePreferenceKeys.outOfScope, outOfScope);
      void setEvidencePreference(
        evidencePreferenceKeys.documentVersion,
        documentVersion,
      );
      void setEvidencePreference(
        evidencePreferenceKeys.documentRevisionDate,
        documentRevisionDate,
      );
      void setEvidencePreference(
        evidencePreferenceKeys.documentRevisionSummary,
        documentRevisionSummary,
      );
      void setEvidencePreference(
        evidencePreferenceKeys.documentRevisionAuthor,
        documentRevisionAuthor,
      );
      void setEvidencePreference(
        evidencePreferenceKeys.documentRevisionHistory,
        serializeDocumentRevisionHistory(documentRevisionHistory),
      );
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [
    hydrated,
    changeId,
    environment,
    productName,
    releaseVersion,
    deploymentDate,
    technicalOwner,
    approver,
    outOfScope,
    documentVersion,
    documentRevisionDate,
    documentRevisionSummary,
    documentRevisionAuthor,
    documentRevisionHistory,
  ]);
}
