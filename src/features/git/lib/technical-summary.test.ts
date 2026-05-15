import { describe, expect, it } from "vitest";

import { buildTechnicalSummary, type TechnicalSummaryInput } from "./technical-summary";

describe("buildTechnicalSummary", () => {
  it("indica vazio quando não há commits nem arquivos", () => {
    const data: TechnicalSummaryInput = {
      commits: [],
      files: [],
      commitsTruncated: false,
    };
    expect(buildTechnicalSummary(data)).toContain("Não há commits nem alterações");
  });

  it("lista commits convencionais e totais de arquivos", () => {
    const data: TechnicalSummaryInput = {
      commits: [
        {
          hash: "a".repeat(40),
          shortHash: "aaaaaaaa",
          authorName: "Dev",
          authorEmail: "d@ex.com",
          committedAtUnix: 1700000000,
          summary: "feat: add file",
          message: "feat: add file\n",
          conventionalType: "feat",
        },
      ],
      files: [
        {
          path: "new.txt",
          pathBefore: null,
          pathAfter: null,
          status: "added",
          linesAdded: 3,
          linesRemoved: 0,
        },
      ],
      commitsTruncated: false,
    };
    const t = buildTechnicalSummary(data);
    expect(t).toContain("1 commit");
    expect(t).toContain("[feat]");
    expect(t).toContain("add file");
    expect(t).toContain("1 arquivo");
    expect(t).toContain("+3 / −0");
    expect(t).toContain("adicionados");
    expect(t).toContain("Arquivos com maior movimentação");
    expect(t).toContain("new.txt");
    expect(t).toContain("gerado automaticamente");
  });

  it("omite paths além do limite com mensagem de resumo", () => {
    const files = Array.from({ length: 35 }, (_, i) => ({
      path: `pkg/f${i}.ts`,
      pathBefore: null,
      pathAfter: null,
      status: "modified" as const,
      linesAdded: i + 1,
      linesRemoved: 0,
    }));
    const data: TechnicalSummaryInput = {
      commits: [],
      files,
      commitsTruncated: false,
    };
    const t = buildTechnicalSummary(data);
    expect(t).toContain("Arquivos com maior movimentação");
    expect(t).toContain("omitidos neste resumo");
    expect(t).toMatch(/e mais 5 arquivo\(s\)/);
  });

  it("mostra antigo → novo em renomeações no resumo de paths", () => {
    const data: TechnicalSummaryInput = {
      commits: [
        {
          hash: "b".repeat(40),
          shortHash: "bbbbbbbb",
          authorName: "Dev",
          authorEmail: "d@ex.com",
          committedAtUnix: 1700000001,
          summary: "rename module",
          message: "rename module\n",
          conventionalType: null,
        },
      ],
      files: [
        {
          path: "old.ts",
          pathBefore: "old.ts",
          pathAfter: "new.ts",
          status: "renamed",
          linesAdded: 0,
          linesRemoved: 0,
        },
      ],
      commitsTruncated: false,
    };
    const t = buildTechnicalSummary(data);
    expect(t).toContain("old.ts → new.ts");
    expect(t).toContain("renomeado");
  });

  it("menciona truncagem quando o servidor sinaliza limite", () => {
    const data: TechnicalSummaryInput = {
      commits: [
        {
          hash: "a".repeat(40),
          shortHash: "aaa",
          authorName: "x",
          authorEmail: "x@x",
          committedAtUnix: 0,
          summary: "chore: x",
          message: "chore: x",
          conventionalType: "chore",
        },
      ],
      files: [],
      commitsTruncated: true,
    };
    expect(buildTechnicalSummary(data).toLowerCase()).toContain("truncad");
  });
});
