import { describe, expect, it } from "vitest";

import type { EvidenceDocumentPayload } from "./build-evidence-html";
import {
  buildEvidenceReportDraftJson,
  EVIDENCE_REPORT_DRAFT_SCHEMA_VERSION,
  parseEvidenceReportDraftJson,
} from "./evidence-report-draft";

const minimalPayload: EvidenceDocumentPayload = {
  repositoryPath: "/repo/x",
  branchRefs: ["main", "feat"],
  templateLabel: "T",
  templateLayoutKey: "market_standard",
  changeId: "CHG-1",
  environment: "prod",
  productName: "P",
  releaseVersion: "1",
  deploymentDate: "",
  technicalOwner: "",
  approver: "",
  outOfScope: "",
  documentVersion: "v1",
  documentRevisionDate: "2024-01-01",
  documentRevisionSummary: "s",
  documentRevisionAuthor: "a",
  documentRevisionHistory: [],
  technicalSummary: "tech",
  corporateSummary: "corp",
  commits: [],
  files: [],
  commitsTruncated: false,
  screenshots: [],
  templateHeaderImageLeft: "",
  templateHeaderImageRight: "",
};

describe("evidence-report-draft", () => {
  it("preserva campos na serialização e parse v2", () => {
    const raw = buildEvidenceReportDraftJson({
      payload: minimalPayload,
      activeTemplateId: "tpl-1",
      screenshots: [
        {
          id: "s1",
          fileName: "a.png",
          dataUrl: "data:image/png;base64,xx",
          caption: "c",
        },
      ],
    });
    const d = parseEvidenceReportDraftJson(raw);
    expect(d.schemaVersion).toBe(EVIDENCE_REPORT_DRAFT_SCHEMA_VERSION);
    expect(d.repositoryPath).toBe("/repo/x");
    expect(d.branchRefs).toEqual(["main", "feat"]);
    expect(d.technicalSummary).toBe("tech");
    expect(d.corporateSummary).toBe("corp");
    expect(d.activeTemplateId).toBe("tpl-1");
    expect(d.screenshots).toHaveLength(1);
    expect(d.screenshots[0]?.id).toBe("s1");
  });

  it("rejeita schemaVersion inválida", () => {
    expect(() =>
      parseEvidenceReportDraftJson('{"schemaVersion":999,"repositoryPath":"x"}'),
    ).toThrow(/não suportada/i);
  });

  it("rejeita rascunho v1 legado", () => {
    const legacy =
      '{"schemaVersion":1,"repositoryPath":"/r","baseRef":"a","compareRef":"b"}';
    expect(() => parseEvidenceReportDraftJson(legacy)).toThrow(/versão anterior/i);
  });
});
