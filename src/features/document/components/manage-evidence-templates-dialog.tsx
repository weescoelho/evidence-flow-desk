import { Trash2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  createEvidenceCustomTemplate,
  deleteEvidenceCustomTemplate,
  evidencePreferenceKeys,
  loadEvidenceAppPersistedState,
  setEvidencePreference,
} from "../api/evidence-app-state.commands";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";

type ManageEvidenceTemplatesDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ManageEvidenceTemplatesDialog({
  open,
  onClose,
}: ManageEvidenceTemplatesDialogProps) {
  const templates = useEvidenceMetadataStore((s) => s.templates);
  const setTemplates = useEvidenceMetadataStore((s) => s.setTemplates);
  const hydrated = useEvidenceMetadataStore((s) => s.hydrated);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function syncTemplatesAndMaybePersistActive() {
    const snap = await loadEvidenceAppPersistedState();
    setTemplates(snap.templates);
    if (hydrated) {
      const nextActive = useEvidenceMetadataStore.getState().activeTemplateId;
      void setEvidencePreference(
        evidencePreferenceKeys.activeTemplateId,
        nextActive,
      );
    }
  }

  async function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Indique um nome para o preset.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createEvidenceCustomTemplate(trimmed);
      setLabel("");
      await syncTemplatesAndMaybePersistActive();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível criar o template.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteEvidenceCustomTemplate(id);
      await syncTemplatesAndMaybePersistActive();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível remover o template.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/35 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-templates-title"
        className={cn(
          "max-h-[min(90dvh,560px)] w-full max-w-[440px] overflow-y-auto rounded-[12px]",
          "border border-[#E4E4E7] bg-white p-5 shadow-lg",
        )}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2
              id="manage-templates-title"
              className="font-mono text-[15px] font-semibold text-[#18181B]"
            >
              Gerenciar templates
            </h2>
            <p className="mt-1 font-mono text-[12px] text-[#71717A]">
              Presets ficam na base SQLite local. O corpo do documento é o mesmo
              MVP; altera-se o rótulo no PDF/HTML.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-[8px] px-2 py-1 font-mono text-[12px] text-[#5946DB] hover:bg-[#F4F4F5]"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-mono text-[12px] font-semibold text-[#71717A]">
              Novo preset
            </span>
            <input
              type="text"
              value={label}
              disabled={busy}
              maxLength={200}
              placeholder="ex.: Release notes — retail"
              className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 font-mono text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              onChange={(ev) => setLabel(ev.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            className="h-10 shrink-0 rounded-[10px] bg-[#5946DB] px-4 font-mono text-[13px] font-semibold text-white hover:bg-[#4b3bc4] disabled:opacity-50"
            onClick={() => void handleAdd()}
          >
            Adicionar
          </button>
        </div>

        {error ? (
          <p className="mb-3 font-mono text-[12px] text-destructive">
            {error}
          </p>
        ) : null}

        <ul className="flex flex-col gap-2">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-[13px] text-[#18181B]">
                  {t.label}
                </p>
                <p className="font-mono text-[11px] text-[#71717A]">
                  {t.isBuiltin ? "Integrado" : `id: ${t.id.slice(0, 8)}…`}
                </p>
              </div>
              {t.isBuiltin ? (
                <span className="shrink-0 font-mono text-[11px] text-[#71717A]">
                  —
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  title="Remover preset personalizado"
                  className="flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-[#E4E4E7] bg-white text-[#71717A] hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  onClick={() => void handleDelete(t.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
