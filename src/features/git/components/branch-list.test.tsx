import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { BranchList } from "./branch-list";
import { resetGitStore } from "../test/store-reset";
import { useGitStore } from "../store/git-store";

describe("BranchList", () => {
  beforeEach(() => resetGitStore());

  it("indica lista vazia por filtro", () => {
    useGitStore.setState({
      repositoryPath: "/repo",
      branches: [{ name: "main", isHead: true }],
      headDisplay: "main",
      detached: false,
      branchFilter: "zzz",
    });
    render(<BranchList />);
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
    render(<BranchList />);
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
    render(<BranchList />);
    expect(screen.getAllByTestId("compare-same-warning").length).toBeGreaterThanOrEqual(1);
  });
});
