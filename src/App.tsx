import "./globals.css";

import { FileCheck, FolderGit2 } from "lucide-react";
import { useEffect } from "react";

import { BranchList, RepositorySection, ScopeSummary, useGitStore } from "@/features/git";
import { EvidenceScreenshotsSection } from "@/features/evidence";

function App() {
  const refreshRecentRepos = useGitStore((s) => s.refreshRecentRepos);

  useEffect(() => {
    void refreshRecentRepos();
  }, [refreshRecentRepos]);

  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-1 flex-col bg-background font-mono text-foreground md:flex-row">
      <aside
        className="flex w-full shrink-0 flex-col gap-[22px] border-b border-border bg-sidebar px-[18px] py-6 md:w-[276px] md:border-b-0 md:border-r md:py-7"
        aria-label="Navegação lateral"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
            <FileCheck className="size-[22px]" aria-hidden />
          </div>
          <span className="text-[17px] font-semibold leading-tight text-foreground">
            EvidenceFlow
          </span>
        </div>
        <nav className="flex flex-col gap-1.5" aria-label="Principal">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-sidebar-accent px-3.5 py-3">
            <FolderGit2
              className="size-[18px] text-primary"
              aria-hidden
            />
            <span className="text-[13px] font-semibold text-foreground">
              Repositórios
            </span>
          </div>
        </nav>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Ambiente local — processamento offline.
        </p>
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto bg-background px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
            Repositório Git
          </h1>
          <p className="text-sm text-muted-foreground">
            Valide uma pasta, compare refs, veja commits e ficheiros, gere resumo
            técnico, pré-visualize o documento e anexe screenshots à evidência.
          </p>
        </header>
        <RepositorySection />
        <BranchList />
        <ScopeSummary />
        <EvidenceScreenshotsSection />
      </main>
    </div>
  );
}

export default App;
