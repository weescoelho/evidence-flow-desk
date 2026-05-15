import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { MultiBranchScopeState } from "../hooks/use-multi-branch-scope";
import { resetGitStore } from "../test/store-reset";
import { useGitStore } from "../store/git-store";
import { ScopeCommitsStep } from "./scope-commits-step";

function idleScope(
  partial: Partial<MultiBranchScopeState> = {},
): MultiBranchScopeState {
  const noop = () => {};
  return {
    repositoryPath: null,
    selectedBranches: [],
    data: null,
    flattenedCommits: [],
    loading: false,
    error: null,
    noBranchesSelected: true,
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
      branches: [{ name: "main", isHead: true, isRemote: false }],
      headDisplay: "main",
      detached: false,
      branchFilter: "zzz",
    });
    render(<ScopeCommitsStep scope={idleScope()} />);
    expect(screen.getByTestId("empty-filter")).toBeInTheDocument();
  });

  it("mostra checkboxes para selecção de branches", () => {
    useGitStore.setState({
      repositoryPath: "/repo",
      branches: [
        { name: "main", isHead: true, isRemote: false },
        { name: "dev", isHead: false, isRemote: false },
      ],
      headDisplay: "main",
      detached: false,
      branchFilter: "",
      selectedBranches: ["main"],
    });
    render(
      <ScopeCommitsStep scope={idleScope({ noBranchesSelected: false })} />,
    );
    expect(screen.getByTestId("branch-check-main")).toBeInTheDocument();
    expect(screen.getByTestId("branch-check-dev")).toBeInTheDocument();
  });

  it("actualiza a lista ao mudar o filtro de branches", () => {
    useGitStore.setState({
      repositoryPath: "/repo",
      branches: [
        { name: "main", isHead: true, isRemote: false },
        { name: "feature/foo", isHead: false, isRemote: false },
      ],
      headDisplay: "main",
      detached: false,
      branchFilter: "",
      selectedBranches: [],
    });
    render(<ScopeCommitsStep scope={idleScope()} />);
    expect(screen.getByTestId("branch-check-main")).toBeInTheDocument();
    expect(screen.getByTestId("branch-check-feature/foo")).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Substring (sem maiúsculas)"),
      { target: { value: "feature" } },
    );

    expect(screen.queryByTestId("branch-check-main")).not.toBeInTheDocument();
    expect(screen.getByTestId("branch-check-feature/foo")).toBeInTheDocument();
  });

  it("avisa quando nenhuma branch está seleccionada", () => {
    useGitStore.setState({
      repositoryPath: "/repo",
      branches: [{ name: "main", isHead: true, isRemote: false }],
      headDisplay: "main",
      detached: false,
      branchFilter: "",
      selectedBranches: [],
    });
    render(<ScopeCommitsStep scope={idleScope({ noBranchesSelected: true })} />);
    expect(screen.getByTestId("no-branches-warning")).toBeInTheDocument();
  });
});
