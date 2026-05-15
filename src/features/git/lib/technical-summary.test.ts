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
    expect(t).toContain("gerado automaticamente");
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
