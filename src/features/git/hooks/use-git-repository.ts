import { open } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";

import { useGitStore } from "../store/git-store";

export function useGitRepository() {
  const selectRepository = useGitStore((s) => s.selectRepository);
  const refreshRecentRepos = useGitStore((s) => s.refreshRecentRepos);

  const chooseFolder = useCallback(async () => {
    const picked = await open({
      directory: true,
      multiple: false,
      title: "Escolher repositório Git",
    });
    if (picked === null) return;
    const path = Array.isArray(picked) ? picked[0] : picked;
    if (!path) return;
    await selectRepository(path);
  }, [selectRepository]);

  const openFromRecent = useCallback(
    async (path: string) => {
      await selectRepository(path, { fromRecent: true });
    },
    [selectRepository]
  );

  const reloadRecent = useCallback(async () => {
    await refreshRecentRepos();
  }, [refreshRecentRepos]);

  return { chooseFolder, openFromRecent, reloadRecent };
}
