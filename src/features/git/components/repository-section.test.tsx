import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RepositorySection } from "./repository-section";
import { resetGitStore } from "../test/store-reset";
import { useGitStore } from "../store/git-store";

vi.mock("../hooks/use-git-repository", () => ({
  useGitRepository: () => ({
    chooseFolder: vi.fn(),
    openFromRecent: vi.fn(),
    reloadRecent: vi.fn(),
  }),
}));

describe("RepositorySection", () => {
  beforeEach(() => {
    resetGitStore();
  });

  it("mostra alerta acessível quando há erro de validação", () => {
    useGitStore.setState({
      validationError: "Esta pasta não é um repositório Git.",
      errorCode: "not_a_git_repository",
    });
    render(<RepositorySection />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Esta pasta não é um repositório Git."
    );
  });
});
