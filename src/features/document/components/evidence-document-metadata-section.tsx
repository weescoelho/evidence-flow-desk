import { ChevronDown } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

import {
  TEMPLATE_OPTIONS,
  useEvidenceMetadataStore,
  type EvidenceTemplateId,
} from "../store/evidence-metadata-store";

type EvidenceDocumentMetadataSectionProps = {
  repositoryPath: string | null;
};

/**
 * Secção «Template e campos do documento» + Change ID + Ambiente (UI-R03).
 */
export function EvidenceDocumentMetadataSection({
  repositoryPath,
}: EvidenceDocumentMetadataSectionProps) {
  const {
    activeTemplateId,
    setActiveTemplateId,
    changeId,
    setChangeId,
    environment,
    setEnvironment,
    resetSession,
  } = useEvidenceMetadataStore();

  useEffect(() => {
    resetSession();
  }, [repositoryPath, resetSession]);

  if (!repositoryPath) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-[#E4E4E7] bg-white p-6",
        "font-mono text-[#18181B]",
      )}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <h3 className="text-[14px] font-semibold text-[#18181B]">
            Template e campos do documento
          </h3>
          <p className="text-[12px] text-[#71717A]">
            Use um preset corporativo e preencha metadados de rastreio.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Disponível numa versão seguinte"
          className="flex h-[38px] shrink-0 cursor-not-allowed items-center justify-center rounded-[10px] border border-[#E4E4E7] px-[14px] text-[12px] font-semibold text-[#71717A] opacity-60"
        >
          Gerenciar templates
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-[#71717A]">
          Template ativo
        </span>
        <div className="relative">
          <select
            aria-label="Template ativo"
            value={activeTemplateId}
            onChange={(e) =>
              setActiveTemplateId(e.target.value as EvidenceTemplateId)
            }
            className="h-[42px] w-full appearance-none rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] py-0 pl-3 pr-10 text-[13px] text-[#18181B] outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
          >
            {TEMPLATE_OPTIONS.map((t) => (
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Change ID / ticket
          </span>
          <input
            type="text"
            value={changeId}
            onChange={(e) => setChangeId(e.target.value)}
            placeholder="ex.: CHG-4821"
            className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Ambiente
          </span>
          <input
            type="text"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="ex.: HML — cluster azul"
            className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
          />
        </label>
      </div>
    </div>
  );
}
