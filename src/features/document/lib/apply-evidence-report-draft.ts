import {
  DEFAULT_BUILTIN_TEMPLATE_ID,
  useEvidenceMetadataStore,
} from "@/features/document/store/evidence-metadata-store";
import { usePendingEvidenceNarrativesStore } from "@/features/document/store/pending-evidence-narratives-store";
import { syncRepositoryEvidenceScreenshots } from "@/features/evidence/api/repository-screenshots.commands";
import { useEvidenceAttachmentsStore } from "@/features/evidence/store/attachments-store";
import { resetEvidenceSession } from "@/features/git/lib/reset-evidence-session";
import { useGitStore } from "@/features/git/store/git-store";

import type { EvidenceReportDraftV1 } from "./evidence-report-draft";

function applyMetadataFromDraft(d: EvidenceReportDraftV1): void {
  const s = useEvidenceMetadataStore.getState();
  const templates = s.templates;
  let activeId = d.activeTemplateId.trim();
  if (!templates.some((t) => t.id === activeId)) {
    activeId = DEFAULT_BUILTIN_TEMPLATE_ID;
  }
  s.setActiveTemplateId(activeId);
  s.setChangeId(d.changeId);
  s.setEnvironment(d.environment);
  s.setProductName(d.productName);
  s.setReleaseVersion(d.releaseVersion);
  s.setDeploymentDate(d.deploymentDate);
  s.setTechnicalOwner(d.technicalOwner);
  s.setApprover(d.approver);
  s.setOutOfScope(d.outOfScope);
  s.setDocumentVersion(d.documentVersion);
  s.setDocumentRevisionDate(d.documentRevisionDate);
  s.setDocumentRevisionSummary(d.documentRevisionSummary);
  s.setDocumentRevisionAuthor(d.documentRevisionAuthor);
  s.setDocumentRevisionHistory(d.documentRevisionHistory);
}

/**
 * Repõe a sessão a partir de um rascunho guardado (SQLite).
 * Assíncrono devido a `selectRepository`.
 */
export async function applyEvidenceReportDraft(
  draft: EvidenceReportDraftV1,
): Promise<void> {
  resetEvidenceSession();
  usePendingEvidenceNarrativesStore
    .getState()
    .setPending(draft.technicalSummary, draft.corporateSummary);
  applyMetadataFromDraft(draft);

  await useGitStore.getState().selectRepository(draft.repositoryPath);
  useGitStore.setState({
    baseBranch: draft.baseRef,
    compareBranch: draft.compareRef,
  });

  const shots = draft.screenshots.map((x) => ({
    id: x.id,
    fileName: x.fileName,
    dataUrl: x.dataUrl,
    caption: x.caption,
  }));
  useEvidenceAttachmentsStore.getState().replaceAttachmentsFromDraft(shots);

  const canon = useGitStore.getState().repositoryPath;
  if (canon) {
    try {
      await syncRepositoryEvidenceScreenshots(canon, shots);
    } catch {
      /* melhor esforço: estado em memória já está correcto */
    }
  }
}
