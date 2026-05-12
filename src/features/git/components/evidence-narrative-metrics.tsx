import { cn } from "@/lib/utils";

import type { FileChangeRow } from "../types/git";

type EvidenceNarrativeMetricsProps = {
  technicalNarrative: string;
  technicalNarrativeIsCustomized: boolean;
  onTechnicalNarrativeChange: (value: string) => void;
  onTechnicalNarrativeRestore: () => void;
  files: FileChangeRow[];
};

function aggregateLines(files: FileChangeRow[]) {
  let add = 0;
  let rem = 0;
  for (const f of files) {
    add += f.linesAdded;
    rem += f.linesRemoved;
  }
  return { add, rem, touched: files.length };
}

/**
 * Coluna esquerda: resumos + placeholders Fase 2; direita: métricas (UI-R03).
 */
export function EvidenceNarrativeMetrics({
  technicalNarrative,
  technicalNarrativeIsCustomized,
  onTechnicalNarrativeChange,
  onTechnicalNarrativeRestore,
  files,
}: EvidenceNarrativeMetricsProps) {
  const { add, rem, touched } = aggregateLines(files);

  return (
    <div className="grid gap-4 font-mono lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Resumo técnico
          </span>
          <div className="rounded-[10px] border border-[#E4E4E7] bg-white p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#71717A]">
              <p>
                Gerado a partir dos commits e do diff — pode editar o texto antes
                de pré-visualizar ou exportar (não substitui revisão humana).
              </p>
              <button
                type="button"
                disabled={!technicalNarrativeIsCustomized}
                onClick={() => onTechnicalNarrativeRestore()}
                title={
                  technicalNarrativeIsCustomized
                    ? undefined
                    : "O texto actual já é o automático."
                }
                className={cn(
                  "shrink-0 rounded-md border border-transparent px-2 py-1 font-semibold text-[#5946DB] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-45 disabled:no-underline",
                )}
              >
                Restaurar texto automático
              </button>
            </div>
            <textarea
              value={technicalNarrative}
              onChange={(e) => onTechnicalNarrativeChange(e.target.value)}
              aria-label="Resumo técnico editável"
              rows={14}
              className="max-h-[min(28rem,55vh)] min-h-[12rem] w-full resize-y overflow-y-auto rounded-[10px] border border-[#E4E4E7] bg-white px-2.5 py-2 font-mono text-[12px] leading-relaxed text-[#18181B] placeholder:text-[#71717A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              data-testid="technical-summary"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled
            title="Fase 2 — integração com IA local/remota"
            className="flex h-[34px] items-center justify-center rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] px-3 text-[12px] font-semibold text-[#71717A] opacity-70"
          >
            Regenerar com IA
          </button>
          <span
            className="flex h-[34px] items-center rounded-[10px] border border-transparent px-3 text-[12px] font-semibold text-[#5946DB] opacity-80"
            aria-hidden
          >
            Tone: formal
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Resumo corporativo
          </span>
          <textarea
            disabled
            rows={3}
            readOnly
            value=""
            placeholder="Disponível com RF-007 / fase 2 (texto orientado ao negócio)."
            className="resize-none rounded-[10px] border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-2 font-mono text-[12px] text-[#71717A] placeholder:text-[#71717A]"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <span className="text-[12px] font-semibold text-[#71717A]">
          Mudanças no código
        </span>
        <div className="overflow-hidden rounded-[10px] border border-[#E4E4E7] bg-white">
          <div className="flex justify-between border-b border-[#E4E4E7] px-3.5 py-2 text-[11px] font-semibold text-[#71717A]">
            <span>Métrica</span>
            <span>Valor</span>
          </div>
          <div className="flex justify-between px-3.5 py-2.5 text-[12px]">
            <span className="text-[#18181B]">Ficheiros analisados</span>
            <span className="font-semibold text-[#18181B]">{touched}</span>
          </div>
          <div className="h-px bg-[#E4E4E7]" />
          <div className="flex justify-between px-3.5 py-2.5 text-[12px]">
            <span className="text-[#18181B]">Linhas +/-</span>
            <span
              className={cn(
                "text-[12px] font-semibold",
                add > 0 || rem > 0 ? "text-destructive" : "text-[#18181B]",
              )}
            >
              +{add} / −{rem}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
