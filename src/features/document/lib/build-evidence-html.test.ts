import { describe, expect, it } from "vitest";

import type { EvidenceDocumentPayload } from "./build-evidence-html";
import { buildEvidenceBodyHtml, buildEvidencePrintHtml } from "./build-evidence-html";
import { escapeHtml } from "./escape-html";

function basePayload(over: Partial<EvidenceDocumentPayload> = {}): EvidenceDocumentPayload {
  return {
    repositoryPath: "/tmp/repo",
    baseRef: "main",
    compareRef: "dev",
    templateLabel: "Homologação — padrão enterprise",
    changeId: "CHG-1",
    environment: "HML",
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
  it("não lista repositório nem refs nos metadados", () => {
    const html = buildEvidenceBodyHtml(basePayload());
    expect(html).not.toContain("Repositório");
    expect(html).not.toContain("Ref base");
    expect(html).not.toContain("Ref comparação");
    expect(html).not.toContain("/tmp/repo");
  });

  it("inclui conteúdo principal do relatório nas secções seguintes", () => {
    const html = buildEvidenceBodyHtml(basePayload());
    expect(html).toContain("feat: x");
    expect(html).toContain("CHG-1");
    expect(html).toContain("HML");
  });

  it("marca a tabela de arquivos e estilos para quebra de caminhos longos", () => {
    const body = buildEvidenceBodyHtml(basePayload());
    expect(body).toContain('class="evidence-files"');
    const full = buildEvidencePrintHtml(basePayload());
    expect(full).toContain("overflow-wrap");
    expect(full).toContain("table.evidence-files");
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

  it("expõe ids de secção estáveis no HTML do relatório", () => {
    const html = buildEvidenceBodyHtml(basePayload());
    expect(html).toContain('id="evidence-section-meta"');
    expect(html).toContain('id="evidence-section-summary"');
    expect(html).toContain('id="evidence-section-commits"');
    expect(html).toContain('id="evidence-section-files"');
  });

  it("inclui secção de resumo corporativo quando preenchido", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({ corporateSummary: "Entrega focada em estabilidade." }),
    );
    expect(html).toContain('id="evidence-section-corporate"');
    expect(html).toContain("Entrega focada em estabilidade.");
  });

  it("omite resumo corporativo quando vazio", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({ corporateSummary: "" }),
    );
    expect(html).not.toContain('id="evidence-section-corporate"');
  });

  it("inclui id da secção de screenshots quando existem anexos", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({
        screenshots: [
          {
            fileName: "x.png",
            dataUrl: "data:image/png;base64,xxx",
            caption: "L",
            linkedCommitShort: null,
          },
        ],
      }),
    );
    expect(html).toContain('id="evidence-section-screenshots"');
  });
});

describe("buildEvidencePrintHtml", () => {
  it("define o título do documento quando pedido", () => {
    const html = buildEvidencePrintHtml(basePayload(), {
      documentTitle: "Meu projeto — documento",
    });
    expect(html).toContain("<title>Meu projeto — documento</title>");
  });

  it("escapa o título do documento", () => {
    const html = buildEvidencePrintHtml(basePayload(), {
      documentTitle: "<invasão>",
    });
    expect(html).toContain("<title>&lt;invasão&gt;</title>");
  });
});
