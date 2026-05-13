import type { RefObject } from "react";
import { useMemo } from "react";

import {
  EvidenceDocumentPreview,
  activeTemplateLabel,
  activeTemplateLayoutKey,
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
  const templates = useEvidenceMetadataStore((s) => s.templates);
  const activeTemplate = templates.find((t) => t.id === activeTemplateId);
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
      templateLayoutKey={activeTemplateLayoutKey(activeTemplateId)}
      changeId={changeId}
      environment={environment}
      productName={productName}
      releaseVersion={releaseVersion}
      deploymentDate={deploymentDate}
      technicalOwner={technicalOwner}
      approver={approver}
      outOfScope={outOfScope}
      documentVersion={documentVersion}
      documentRevisionDate={documentRevisionDate}
      documentRevisionSummary={documentRevisionSummary}
      documentRevisionAuthor={documentRevisionAuthor}
      templateHeaderImageLeft={activeTemplate?.headerImageLeft ?? ""}
      templateHeaderImageRight={activeTemplate?.headerImageRight ?? ""}
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
