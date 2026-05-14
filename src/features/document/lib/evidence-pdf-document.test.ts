/** @vitest-environment node */
import { describe, expect, it } from "vitest";

import type { EvidenceDocumentPayload } from "./build-evidence-html";
import { buildEvidencePdfBlob } from "./evidence-pdf-document";

function basePayload(
  over: Partial<EvidenceDocumentPayload> = {},
): EvidenceDocumentPayload {
  return {
    repositoryPath: "/tmp/repo",
    baseRef: "main",
    compareRef: "dev",
    templateLabel: "Homologação — padrão enterprise",
    templateLayoutKey: "enterprise",
    changeId: "CHG-1",
    environment: "HML",
    technicalSummary: "Resumo técnico de teste.",
    commits: [
      {
        hash: "a".repeat(40),
        shortHash: "aaaaaaa",
        authorName: "A",
        authorEmail: "a@a",
        committedAtUnix: 0,
        summary: "feat: x",
        message: "feat: x",
        conventionalType: "feat",
      },
    ],
    files: [
      {
        path: "f.txt",
        pathBefore: null,
        pathAfter: null,
        status: "added",
        linesAdded: 1,
        linesRemoved: 0,
      },
    ],
    commitsTruncated: false,
    screenshots: [],
    ...over,
  };
}

describe("buildEvidencePdfBlob", () => {
  it("gera PDF não vazio (layout enterprise)", async () => {
    const blob = await buildEvidencePdfBlob(basePayload(), {
      documentTitle: "Teste — PDF",
      numberPagesPrint: true,
    });
    expect(blob.size).toBeGreaterThan(800);
    expect(blob.type).toBe("application/pdf");
  });

  it("gera PDF com modelo mercado e revisões", async () => {
    const blob = await buildEvidencePdfBlob(
      basePayload({
        templateLayoutKey: "market_standard",
        productName: "Sistema X",
        documentRevisionHistory: [
          {
            version: "1.0",
            date: "01/05/2026",
            summary: "Emissão inicial",
            author: "Ana",
          },
        ],
      }),
      { numberPagesPrint: false },
    );
    expect(blob.size).toBeGreaterThan(800);
  });
});
