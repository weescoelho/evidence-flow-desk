import { useMemo } from "react";

import { EvidenceDocumentPreview } from "@/features/document";
import { useEvidenceAttachmentsStore } from "@/features/evidence";

import type { RepositoryScopeSummaryState } from "../hooks/use-repository-scope-summary";

type ScopeDocumentPreviewPanelProps = {
  scope: RepositoryScopeSummaryState;
  variant?: "preview" | "export";
};

export function ScopeDocumentPreviewPanel({
  scope,
  variant = "preview",
}: ScopeDocumentPreviewPanelProps) {
  const {
    repositoryPath,
    baseBranch,
    compareBranch,
    data,
    sameBranch,
    technicalNarrative,
  } = scope;

  const evidenceAttachments = useEvidenceAttachmentsStore(
    (s) => s.attachments,
  );

  const screenshotPayload = useMemo(
    () =>
      evidenceAttachments.map((a) => ({
        fileName: a.fileName,
        dataUrl: a.dataUrl,
        caption: a.caption,
        linkedCommitShort: a.linkedCommitHash
          ? a.linkedCommitHash.slice(0, 7)
          : null,
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
      technicalSummary={technicalNarrative}
      commits={data.commits}
      files={data.files}
      commitsTruncated={data.commitsTruncated}
      screenshots={screenshotPayload}
      variant={variant}
    />
  );
}
