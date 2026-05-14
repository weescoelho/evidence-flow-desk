import "./globals.css";

import {
  FileText,
  FolderGit2,
  ImagePlus,
  LayoutTemplate,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  EvidenceAppSettingsView,
  EvidenceDocumentsLibraryView,
  EvidenceScreenshotsLibraryView,
  EvidenceTemplatesLibraryView,
  useHydrateEvidenceAppState,
  useEvidencePreferenceSync,
} from "@/features/document";
import { EvidenceCreationWizard, useGitStore } from "@/features/git";
import { cn } from "@/lib/utils";

type SidebarNavId =
  | "repos"
  | "templates"
  | "screenshots"
  | "documents"
  | "settings";

const SIDEBAR_NAV: readonly {
  id: SidebarNavId;
  label: string;
  icon: typeof FolderGit2;
  available: boolean;
}[] = [
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
    available: true,
  },
  {
    id: "screenshots",
    label: "Screenshots",
    icon: ImagePlus,
    available: true,
  },
  {
    id: "documents",
    label: "Documentos",
    icon: FileText,
    available: true,
  },
  {
    id: "settings",
    label: "Configurações",
    icon: Settings,
    available: true,
  },
];

function App() {
  const [activeSection, setActiveSection] = useState<SidebarNavId>("repos");
  const refreshRecentRepos = useGitStore((s) => s.refreshRecentRepos);

  useHydrateEvidenceAppState();
  useEvidencePreferenceSync();

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
          <img
            src="/app-icon.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-[10px] object-cover"
            draggable={false}
            aria-hidden
          />
          <span className="text-[17px] font-semibold leading-tight text-foreground">
            EvidenceFlow
          </span>
        </div>
        <nav className="flex flex-col gap-1.5" aria-label="Principal">
          {SIDEBAR_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.available && item.id === activeSection;
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
                    : "Disponível numa versão seguinte."
                }
                onClick={() => {
                  if (item.available) setActiveSection(item.id);
                }}
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
        {activeSection === "documents" ? (
          <EvidenceDocumentsLibraryView
            onNavigateToRepos={() => setActiveSection("repos")}
          />
        ) : activeSection === "settings" ? (
          <EvidenceAppSettingsView />
        ) : activeSection === "templates" ? (
          <EvidenceTemplatesLibraryView />
        ) : activeSection === "screenshots" ? (
          <EvidenceScreenshotsLibraryView />
        ) : (
          <EvidenceCreationWizard />
        )}
      </main>
    </div>
  );
}

export default App;
