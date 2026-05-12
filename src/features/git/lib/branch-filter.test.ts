import { describe, expect, it } from "vitest";

import { filterBranchNames } from "./branch-filter";

describe("filterBranchNames", () => {
  it("mantém ordem e filtra sem distinguir maiúsculas", () => {
    expect(
      filterBranchNames(["main", "Feature-X", "dev"], "feat")
    ).toEqual(["Feature-X"]);
  });

  it("com filtro vazio devolve a lista completa", () => {
    expect(filterBranchNames(["a", "b"], "   ")).toEqual(["a", "b"]);
  });
});
