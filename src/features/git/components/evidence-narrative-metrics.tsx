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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[12px] font-semibold text-muted-foreground">
            Resumo técnico
          </span>
          <div className="rounded-[10px] border border-border bg-background p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
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
                  "shrink-0 rounded-md border border-transparent px-2 py-1 font-semibold text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-45 disabled:no-underline",
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
              className="max-h-[min(28rem,55vh)] min-h-[12rem] w-full resize-y overflow-y-auto rounded-md border border-border bg-card px-2.5 py-2 font-mono text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              data-testid="technical-summary"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled
            title="Fase 2 — integração com IA local/remota"
            className="flex h-[34px] items-center justify-center rounded-[10px] border border-border bg-muted/50 px-3 font-mono text-[12px] font-semibold text-foreground opacity-60"
          >
            Regenerar com IA
          </button>
          <span
            className="flex h-[34px] items-center rounded-[10px] border border-transparent px-3 font-mono text-[12px] font-semibold text-primary opacity-70"
            aria-hidden
          >
            Tone: formal
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[12px] font-semibold text-muted-foreground">
            Resumo corporativo
          </span>
          <textarea
            disabled
            rows={3}
            readOnly
            value=""
            placeholder="Disponível com RF-007 / fase 2 (texto orientado ao negócio)."
            className="resize-none rounded-[10px] border border-border bg-muted/30 px-3 py-2 font-mono text-[12px] text-muted-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <span className="font-mono text-[12px] font-semibold text-muted-foreground">
          Mudanças no código
        </span>
        <div className="overflow-hidden rounded-[10px] border border-border bg-background">
          <div className="flex justify-between border-b border-border px-3 py-2 font-mono text-[11px] font-semibold text-muted-foreground">
            <span>Métrica</span>
            <span>Valor</span>
          </div>
          <div className="flex justify-between px-3 py-2.5 font-mono text-[12px]">
            <span className="text-foreground">Ficheiros analisados</span>
            <span className="font-semibold text-foreground">{touched}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between px-3 py-2.5 font-mono text-[12px]">
            <span className="text-foreground">Linhas +/-</span>
            <span
              className={cn(
                "font-mono text-[12px] font-semibold",
                add > 0 || rem > 0 ? "text-destructive" : "text-foreground",
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
