import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.hoisted(() => vi.fn());
const openMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => openMock(...args),
}));

import { useGitRepository } from "./use-git-repository";
import { resetGitStore } from "../test/store-reset";
import { useGitStore } from "../store/git-store";

describe("useGitRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGitStore();
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === "validate_git_repository") {
        return { canonicalPath: "/abs/repo" };
      }
      if (cmd === "list_branches") {
        return {
          branches: [
            { name: "main", isHead: true, isRemote: false },
            { name: "dev", isHead: false, isRemote: false },
          ],
          headDisplay: "main",
          detached: false,
        };
      }
      if (cmd === "recent_repositories_list") return [];
      if (cmd === "recent_repositories_add") return undefined;
      if (cmd === "recent_repositories_remove") return undefined;
      throw new Error(`invoke inesperado: ${cmd}`);
    });
    openMock.mockResolvedValue("/picked");
  });

  it("chooseFolder usa diálogo e preenche o repositório na store", async () => {
    const { result } = renderHook(() => useGitRepository());
    await act(async () => {
      await result.current.chooseFolder();
    });
    expect(openMock).toHaveBeenCalled();
    expect(useGitStore.getState().repositoryPath).toBe("/abs/repo");
    expect(useGitStore.getState().branches).toHaveLength(2);
  });
});
