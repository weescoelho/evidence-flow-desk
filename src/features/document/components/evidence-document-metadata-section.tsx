import { useEffect } from "react";

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
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <h3 className="font-mono text-[14px] font-semibold text-foreground">
            Template e campos do documento
          </h3>
          <p className="font-mono text-[12px] text-muted-foreground">
            Use um preset corporativo e preencha metadados de rastreio.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Disponível numa versão seguinte"
          className="flex h-[38px] shrink-0 items-center justify-center rounded-[10px] border border-border px-[14px] font-mono text-[12px] font-semibold text-foreground opacity-60"
        >
          Gerenciar templates
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[12px] font-semibold text-muted-foreground">
          Template ativo
        </span>
        <div className="relative">
          <select
            aria-label="Template ativo"
            value={activeTemplateId}
            onChange={(e) =>
              setActiveTemplateId(e.target.value as EvidenceTemplateId)
            }
            className="h-[42px] w-full appearance-none rounded-[10px] border border-border bg-muted/50 pl-3 pr-10 font-mono text-[13px] text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {TEMPLATE_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          >
            ▾
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[12px] font-semibold text-muted-foreground">
            Change ID / ticket
          </span>
          <input
            type="text"
            value={changeId}
            onChange={(e) => setChangeId(e.target.value)}
            placeholder="ex.: CHG-4821"
            className="h-10 rounded-[10px] border border-border bg-background px-3 font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[12px] font-semibold text-muted-foreground">
            Ambiente
          </span>
          <input
            type="text"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="ex.: HML — cluster azul"
            className="h-10 rounded-[10px] border border-border bg-background px-3 font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </label>
      </div>
    </div>
  );
}
