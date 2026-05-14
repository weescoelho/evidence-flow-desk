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
    templateLayoutKey: "enterprise",
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
  it("não lista repositório nem refs nos metadados (layout enterprise)", () => {
    const html = buildEvidenceBodyHtml(basePayload());
    expect(html).not.toContain("Repositório");
    expect(html).not.toContain("Ref base");
    expect(html).not.toContain("Ref comparação");
    expect(html).not.toContain("/tmp/repo");
  });

  it("prefixa faixa com imagens do template (esq. / dir.)", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({
        templateHeaderImageLeft: "data:image/png;base64,xxx",
        templateHeaderImageRight: "data:image/jpeg;base64,yyy",
      }),
    );
    expect(html).toContain("evidence-template-banner-inner");
    expect(html).toContain("evidence-template-banner-left");
    expect(html).toContain("evidence-template-banner-right");
  });

  it("modelo mercado inclui capa IEEE/ITIL e não expõe paths indevidos no cabeçalho clássico", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({
        templateLayoutKey: "market_standard",
        productName: "Meu Sistema",
      }),
    );
    expect(html).toContain('id="evidence-section-cover"');
    expect(html).toContain("Controle de versões do documento");
    expect(html).toContain("Resumo executivo");
    expect(html).toContain("Meu Sistema");
    expect(html).toContain("main");
    expect(html).toContain("dev");
  });

  it("modelo mercado acumula linhas de revisão no histórico", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({
        templateLayoutKey: "market_standard",
        productName: "Svc",
        documentRevisionHistory: [
          {
            version: "1.0",
            date: "01/05/2026",
            summary: "Emissão inicial",
            author: "Ana",
          },
        ],
        documentVersion: "1.1",
        documentRevisionDate: "12/05/2026",
        documentRevisionSummary: "Correcções de texto",
        documentRevisionAuthor: "Bruno",
      }),
    );
    expect(html).toContain(">1.0<");
    expect(html).toContain(">1.1<");
    expect(html).toContain("Emissão inicial");
    expect(html).toContain("Correcções de texto");
    expect(html).toContain("Ana");
    expect(html).toContain("Bruno");
  });

  it("modelo mercado não duplica linha quando último histórico coincide com campos actuais", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({
        templateLayoutKey: "market_standard",
        documentRevisionHistory: [
          {
            version: "2.0",
            date: "10/05/2026",
            summary: "Release",
            author: "Carla",
          },
        ],
        documentVersion: "2.0",
        documentRevisionDate: "10/05/2026",
        documentRevisionSummary: "Release",
        documentRevisionAuthor: "Carla",
      }),
    );
    const tbodyMatch = /<tbody>([\s\S]*?)<\/tbody>/.exec(html);
    expect(tbodyMatch).toBeTruthy();
    expect((tbodyMatch![1].match(/<tr>/g) ?? []).length).toBe(1);
  });

  it("inclui conteúdo principal do relatório nas secções seguintes", () => {
    const html = buildEvidenceBodyHtml(basePayload());
    expect(html).toContain("feat: x");
    expect(html).toContain("CHG-1");
    expect(html).toContain("HML");
  });

  it("marca a tabela de arquivos e estilos para quebra de caminhos longos", () => {
    const body = buildEvidenceBodyHtml(basePayload());
    expect(body).toContain("evidence-files");
    const full = buildEvidencePrintHtml(basePayload());
    expect(full).toContain("overflow-wrap");
    expect(full).toContain("table.evidence-files");
  });

  it("sanitiza HTML perigoso na secção de resumo técnico (Markdown)", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({ technicalSummary: "<script>bad</script>" }),
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("</script>");
    expect(html).toContain("markdown-body");
  });

  it("inclui screenshots quando fornecidos", () => {
    const html = buildEvidenceBodyHtml(
      basePayload({
        screenshots: [
          {
            fileName: "x.png",
            dataUrl: "data:image/png;base64,xxx",
            caption: "Legenda",
          },
        ],
      }),
    );
    expect(html).toContain("Capturas de ecrã");
    expect(html).toContain("data:image/png;base64,xxx");
    expect(html).toContain("Legenda");
    expect(html).not.toContain("Associado ao commit");
    expect(html).toContain("evidence-screenshots");
    expect(html).toContain(">Imagem<");
    expect(html).toContain(">Descrição<");
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

  it("injeta CSS da variante minimal no documento de impressão", () => {
    const html = buildEvidencePrintHtml(
      basePayload({ templateLayoutKey: "minimal" }),
    );
    expect(html).toContain("border-left: 3px solid");
    expect(html).toContain("transparent");
  });

  it("injeta CSS do modelo mercado no documento de impressão", () => {
    const html = buildEvidencePrintHtml(
      basePayload({ templateLayoutKey: "market_standard" }),
    );
    expect(html).toContain(".cover");
    expect(html).toContain("border-radius: 8px");
  });

  it("reserva margem e padding do rodapé ao numerar páginas", () => {
    const html = buildEvidencePrintHtml(basePayload(), {
      numberPagesPrint: true,
    });
    expect(html).toContain("margin-bottom: 28mm");
    expect(html).toContain("padding-top: 4mm");
    expect(html).toContain("@bottom-center");
  });
});
