import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SavedEvidenceDocumentsPanel } from "./saved-evidence-documents-panel";

const listMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("../api/evidence.commands", () => ({
  listSavedEvidenceDocuments: () => listMock(),
  deleteSavedEvidenceDocument: (id: string) => deleteMock(id),
}));

const openPathMock = vi.fn();
const revealMock = vi.fn();

vi.mock("@tauri-apps/plugin-opener", () => ({
  openPath: (...args: unknown[]) => openPathMock(...args),
  revealItemInDir: (...args: unknown[]) => revealMock(...args),
}));

const confirmMock = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ({
  confirm: (...args: unknown[]) => confirmMock(...args),
}));

describe("SavedEvidenceDocumentsPanel", () => {
  beforeEach(() => {
    listMock.mockReset();
    openPathMock.mockReset();
    revealMock.mockReset();
    deleteMock.mockReset();
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
  });

  it("mostra estado vazio quando não há entradas", async () => {
    listMock.mockResolvedValueOnce([]);
    render(<SavedEvidenceDocumentsPanel />);
    await waitFor(() =>
      expect(
        screen.getByText(/Ainda não há cópias guardadas/i),
      ).toBeInTheDocument(),
    );
  });

  it("lista documentos e permite abrir o HTML", async () => {
    listMock.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        savedAtMs: 1_700_000_000_000,
        repositoryPath: "/very/long/repo/path/my-project",
        baseRef: "main",
        compareRef: "feat",
        htmlPath: "/data/evidence/a/document.html",
      },
    ]);
    const user = userEvent.setup();
    render(<SavedEvidenceDocumentsPanel />);
    await waitFor(() =>
      expect(screen.getByText(/feat/i)).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Abrir HTML/i }));
    expect(openPathMock).toHaveBeenCalledWith("/data/evidence/a/document.html");
  });

  it("recarrega quando refreshKey muda", async () => {
    listMock.mockResolvedValue([]);
    const { rerender } = render(<SavedEvidenceDocumentsPanel refreshKey={0} />);
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));
    listMock.mockResolvedValue([]);
    rerender(<SavedEvidenceDocumentsPanel refreshKey={1} />);
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
  });

  it("remove documento e volta a carregar a lista", async () => {
    deleteMock.mockResolvedValue(undefined);
    listMock
      .mockResolvedValueOnce([
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          savedAtMs: 1_700_000_000_000,
          repositoryPath: "/repo",
          baseRef: "main",
          compareRef: "feat",
          htmlPath: "/x/doc.html",
        },
      ])
      .mockResolvedValueOnce([]);

    const user = userEvent.setup();
    render(<SavedEvidenceDocumentsPanel />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Remover/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /^Remover$/i }));
    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(deleteMock).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Ainda não há cópias guardadas/i),
      ).toBeInTheDocument(),
    );
  });

  it("não remove se o utilizador cancelar a confirmação", async () => {
    confirmMock.mockResolvedValueOnce(false);
    deleteMock.mockResolvedValue(undefined);
    listMock.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        savedAtMs: 1,
        repositoryPath: "/repo",
        baseRef: "main",
        compareRef: "feat",
        htmlPath: "/x/doc.html",
      },
    ]);
    const user = userEvent.setup();
    render(<SavedEvidenceDocumentsPanel />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Remover$/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /^Remover$/i }));
    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("filtra entradas pelo texto", async () => {
    listMock.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        savedAtMs: 1,
        repositoryPath: "/projects/alpha",
        baseRef: "main",
        compareRef: "feat",
        htmlPath: "/a/doc.html",
      },
      {
        id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        savedAtMs: 2,
        repositoryPath: "/other/beta",
        baseRef: "dev",
        compareRef: "prod",
        htmlPath: "/b/doc.html",
      },
    ]);
    const user = userEvent.setup();
    render(<SavedEvidenceDocumentsPanel />);
    await waitFor(() =>
      expect(screen.getByTestId("saved-evidence-filter")).toBeInTheDocument(),
    );
    await user.type(screen.getByTestId("saved-evidence-filter"), "beta");
    expect(screen.queryByText(/alpha/i)).not.toBeInTheDocument();
    expect(screen.getByText(/beta/i)).toBeInTheDocument();
  });
});
