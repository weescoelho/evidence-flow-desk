import { describe, expect, it } from "vitest";

import type { EvidenceDocumentPayload } from "./build-evidence-html";
import { buildEvidenceBodyHtml } from "./build-evidence-html";
import { escapeHtml } from "./escape-html";

function basePayload(over: Partial<EvidenceDocumentPayload> = {}): EvidenceDocumentPayload {
  return {
    repositoryPath: "/tmp/repo",
    baseRef: "main",
    compareRef: "dev",
    technicalSummary: "Resumo",
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

describe("escapeHtml", () => {
  it("neutraliza marcadores HTML", () => {
    expect(escapeHtml(`<a href="x">y</a>`)).not.toContain("<a");
    expect(escapeHtml(`<a href="x">y</a>`)).toContain("&lt;");
  });
});

describe("buildEvidenceBodyHtml", () => {
  it("inclui caminho e refs no corpo", () => {
    const html = buildEvidenceBodyHtml(basePayload());
    expect(html).toContain("/tmp/repo");
    expect(html).toContain("main");
    expect(html).toContain("dev");
    expect(html).toContain("feat: x");
  });

  it("escapa texto na secção de resumo técnico", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({ technicalSummary: "<script>bad</script>" }),
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("inclui screenshots quando fornecidos", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({
        screenshots: [
          {
            fileName: "x.png",
            dataUrl: "data:image/png;base64,xxx",
            caption: "Legenda",
            linkedCommitShort: "abcd123",
          },
        ],
      }),
    );
    expect(html).toContain("Screenshots");
    expect(html).toContain("data:image/png;base64,xxx");
    expect(html).toContain("Legenda");
    expect(html).toContain("abcd123");
  });
});
