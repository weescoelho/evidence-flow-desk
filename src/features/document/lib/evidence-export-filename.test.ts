import { describe, expect, it } from "vitest";

import {
  defaultEvidenceHtmlFileName,
  safeFileNameSegment,
} from "./evidence-export-filename";

describe("evidence-export-filename", () => {
  it("sanitiza caracteres de path", () => {
    expect(safeFileNameSegment("feat/foo")).toBe("feat-foo");
  });

  it("monta nome por omissão com refs", () => {
    expect(defaultEvidenceHtmlFileName("main", "v1.0.0")).toBe(
      "evidencia-main-v1.0.0.html",
    );
  });
});
