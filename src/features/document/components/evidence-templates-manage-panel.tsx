import { Trash2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { invokeErrorMessage } from "@/lib/invoke-error-message";
import {
  type PersistedEvidenceTemplate,
  createEvidenceCustomTemplate,
  deleteEvidenceCustomTemplate,
  evidencePreferenceKeys,
  loadEvidenceAppPersistedState,
  setEvidencePreference,
  setEvidenceTemplateHeaderImages,
  setEvidenceTemplateLayout,
} from "../api/evidence-app-state.commands";
import {
  EVIDENCE_TEMPLATE_LAYOUT_KEYS,
  EVIDENCE_TEMPLATE_LAYOUT_LABELS,
  normalizeEvidenceTemplateLayoutKey,
  type EvidenceTemplateLayoutKey,
} from "../lib/evidence-template-layouts";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";

const MAX_HEADER_IMAGE_FILE_BYTES = Math.floor(3.5 * 1024 * 1024);

function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === "string") resolve(r.result);
      else reject(new Error("Leitura inválida"));
    };
    r.onerror = () => reject(new Error("Falha ao ler o ficheiro"));
    r.readAsDataURL(file);
  });
}

export type EvidenceTemplatesManagePanelProps = {
  className?: string;
  heading?: string;
  headingId?: string;
  intro?: string;
  onRequestClose?: () => void;
};

export function EvidenceTemplatesManagePanel({
  className,
  heading = "Gerenciar templates",
  headingId,
  intro = "Cada preset tem um nome (rótulo no PDF), modelo visual e imagens opcionais no topo do documento (esquerda e direita). O conteúdo do relatório segue o mesmo conjunto de secções; mudam tipografia e ênfase (subset RF-009).",
  onRequestClose,
}: EvidenceTemplatesManagePanelProps) {
  const templates = useEvidenceMetadataStore((s) => s.templates);
  const setTemplates = useEvidenceMetadataStore((s) => s.setTemplates);
  const hydrated = useEvidenceMetadataStore((s) => s.hydrated);
  const [label, setLabel] = useState("");
  const [newLayoutKey, setNewLayoutKey] =
    useState<EvidenceTemplateLayoutKey>("enterprise");
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
      await createEvidenceCustomTemplate(trimmed, newLayoutKey);
      setLabel("");
      setNewLayoutKey("enterprise");
      await syncTemplatesAndMaybePersistActive();
    } catch (e) {
      setError(invokeErrorMessage(e, "Não foi possível criar o template."));
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
      setError(invokeErrorMessage(e, "Não foi possível remover o template."));
    } finally {
      setBusy(false);
    }
  }

  async function handleLayoutChange(
    templateId: string,
    layoutKey: EvidenceTemplateLayoutKey,
  ) {
    setBusy(true);
    setError(null);
    try {
      await setEvidenceTemplateLayout(templateId, layoutKey);
      await syncTemplatesAndMaybePersistActive();
    } catch (e) {
      setError(
        invokeErrorMessage(e, "Não foi possível actualizar o modelo visual."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function persistHeaderImages(t: PersistedEvidenceTemplate, left: string, right: string) {
    setBusy(true);
    setError(null);
    try {
      await setEvidenceTemplateHeaderImages(t.id, left, right);
      await syncTemplatesAndMaybePersistActive();
    } catch (e) {
      setError(
        invokeErrorMessage(e, "Não foi possível gravar as imagens do template."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleHeaderFile(
    t: PersistedEvidenceTemplate,
    side: "left" | "right",
    files: FileList | null,
  ) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_HEADER_IMAGE_FILE_BYTES) {
      setError("Imagem demasiado grande (máx. ~3,5 MB).");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Escolha um ficheiro de imagem (PNG, JPEG, GIF ou WebP).");
      return;
    }
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      await persistHeaderImages(
        t,
        side === "left" ? dataUrl : (t.headerImageLeft ?? ""),
        side === "right" ? dataUrl : (t.headerImageRight ?? ""),
      );
    } catch (e) {
      setError(invokeErrorMessage(e, "Não foi possível ler a imagem."));
    }
  }

  function clearHeaderImage(t: PersistedEvidenceTemplate, side: "left" | "right") {
    void persistHeaderImages(
      t,
      side === "left" ? "" : (t.headerImageLeft ?? ""),
      side === "right" ? "" : (t.headerImageRight ?? ""),
    );
  }

  return (
    <div
      className={cn(
        "rounded-[12px] border border-[#E4E4E7] bg-white p-5 font-mono",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2
            id={headingId}
            className="text-[15px] font-semibold text-[#18181B]"
          >
            {heading}
          </h2>
          <p className="mt-1 text-[12px] text-[#71717A]">{intro}</p>
        </div>
        {onRequestClose ? (
          <button
            type="button"
            className="shrink-0 rounded-[8px] px-2 py-1 text-[12px] text-[#5946DB] hover:bg-[#F4F4F5]"
            onClick={onRequestClose}
          >
            Fechar
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Novo preset
          </span>
          <input
            type="text"
            value={label}
            disabled={busy}
            maxLength={200}
            placeholder="ex.: Release notes — retail"
            className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
            onChange={(ev) => setLabel(ev.target.value)}
          />
        </label>
        <label className="flex w-full flex-col gap-1 sm:w-[min(100%,280px)]">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Modelo visual
          </span>
          <select
            disabled={busy}
            value={newLayoutKey}
            className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
            onChange={(ev) =>
              setNewLayoutKey(
                normalizeEvidenceTemplateLayoutKey(ev.target.value),
              )
            }
          >
            {EVIDENCE_TEMPLATE_LAYOUT_KEYS.map((k) => (
              <option key={k} value={k}>
                {EVIDENCE_TEMPLATE_LAYOUT_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          className="h-10 shrink-0 rounded-[10px] bg-[#5946DB] px-4 text-[13px] font-semibold text-white hover:bg-[#4b3bc4] disabled:opacity-50"
          onClick={() => void handleAdd()}
        >
          Adicionar
        </button>
      </div>

      {error ? (
        <p className="mb-3 text-[12px] text-destructive">{error}</p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {templates.map((t) => {
          const lk = normalizeEvidenceTemplateLayoutKey(t.layoutKey);
          const leftId = `template-hdr-left-${t.id}`;
          const rightId = `template-hdr-right-${t.id}`;
          const hasLeft = Boolean(t.headerImageLeft?.trim());
          const hasRight = Boolean(t.headerImageRight?.trim());
          return (
            <li
              key={t.id}
              className="flex flex-col gap-2 rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-2.5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[#18181B]">{t.label}</p>
                  <p className="text-[11px] text-[#71717A]">
                    {t.isBuiltin ? "Integrado" : `id: ${t.id.slice(0, 8)}…`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-[#71717A]">
                      Modelo PDF/HTML
                    </span>
                    <select
                      disabled={busy}
                      value={lk}
                      className="h-9 min-w-[200px] rounded-[10px] border border-[#E4E4E7] bg-white px-2 text-[12px]"
                      onChange={(ev) =>
                        void handleLayoutChange(
                          t.id,
                          normalizeEvidenceTemplateLayoutKey(ev.target.value),
                        )
                      }
                    >
                      {EVIDENCE_TEMPLATE_LAYOUT_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {EVIDENCE_TEMPLATE_LAYOUT_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {t.isBuiltin ? (
                    <span className="hidden shrink-0 text-[11px] text-[#71717A] sm:inline sm:w-9" />
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
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-[#E4E4E7] pt-2 sm:flex-row sm:gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[10px] font-medium text-[#71717A]">
                    Topo — esquerda
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id={leftId}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      disabled={busy}
                      className="sr-only"
                      onChange={(ev) => {
                        void handleHeaderFile(t, "left", ev.target.files);
                        ev.target.value = "";
                      }}
                    />
                    <label
                      htmlFor={leftId}
                      className="inline-flex h-8 cursor-pointer items-center rounded-[8px] border border-[#E4E4E7] bg-white px-2.5 text-[11px] font-semibold text-[#18181B] hover:bg-[#FAFAFA] disabled:opacity-50"
                    >
                      Carregar…
                    </label>
                    {hasLeft ? (
                      <>
                        <img
                          src={t.headerImageLeft ?? ""}
                          alt=""
                          className="h-10 max-w-[100px] object-contain"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          className="text-[11px] font-semibold text-[#71717A] underline hover:text-[#18181B]"
                          onClick={() => clearHeaderImage(t, "left")}
                        >
                          Remover
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[10px] font-medium text-[#71717A]">
                    Topo — direita
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id={rightId}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      disabled={busy}
                      className="sr-only"
                      onChange={(ev) => {
                        void handleHeaderFile(t, "right", ev.target.files);
                        ev.target.value = "";
                      }}
                    />
                    <label
                      htmlFor={rightId}
                      className="inline-flex h-8 cursor-pointer items-center rounded-[8px] border border-[#E4E4E7] bg-white px-2.5 text-[11px] font-semibold text-[#18181B] hover:bg-[#FAFAFA] disabled:opacity-50"
                    >
                      Carregar…
                    </label>
                    {hasRight ? (
                      <>
                        <img
                          src={t.headerImageRight ?? ""}
                          alt=""
                          className="h-10 max-w-[100px] object-contain"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          className="text-[11px] font-semibold text-[#71717A] underline hover:text-[#18181B]"
                          onClick={() => clearHeaderImage(t, "right")}
                        >
                          Remover
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
