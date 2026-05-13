import type { RefObject } from "react";
import { useMemo } from "react";

import {
  EvidenceDocumentPreview,
  activeTemplateLabel,
  useEvidenceMetadataStore,
} from "@/features/document";
import { useEvidenceAttachmentsStore } from "@/features/evidence";

import type { RepositoryScopeSummaryState } from "../hooks/use-repository-scope-summary";

type ScopeDocumentPreviewPanelProps = {
  scope: RepositoryScopeSummaryState;
  variant?: "preview" | "export";
  onLocalSaveSuccess?: () => void;
  exportPdfTriggerRef?: RefObject<HTMLButtonElement | null>;
};

export function ScopeDocumentPreviewPanel({
  scope,
  variant = "preview",
  onLocalSaveSuccess,
  exportPdfTriggerRef,
}: ScopeDocumentPreviewPanelProps) {
  const {
    repositoryPath,
    baseBranch,
    compareBranch,
    data,
    sameBranch,
    technicalNarrative,
    corporateNarrative,
  } = scope;

  const evidenceAttachments = useEvidenceAttachmentsStore(
    (s) => s.attachments,
  );

  const activeTemplateId = useEvidenceMetadataStore(
    (s) => s.activeTemplateId,
  );
  const changeId = useEvidenceMetadataStore((s) => s.changeId);
  const environment = useEvidenceMetadataStore((s) => s.environment);

  const screenshotPayload = useMemo(
    () =>
      evidenceAttachments.map((a) => ({
        fileName: a.fileName,
        dataUrl: a.dataUrl,
        caption: a.caption,
      })),
    [evidenceAttachments],
  );

  if (
    !repositoryPath ||
    !baseBranch ||
    !compareBranch ||
    sameBranch ||
    !data
  ) {
    return null;
  }

  return (
    <EvidenceDocumentPreview
      repositoryPath={repositoryPath}
      baseRef={baseBranch}
      compareRef={compareBranch}
      templateLabel={activeTemplateLabel(activeTemplateId)}
      changeId={changeId}
      environment={environment}
      technicalSummary={technicalNarrative}
      corporateSummary={corporateNarrative}
      commits={data.commits}
      files={data.files}
      commitsTruncated={data.commitsTruncated}
      screenshots={screenshotPayload}
      variant={variant}
      onLocalSaveSuccess={onLocalSaveSuccess}
      exportPdfTriggerRef={exportPdfTriggerRef}
    />
  );
}
