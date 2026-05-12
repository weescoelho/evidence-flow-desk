import "./globals.css";

import {
  FileCheck,
  FileText,
  FolderGit2,
  ImagePlus,
  LayoutTemplate,
  Settings,
} from "lucide-react";
import { useEffect } from "react";

import { EvidenceCreationWizard, useGitStore } from "@/features/git";
import { cn } from "@/lib/utils";

const SIDEBAR_NAV = [
  {
    id: "repos",
    label: "Repositórios",
    icon: FolderGit2,
    available: true,
  },
  {
    id: "templates",
    label: "Templates",
    icon: LayoutTemplate,
    available: false,
  },
  {
    id: "screenshots",
    label: "Screenshots",
    icon: ImagePlus,
    available: false,
  },
  {
    id: "documents",
    label: "Documentos",
    icon: FileText,
    available: false,
  },
  {
    id: "settings",
    label: "Configurações",
    icon: Settings,
    available: false,
  },
] as const;

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
          {SIDEBAR_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "repos";
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                aria-disabled={!item.available}
                disabled={!item.available}
                title={
                  item.available
                    ? undefined
                    : "Disponível numa versão seguinte (histórico e vistas globais)."
                }
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[10px] px-[14px] py-3 text-left transition-colors",
                  isActive &&
                    "border border-border bg-sidebar-accent text-foreground",
                  !isActive && "border border-transparent",
                  item.available &&
                    !isActive &&
                    "text-muted-foreground hover:bg-muted/60",
                  !item.available &&
                    "cursor-not-allowed text-muted-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[13px]",
                    isActive ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Ambiente local — processamento offline.
        </p>
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto bg-background px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <EvidenceCreationWizard />
      </main>
    </div>
  );
}

export default App;
