import { ChevronDown } from "lucide-react";

import {
  evidencePreferenceKeys,
  setEvidencePreference,
} from "../api/evidence-app-state.commands";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";
import { EvidenceTemplatesManagePanel } from "./evidence-templates-manage-panel";

/**
 * Vista global Templates (UI-R01): preset ativo + CRUD SQLite, alinhado ao diálogo do passo 3.
 */
export function EvidenceTemplatesLibraryView() {
  const templates = useEvidenceMetadataStore((s) => s.templates);
  const activeTemplateId = useEvidenceMetadataStore((s) => s.activeTemplateId);
  const setActiveTemplateId = useEvidenceMetadataStore(
    (s) => s.setActiveTemplateId,
  );
  const hydrated = useEvidenceMetadataStore((s) => s.hydrated);

  function applyTemplateSelection(id: string) {
    setActiveTemplateId(id);
    if (hydrated) {
      void setEvidencePreference(evidencePreferenceKeys.activeTemplateId, id);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[12px] text-muted-foreground">
          Templates
        </p>
        <h1 className="font-mono text-[28px] font-semibold tracking-tight text-foreground">
          Modelos de documento
        </h1>
        <p className="max-w-[56ch] font-mono text-sm text-muted-foreground">
          O template ativo define o rótulo no HTML/PDF. Presets personalizados
          seguem o mesmo layout do MVP; edição visual de secções fica para fases
          posteriores (RF-009).
        </p>
      </header>

      <section
        className="flex flex-col gap-3 rounded-xl border border-[#E4E4E7] bg-white p-6 font-mono text-[#18181B]"
        aria-label="Template ativo"
      >
        <span className="text-[12px] font-semibold text-[#71717A]">
          Template ativo
        </span>
        <div className="relative max-w-md">
          <select
            aria-label="Template ativo"
            value={activeTemplateId}
            onChange={(ev) => applyTemplateSelection(ev.target.value)}
            className="h-[42px] w-full appearance-none rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] py-0 pl-3 pr-10 text-[13px] text-[#18181B] outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-[18px] -translate-y-1/2 text-[#71717A]"
            aria-hidden
          />
        </div>
      </section>

      <EvidenceTemplatesManagePanel
        heading="Presets guardados"
        intro="Adicione rótulos para distinguir exportações. Os dados vivem na base local da app."
      />
    </div>
  );
}
