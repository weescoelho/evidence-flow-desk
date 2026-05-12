import "./globals.css";

import { FileCheck, FolderGit2 } from "lucide-react";
import { useEffect } from "react";

import { BranchList, RepositorySection, ScopeSummary, useGitStore } from "@/features/git";

function App() {
  const refreshRecentRepos = useGitStore((s) => s.refreshRecentRepos);

  useEffect(() => {
    void refreshRecentRepos();
  }, [refreshRecentRepos]);

  return (
    <div className="flex h-screen bg-background font-mono text-foreground">
      <aside className="flex w-[276px] shrink-0 flex-col gap-[22px] border-r border-border bg-sidebar px-[18px] py-7">
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
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto bg-background px-10 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
            Repositório Git
          </h1>
          <p className="text-sm text-muted-foreground">
            Valide uma pasta, compare refs, veja commits e ficheiros, gere resumo
            técnico e pré-visualize o documento de evidência (incl. exportar PDF
            via impressão).
          </p>
        </header>
        <RepositorySection />
        <BranchList />
        <ScopeSummary />
      </main>
    </div>
  );
}

export default App;
