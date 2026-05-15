import type { DocumentRevisionRow } from "./document-revision-history";
import type { EvidenceDocumentPayload } from "./build-evidence-html";

export const EVIDENCE_REPORT_DRAFT_SCHEMA_VERSION = 2 as const;

/** Rascunho serializado junto ao HTML para reabrir a sessão de edição. */
export type EvidenceReportDraftV2 = {
  schemaVersion: typeof EVIDENCE_REPORT_DRAFT_SCHEMA_VERSION;
  repositoryPath: string;
  branchRefs: string[];
  activeTemplateId: string;
  /** Preservados para referência se o template deixar de existir. */
  templateLabel: string;
  templateLayoutKey: string;
  changeId: string;
  environment: string;
  productName: string;
  releaseVersion: string;
  deploymentDate: string;
  technicalOwner: string;
  approver: string;
  outOfScope: string;
  documentVersion: string;
  documentRevisionDate: string;
  documentRevisionSummary: string;
  documentRevisionAuthor: string;
  documentRevisionHistory: DocumentRevisionRow[];
  technicalSummary: string;
  corporateSummary: string;
  templateHeaderImageLeft: string;
  templateHeaderImageRight: string;
  screenshots: Array<{
    id: string;
    fileName: string;
    dataUrl: string;
    caption: string;
  }>;
};

export function buildEvidenceReportDraftJson(args: {
  payload: EvidenceDocumentPayload;
  activeTemplateId: string;
  screenshots: Array<{
    id: string;
    fileName: string;
    dataUrl: string;
    caption: string;
  }>;
}): string {
  const p = args.payload;
  const draft: EvidenceReportDraftV2 = {
    schemaVersion: EVIDENCE_REPORT_DRAFT_SCHEMA_VERSION,
    repositoryPath: p.repositoryPath,
    branchRefs: p.branchRefs,
    activeTemplateId: args.activeTemplateId,
    templateLabel: p.templateLabel,
    templateLayoutKey: p.templateLayoutKey,
    changeId: p.changeId,
    environment: p.environment,
    productName: p.productName ?? "",
    releaseVersion: p.releaseVersion ?? "",
    deploymentDate: p.deploymentDate ?? "",
    technicalOwner: p.technicalOwner ?? "",
    approver: p.approver ?? "",
    outOfScope: p.outOfScope ?? "",
    documentVersion: p.documentVersion ?? "",
    documentRevisionDate: p.documentRevisionDate ?? "",
    documentRevisionSummary: p.documentRevisionSummary ?? "",
    documentRevisionAuthor: p.documentRevisionAuthor ?? "",
    documentRevisionHistory: p.documentRevisionHistory ?? [],
    technicalSummary: p.technicalSummary,
    corporateSummary: p.corporateSummary ?? "",
    templateHeaderImageLeft: p.templateHeaderImageLeft ?? "",
    templateHeaderImageRight: p.templateHeaderImageRight ?? "",
    screenshots: args.screenshots,
  };
  return JSON.stringify(draft);
}

function isRevisionRow(v: unknown): v is DocumentRevisionRow {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.version === "string" &&
    typeof o.date === "string" &&
    typeof o.summary === "string" &&
    typeof o.author === "string"
  );
}

function isScreenshot(v: unknown): v is EvidenceReportDraftV2["screenshots"][number] {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.fileName === "string" &&
    typeof o.dataUrl === "string" &&
    typeof o.caption === "string"
  );
}

/** Parse e validação mínima do JSON guardado em `draft.json`. */
export function parseEvidenceReportDraftJson(raw: string): EvidenceReportDraftV2 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Rascunho corrupto (JSON inválido).");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Rascunho inválido.");
  }
  const o = parsed as Record<string, unknown>;
  if (o.schemaVersion === 1) {
    throw new Error(
      "Este rascunho foi criado com a versão anterior do escopo (base → compare). Crie um novo documento com a seleção de branches.",
    );
  }
  if (o.schemaVersion !== EVIDENCE_REPORT_DRAFT_SCHEMA_VERSION) {
    throw new Error("Versão de rascunho não suportada.");
  }
  if (!Array.isArray(o.branchRefs)) {
    throw new Error("Rascunho inválido: branchRefs.");
  }
  for (const br of o.branchRefs) {
    if (typeof br !== "string") {
      throw new Error("Rascunho inválido: branchRefs.");
    }
  }
  const strings = [
    "repositoryPath",
    "activeTemplateId",
    "templateLabel",
    "templateLayoutKey",
    "changeId",
    "environment",
    "productName",
    "releaseVersion",
    "deploymentDate",
    "technicalOwner",
    "approver",
    "outOfScope",
    "documentVersion",
    "documentRevisionDate",
    "documentRevisionSummary",
    "documentRevisionAuthor",
    "technicalSummary",
    "corporateSummary",
    "templateHeaderImageLeft",
    "templateHeaderImageRight",
  ] as const;
  for (const k of strings) {
    if (typeof o[k] !== "string") {
      throw new Error(`Rascunho inválido: campo «${k}».`);
    }
  }
  if (!Array.isArray(o.documentRevisionHistory)) {
    throw new Error("Rascunho inválido: documentRevisionHistory.");
  }
  for (const row of o.documentRevisionHistory) {
    if (!isRevisionRow(row)) {
      throw new Error("Rascunho inválido: entrada de revisão.");
    }
  }
  if (!Array.isArray(o.screenshots)) {
    throw new Error("Rascunho inválido: screenshots.");
  }
  for (const s of o.screenshots) {
    if (!isScreenshot(s)) {
      throw new Error("Rascunho inválido: screenshot.");
    }
  }
  return o as unknown as EvidenceReportDraftV2;
}
