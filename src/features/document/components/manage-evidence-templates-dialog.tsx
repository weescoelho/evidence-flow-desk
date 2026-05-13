import { cn } from "@/lib/utils";

import { EvidenceTemplatesManagePanel } from "./evidence-templates-manage-panel";

type ManageEvidenceTemplatesDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ManageEvidenceTemplatesDialog({
  open,
  onClose,
}: ManageEvidenceTemplatesDialogProps) {
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
          "max-h-[min(90dvh,560px)] w-full max-w-[440px] overflow-y-auto shadow-lg",
        )}
        onClick={(ev) => ev.stopPropagation()}
      >
        <EvidenceTemplatesManagePanel
          headingId="manage-templates-title"
          onRequestClose={onClose}
          heading="Gerenciar templates"
          intro="Presets ficam na base SQLite local. O corpo do documento é o mesmo MVP; altera-se o rótulo no PDF/HTML."
        />
      </div>
    </div>
  );
}
