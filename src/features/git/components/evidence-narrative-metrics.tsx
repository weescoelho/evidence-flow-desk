import { useState } from "react";

import { Loader2 } from "lucide-react";

import {
  llmGenerateCorporateSummary,
  llmRewriteTechnicalSummary,
} from "@/features/document/api/evidence-app-state.commands";
import { useEvidenceMetadataStore } from "@/features/document/store/evidence-metadata-store";
import { invokeErrorMessage } from "@/lib/invoke-error-message";
import { cn } from "@/lib/utils";

import type { FileChangeRow } from "../types/git";

type IaPending = "rewrite" | "corporate" | null;

const IA_TONE = "formal";

type EvidenceNarrativeMetricsProps = {
  technicalNarrative: string;
  technicalNarrativeIsCustomized: boolean;
  onTechnicalNarrativeChange: (value: string) => void;
  onTechnicalNarrativeRestore: () => void;
  corporateNarrative: string;
  onCorporateNarrativeChange: (value: string) => void;
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
 * Coluna esquerda: resumos + Gemini (Fase 2); direita: métricas (UI-R03).
 */
export function EvidenceNarrativeMetrics({
  technicalNarrative,
  technicalNarrativeIsCustomized,
  onTechnicalNarrativeChange,
  onTechnicalNarrativeRestore,
  corporateNarrative,
  onCorporateNarrativeChange,
  files,
}: EvidenceNarrativeMetricsProps) {
  const { add, rem, touched } = aggregateLines(files);
  const geminiReady = useEvidenceMetadataStore((s) => s.aiGeminiApiKeyConfigured);
  const [iaPending, setIaPending] = useState<IaPending>(null);
  const [iaError, setIaError] = useState<string | null>(null);
  const iaBusy = iaPending !== null;

  async function handleRewriteTechnical() {
    if (!technicalNarrative.trim()) return;
    setIaError(null);
    setIaPending("rewrite");
    try {
      const next = await llmRewriteTechnicalSummary(
        technicalNarrative,
        IA_TONE,
      );
      onTechnicalNarrativeChange(next);
    } catch (e) {
      setIaError(
        invokeErrorMessage(
          e,
          "Não foi possível contactar o Gemini.",
        ),
      );
    } finally {
      setIaPending(null);
    }
  }

  async function handleCorporate() {
    if (!technicalNarrative.trim()) return;
    setIaError(null);
    setIaPending("corporate");
    try {
      const next = await llmGenerateCorporateSummary(
        technicalNarrative,
        IA_TONE,
      );
      onCorporateNarrativeChange(next);
    } catch (e) {
      setIaError(
        invokeErrorMessage(
          e,
          "Não foi possível contactar o Gemini.",
        ),
      );
    } finally {
      setIaPending(null);
    }
  }

  return (
    <div
      className="grid gap-4 font-mono lg:grid-cols-[minmax(0,1fr)_360px]"
      aria-busy={iaBusy}
    >
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
                disabled={
                  iaBusy || !technicalNarrativeIsCustomized
                }
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
              aria-disabled={iaBusy}
              disabled={iaBusy}
              rows={14}
              className="max-h-[min(28rem,55vh)] min-h-[12rem] w-full resize-y overflow-y-auto rounded-[10px] border border-[#E4E4E7] bg-white px-2.5 py-2 font-mono text-[12px] leading-relaxed text-[#18181B] placeholder:text-[#71717A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35 disabled:cursor-wait disabled:opacity-60"
              data-testid="technical-summary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {iaBusy ? (
            <p
              className="flex items-center gap-2 text-[12px] text-[#71717A]"
              aria-live="polite"
            >
              <Loader2
                className="size-4 shrink-0 animate-spin text-[#5946DB]"
                aria-hidden
              />
              {iaPending === "rewrite"
                ? "A contactar o Gemini para reescrever o resumo técnico…"
                : "A contactar o Gemini para o resumo corporativo…"}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={
                !geminiReady ||
                iaBusy ||
                !technicalNarrative.trim()
              }
              title={
                geminiReady
                  ? "Reescreve com Google Gemini (tom formal)"
                  : "Configure a chave API em Configurações (Gemini)."
              }
              onClick={() => void handleRewriteTechnical()}
              className={cn(
                "flex h-[34px] min-w-[11rem] items-center justify-center gap-2 rounded-[10px] border px-3 text-[12px] font-semibold",
                geminiReady && technicalNarrative.trim()
                  ? "border-[#5946DB] bg-[#5946DB] text-white hover:opacity-95"
                  : "border-[#E4E4E7] bg-[#F4F4F5] text-[#71717A]",
              )}
            >
              {iaPending === "rewrite" ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  A processar…
                </>
              ) : (
                "Regenerar com IA"
              )}
            </button>
            <span
              className="flex h-[34px] items-center rounded-[10px] border border-transparent px-3 text-[12px] font-semibold text-[#5946DB] opacity-80"
              aria-hidden
            >
              Tone: formal · Gemini
            </span>
          </div>
          {!geminiReady ? (
            <p className="text-[11px] text-[#71717A]">
              IA desactivada: defina a chave em{" "}
              <span className="font-semibold text-[#18181B]">Configurações</span>.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <span className="text-[12px] font-semibold text-[#71717A]">
              Resumo corporativo
            </span>
            <button
              type="button"
              disabled={
                !geminiReady ||
                iaBusy ||
                !technicalNarrative.trim()
              }
              title={
                geminiReady
                  ? "Gera texto de negócio a partir do resumo técnico (Gemini)"
                  : "Configure a chave API em Configurações."
              }
              onClick={() => void handleCorporate()}
              className={cn(
                "flex min-w-[10.5rem] items-center justify-center gap-2 rounded-[10px] border px-3 py-1.5 text-[11px] font-semibold",
                geminiReady && technicalNarrative.trim()
                  ? "border-[#E4E4E7] bg-white text-[#18181B] hover:bg-[#F4F4F5]"
                  : "border-[#E4E4E7] bg-[#F4F4F5] text-[#71717A]",
              )}
            >
              {iaPending === "corporate" ? (
                <>
                  <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                  A gerar…
                </>
              ) : (
                "Gerar com Gemini"
              )}
            </button>
          </div>
          <textarea
            value={corporateNarrative}
            onChange={(e) => onCorporateNarrativeChange(e.target.value)}
            rows={5}
            disabled={iaBusy}
            aria-disabled={iaBusy}
            placeholder="Texto orientado ao negócio (RF-007). Pode gerar a partir do resumo técnico ou escrever manualmente."
            aria-label="Resumo corporativo editável"
            className="min-h-[6rem] resize-y rounded-[10px] border border-[#E4E4E7] bg-white px-3 py-2 font-mono text-[12px] text-[#18181B] placeholder:text-[#71717A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5946DB]/35 disabled:cursor-wait disabled:opacity-60"
          />
        </div>

        {iaError ? (
          <p className="text-[12px] text-destructive" role="alert">
            {iaError}
          </p>
        ) : null}
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
