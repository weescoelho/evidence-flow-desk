import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { RepositoryScopeSummaryState } from "../hooks/use-repository-scope-summary";
import { resetGitStore } from "../test/store-reset";
import { useGitStore } from "../store/git-store";
import { ScopeCommitsStep } from "./scope-commits-step";

function idleScope(
  partial: Partial<RepositoryScopeSummaryState> = {},
): RepositoryScopeSummaryState {
  const noop = () => {};
  return {
    repositoryPath: null,
    baseBranch: null,
    compareBranch: null,
    data: null,
    loading: false,
    error: null,
    sameBranch: false,
    technicalNarrative: "",
    technicalNarrativeGenerated: "",
    technicalNarrativeIsCustomized: false,
    setTechnicalNarrative: noop,
    resetTechnicalNarrativeToGenerated: noop,
    corporateNarrative: "",
    setCorporateNarrative: noop,
    ...partial,
  };
}

describe("ScopeCommitsStep", () => {
  beforeEach(() => resetGitStore());

  it("indica lista vazia por filtro de branches", () => {
    useGitStore.setState({
      repositoryPath: "/repo",
      branches: [{ name: "main", isHead: true }],
      headDisplay: "main",
      detached: false,
      branchFilter: "zzz",
    });
    render(<ScopeCommitsStep scope={idleScope()} />);
    expect(screen.getByTestId("empty-filter")).toBeInTheDocument();
  });

  it("permite indicar refs Git livres (input com datalist de branches)", () => {
    useGitStore.setState({
      repositoryPath: "/repo",
      branches: [
        { name: "main", isHead: true },
        { name: "dev", isHead: false },
      ],
      headDisplay: "main",
      detached: false,
      branchFilter: "",
      baseBranch: "main",
      compareBranch: "dev",
    });
    render(<ScopeCommitsStep scope={idleScope({ sameBranch: false })} />);
    expect(screen.getByTestId("scope-base-ref")).toHaveValue("main");
    expect(screen.getByTestId("scope-compare-ref")).toHaveValue("dev");
  });

  it("avisa quando base e comparar são iguais", () => {
    useGitStore.setState({
      repositoryPath: "/repo",
      branches: [{ name: "main", isHead: true }],
      headDisplay: "main",
      detached: false,
      branchFilter: "",
      baseBranch: "main",
      compareBranch: "main",
    });
    render(<ScopeCommitsStep scope={idleScope({ sameBranch: true })} />);
    expect(
      screen.getAllByTestId("compare-same-warning").length,
    ).toBeGreaterThanOrEqual(1);
  });
});
