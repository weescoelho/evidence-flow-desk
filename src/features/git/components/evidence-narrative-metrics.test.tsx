import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { EvidenceNarrativeMetrics } from "./evidence-narrative-metrics";

function TechnicalSummaryHarness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [customized, setCustomized] = useState(false);
  const [corporate, setCorporate] = useState("");

  return (
    <EvidenceNarrativeMetrics
      technicalNarrative={value}
      technicalNarrativeIsCustomized={customized}
      onTechnicalNarrativeChange={(next) => {
        setCustomized(true);
        setValue(next);
      }}
      onTechnicalNarrativeRestore={() => {
        setCustomized(false);
        setValue(initial);
      }}
      corporateNarrative={corporate}
      onCorporateNarrativeChange={setCorporate}
      files={[]}
    />
  );
}

describe("EvidenceNarrativeMetrics", () => {
  it("permite editar e reflecte o valor actualizado", async () => {
    const user = userEvent.setup();
    render(<TechnicalSummaryHarness initial="Gerado Git" />);
    const field = screen.getByRole("textbox", {
      name: /resumo técnico editável/i,
    });
    await user.clear(field);
    await user.type(field, "Revisão humana aplicada.");
    expect(field).toHaveValue("Revisão humana aplicada.");
  });

  it("Restaurar texto automático delega ao callback", async () => {
    const restore = vi.fn();
    render(
      <EvidenceNarrativeMetrics
        technicalNarrative="x"
        technicalNarrativeIsCustomized={true}
        onTechnicalNarrativeChange={vi.fn()}
        onTechnicalNarrativeRestore={restore}
        corporateNarrative=""
        onCorporateNarrativeChange={vi.fn()}
        files={[]}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Restaurar texto automático/i }),
    );
    expect(restore).toHaveBeenCalledOnce();
  });
});
