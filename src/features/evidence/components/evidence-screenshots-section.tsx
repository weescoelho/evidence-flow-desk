import { useEffect, useId, useRef, useState } from "react";

import { useGitStore } from "@/features/git/store/git-store";

import { useEvidenceAttachmentsStore } from "../store/attachments-store";

export function EvidenceScreenshotsSection() {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [addWarnings, setAddWarnings] = useState<string[]>([]);
  const repositoryPath = useGitStore((s) => s.repositoryPath);
  const {
    attachments,
    scopeCommits,
    addFromFiles,
    remove,
    updateCaption,
    updateLinkedCommit,
    lastAddError,
    clearLastAddError,
  } = useEvidenceAttachmentsStore();

  useEffect(() => {
    useEvidenceAttachmentsStore.getState().clear();
  }, [repositoryPath]);

  if (!repositoryPath) {
    return null;
  }

  return (
    <section
      aria-labelledby={inputId}
      className="flex flex-col gap-4 rounded-xl border border-[#E4E4E7] bg-white p-6 font-mono"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id={inputId}
            className="text-[14px] font-semibold text-[#18181B]"
          >
            Screenshots e comparação
          </h2>
          <p className="mt-1 text-[12px] text-[#71717A]">
            Importe ficheiros ou anexe capturas; associe opcionalmente a um
            commit do escopo (RF-012 / RF-014).
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 sm:flex-row sm:gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="sr-only"
            data-testid="evidence-screenshot-input"
            onChange={(ev) => {
              clearLastAddError();
              setAddWarnings([]);
              const list = ev.target.files;
              if (!list?.length) return;
              const msgs = addFromFiles(Array.from(list));
              if (msgs.length) setAddWarnings(msgs);
              ev.target.value = "";
            }}
          />
          <button
            type="button"
            disabled
            title="Automatização / Playwright — fase 2"
            className="rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-1.5 text-[12px] font-medium text-[#71717A]"
          >
            Nova captura
          </button>
          <button
            type="button"
            className="rounded-[10px] border border-[#E4E4E7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#18181B] hover:bg-[#F4F4F5]"
            onClick={() => fileRef.current?.click()}
          >
            Importar arquivo
          </button>
        </div>
      </div>
      {addWarnings.length > 0 ? (
        <ul
          className="list-inside list-disc text-[12px] text-amber-700 dark:text-amber-400"
          data-testid="screenshot-add-warnings"
        >
          {addWarnings.map((w, i) => (
            <li key={`${i}-${w.slice(0, 24)}`}>{w}</li>
          ))}
        </ul>
      ) : null}
      {lastAddError ? (
        <p className="text-[12px] text-destructive" role="alert">
          {lastAddError}
        </p>
      ) : null}
      {attachments.length === 0 ? (
        <p className="text-[12px] text-[#71717A]">
          Nenhuma imagem anexada. Incluídas no documento de evidência e na
          exportação para PDF.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-2 rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] p-3 sm:flex-row"
            >
              <img
                src={a.dataUrl}
                alt={a.caption || a.fileName}
                className="h-24 w-auto max-w-[200px] shrink-0 rounded-[8px] border border-[#E4E4E7] bg-white object-contain"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2 text-[12px]">
                <p className="truncate text-[#71717A]">{a.fileName}</p>
                <label className="flex flex-col gap-1 text-[#71717A]">
                  Legenda
                  <input
                    value={a.caption}
                    onChange={(ev) => updateCaption(a.id, ev.target.value)}
                    className="rounded-[10px] border border-[#E4E4E7] bg-white px-2 py-1 text-[#18181B] outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[#71717A]">
                  Associar a commit
                  <select
                    value={a.linkedCommitHash ?? ""}
                    onChange={(ev) =>
                      updateLinkedCommit(
                        a.id,
                        ev.target.value ? ev.target.value : null,
                      )
                    }
                    className="rounded-[10px] border border-[#E4E4E7] bg-white px-2 py-1 font-mono text-[#18181B]"
                  >
                    <option value="">— Nenhum —</option>
                    {scopeCommits.map((c) => (
                      <option key={c.hash} value={c.hash}>
                        {c.shortHash} — {c.summary.slice(0, 60)}
                        {c.summary.length > 60 ? "…" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="self-start rounded-sm border border-destructive/50 px-2 py-1 text-destructive hover:bg-destructive/10"
                  onClick={() => remove(a.id)}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
