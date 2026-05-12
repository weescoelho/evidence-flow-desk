import { useGitStore } from "../store/git-store";

export function resetGitStore() {
  useGitStore.setState({
    repositoryPath: null,
    validationError: null,
    errorCode: null,
    branches: [],
    headDisplay: "",
    detached: false,
    recentRepos: [],
    branchFilter: "",
    baseBranch: null,
    compareBranch: null,
  });
}
