import { useGitStore } from "../store/git-store";

import { resetEvidenceSession } from "../lib/reset-evidence-session";

/** Reset determinístico para testes (inclui MRU vazio). */
export function resetGitStore() {
  resetEvidenceSession();
  useGitStore.setState({ recentRepos: [] });
}
