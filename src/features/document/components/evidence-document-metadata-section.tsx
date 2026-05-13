import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  evidencePreferenceKeys,
  setEvidencePreference,
} from "../api/evidence-app-state.commands";
import { ManageEvidenceTemplatesDialog } from "./manage-evidence-templates-dialog";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";

type EvidenceDocumentMetadataSectionProps = {
  repositoryPath: string | null;
};

/**
 * Secção «Template e campos do documento» + Change ID + Ambiente (UI-R03).
 */
export function EvidenceDocumentMetadataSection({
  repositoryPath,
}: EvidenceDocumentMetadataSectionProps) {
  const [manageOpen, setManageOpen] = useState(false);
  const templates = useEvidenceMetadataStore((s) => s.templates);
  const activeTemplateId = useEvidenceMetadataStore((s) => s.activeTemplateId);
  const setActiveTemplateId = useEvidenceMetadataStore(
    (s) => s.setActiveTemplateId,
  );
  const changeId = useEvidenceMetadataStore((s) => s.changeId);
  const setChangeId = useEvidenceMetadataStore((s) => s.setChangeId);
  const environment = useEvidenceMetadataStore((s) => s.environment);
  const setEnvironment = useEvidenceMetadataStore((s) => s.setEnvironment);
  const productName = useEvidenceMetadataStore((s) => s.productName);
  const setProductName = useEvidenceMetadataStore((s) => s.setProductName);
  const releaseVersion = useEvidenceMetadataStore((s) => s.releaseVersion);
  const setReleaseVersion = useEvidenceMetadataStore((s) => s.setReleaseVersion);
  const deploymentDate = useEvidenceMetadataStore((s) => s.deploymentDate);
  const setDeploymentDate = useEvidenceMetadataStore((s) => s.setDeploymentDate);
  const technicalOwner = useEvidenceMetadataStore((s) => s.technicalOwner);
  const setTechnicalOwner = useEvidenceMetadataStore((s) => s.setTechnicalOwner);
  const approver = useEvidenceMetadataStore((s) => s.approver);
  const setApprover = useEvidenceMetadataStore((s) => s.setApprover);
  const outOfScope = useEvidenceMetadataStore((s) => s.outOfScope);
  const setOutOfScope = useEvidenceMetadataStore((s) => s.setOutOfScope);
  const documentVersion = useEvidenceMetadataStore((s) => s.documentVersion);
  const setDocumentVersion = useEvidenceMetadataStore((s) => s.setDocumentVersion);
  const documentRevisionDate = useEvidenceMetadataStore(
    (s) => s.documentRevisionDate,
  );
  const setDocumentRevisionDate = useEvidenceMetadataStore(
    (s) => s.setDocumentRevisionDate,
  );
  const documentRevisionSummary = useEvidenceMetadataStore(
    (s) => s.documentRevisionSummary,
  );
  const setDocumentRevisionSummary = useEvidenceMetadataStore(
    (s) => s.setDocumentRevisionSummary,
  );
  const documentRevisionAuthor = useEvidenceMetadataStore(
    (s) => s.documentRevisionAuthor,
  );
  const setDocumentRevisionAuthor = useEvidenceMetadataStore(
    (s) => s.setDocumentRevisionAuthor,
  );
  const hydrated = useEvidenceMetadataStore((s) => s.hydrated);

  if (!repositoryPath) {
    return null;
  }

  function applyTemplateSelection(id: string) {
    setActiveTemplateId(id);
    if (hydrated) {
      void setEvidencePreference(evidencePreferenceKeys.activeTemplateId, id);
    }
  }

  return (
    <>
      <ManageEvidenceTemplatesDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />
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
              Use um preset corporativo e preencha metadados de rastreio. O preset
              integrado segue estrutura de mercado (capa, escopo, changelog).
              Presets personalizados ficam no SQLite local (RF-015).
            </p>
          </div>
          <button
            type="button"
            className="flex h-[38px] shrink-0 items-center justify-center rounded-[10px] border border-[#E4E4E7] px-[14px] text-[12px] font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
            onClick={() => setManageOpen(true)}
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

        <div className="flex flex-col gap-2 border-t border-[#E4E4E7] pt-5">
          <h4 className="text-[13px] font-semibold text-[#18181B]">
            Capa e controlo do documento
          </h4>
          <p className="text-[12px] text-[#71717A]">
            Campos opcionais para o modelo IEEE / ITIL no PDF/HTML (vazios viram
            «—» ou valor por omissão).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-[#71717A]">
                Produto / sistema
              </span>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Omite para usar o nome da pasta do repositório"
                className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#71717A]">
                Versão da entrega
              </span>
              <input
                type="text"
                value={releaseVersion}
                onChange={(e) => setReleaseVersion(e.target.value)}
                placeholder="ex.: v2.3.1"
                className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#71717A]">
                Data de implantação
              </span>
              <input
                type="text"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
                placeholder="ex.: 12/05/2026"
                className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#71717A]">
                Responsável técnico
              </span>
              <input
                type="text"
                value={technicalOwner}
                onChange={(e) => setTechnicalOwner(e.target.value)}
                className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#71717A]">
                Aprovador
              </span>
              <input
                type="text"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#71717A]">
                Versão do documento
              </span>
              <input
                type="text"
                value={documentVersion}
                onChange={(e) => setDocumentVersion(e.target.value)}
                placeholder="ex.: 1.0"
                className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#71717A]">
                Data da revisão do documento
              </span>
              <input
                type="text"
                value={documentRevisionDate}
                onChange={(e) => setDocumentRevisionDate(e.target.value)}
                placeholder="Data da última revisão deste PDF"
                className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#71717A]">
                Autor da revisão do documento
              </span>
              <input
                type="text"
                value={documentRevisionAuthor}
                onChange={(e) => setDocumentRevisionAuthor(e.target.value)}
                className="h-10 rounded-[10px] border border-[#E4E4E7] bg-white px-3 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-[#71717A]">
                O quê mudou nesta versão do documento
              </span>
              <textarea
                value={documentRevisionSummary}
                onChange={(e) => setDocumentRevisionSummary(e.target.value)}
                placeholder="ex.: Emissão inicial; inclusão de screenshots"
                rows={2}
                className="min-h-[56px] rounded-[10px] border border-[#E4E4E7] bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[#71717A]">
              Fora do âmbito desta versão
            </span>
            <textarea
              value={outOfScope}
              onChange={(e) => setOutOfScope(e.target.value)}
              placeholder="Itens explicitamente excluídos desta entrega"
              rows={2}
              className="min-h-[56px] rounded-[10px] border border-[#E4E4E7] bg-white px-3 py-2 text-[13px] outline-none placeholder:text-[#71717A] focus-visible:ring-2 focus-visible:ring-[#5946DB]/35"
            />
          </label>
        </div>
      </div>
    </>
  );
}
