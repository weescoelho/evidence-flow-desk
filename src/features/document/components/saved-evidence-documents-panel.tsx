import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { useCallback, useEffect, useState } from "react";

import {
  deleteSavedEvidenceDocument,
  listSavedEvidenceDocuments,
  type SavedEvidenceDocumentInfo,
} from "../api/evidence.commands";

function ellipsizePath(p: string, max = 52): string {
  if (p.length <= max) return p;
  const head = Math.ceil(max / 2) - 2;
  const tail = max - head - 3;
  return `${p.slice(0, head)}…${p.slice(-tail)}`;
}

function formatSavedAt(ms: number): string {
  try {
    return new Date(ms).toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export type SavedEvidenceDocumentsPanelProps = {
  /** Incrementado após uma gravação bem-sucedida para voltar a carregar a lista. */
  refreshKey?: number;
};

export function SavedEvidenceDocumentsPanel({
  refreshKey = 0,
}: SavedEvidenceDocumentsPanelProps) {
  const [items, setItems] = useState<SavedEvidenceDocumentInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listSavedEvidenceDocuments();
      setItems(list);
    } catch (e) {
      setItems([]);
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível listar os documentos guardados.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function handleOpen(path: string) {
    setActionError(null);
    try {
      await openPath(path);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Não foi possível abrir o ficheiro.",
      );
    }
  }

  async function handleReveal(path: string) {
    setActionError(null);
    try {
      await revealItemInDir(path);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Não foi possível abrir a pasta.",
      );
    }
  }

  async function handleRemove(id: string) {
    setActionError(null);
    setRemovingId(id);
    try {
      await deleteSavedEvidenceDocument(id);
      await load();
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : "Não foi possível remover o documento.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
      aria-label="Documentos de evidência guardados localmente"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Documentos guardados localmente
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Cópias HTML gravadas neste dispositivo (últimas entradas; as mais
            antigas são removidas ao atingir o limite).
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-[11px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
          data-testid="saved-evidence-refresh"
          disabled={items === null}
          onClick={() => void load()}
        >
          Atualizar
        </button>
      </div>

      {error ? (
        <p className="text-[11px] text-destructive" data-testid="saved-evidence-error">
          {error}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-[11px] text-destructive">{actionError}</p>
      ) : null}

      {items === null ? (
        <p className="font-mono text-[11px] text-muted-foreground">A carregar…</p>
      ) : items.length === 0 ? (
        <p className="font-mono text-[11px] text-muted-foreground">
          Ainda não há cópias guardadas. Use «Guardar cópia local (HTML)» acima.
        </p>
      ) : (
        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
          {items.map((doc) => (
            <li
              key={doc.id}
              className="rounded-md border border-border bg-muted/30 px-2.5 py-2 font-mono text-[11px]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-foreground">{formatSavedAt(doc.savedAtMs)}</span>
                <span className="text-muted-foreground">
                  {doc.baseRef}
                  <span aria-hidden> → </span>
                  {doc.compareRef}
                </span>
              </div>
              <p
                className="mt-1 truncate text-[10px] text-muted-foreground"
                title={doc.repositoryPath}
              >
                {ellipsizePath(doc.repositoryPath, 64)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="rounded border border-border bg-background px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted"
                  onClick={() => void handleOpen(doc.htmlPath)}
                >
                  Abrir HTML
                </button>
                <button
                  type="button"
                  className="rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => void handleReveal(doc.htmlPath)}
                >
                  Mostrar na pasta
                </button>
                <button
                  type="button"
                  className="rounded border border-destructive/40 bg-background px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  disabled={removingId !== null}
                  onClick={() => void handleRemove(doc.id)}
                >
                  {removingId === doc.id ? "A remover…" : "Remover"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
