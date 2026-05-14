import { useEffect, useState } from "react";

import {
  DEFAULT_GEMINI_API_BASE,
  DEFAULT_GEMINI_MODEL,
  evidencePreferenceKeys,
  loadEvidenceAppPersistedState,
  setEvidencePreference,
} from "../api/evidence-app-state.commands";
import { useEvidenceMetadataStore } from "../store/evidence-metadata-store";

/** Vista ecrã 07: preferências globais, incluindo Google Gemini (RF-017). */
export function EvidenceAppSettingsView() {
  const hydrated = useEvidenceMetadataStore((s) => s.hydrated);
  const aiGeminiApiBase = useEvidenceMetadataStore((s) => s.aiGeminiApiBase);
  const aiGeminiModel = useEvidenceMetadataStore((s) => s.aiGeminiModel);
  const aiGeminiApiKeyConfigured = useEvidenceMetadataStore(
    (s) => s.aiGeminiApiKeyConfigured,
  );
  const hydrateFromSnapshot = useEvidenceMetadataStore(
    (s) => s.hydrateFromSnapshot,
  );

  const [draftBase, setDraftBase] = useState(aiGeminiApiBase);
  const [draftModel, setDraftModel] = useState(aiGeminiModel);
  const [draftKey, setDraftKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftBase(aiGeminiApiBase);
    setDraftModel(aiGeminiModel);
  }, [aiGeminiApiBase, aiGeminiModel]);

  function syncDraftsFromStore() {
    setDraftBase(useEvidenceMetadataStore.getState().aiGeminiApiBase);
    setDraftModel(useEvidenceMetadataStore.getState().aiGeminiModel);
    setDraftKey("");
  }

  async function handleSaveGemini() {
    setBusy(true);
    setMessage(null);
    try {
      await setEvidencePreference(
        evidencePreferenceKeys.aiGeminiApiBase,
        draftBase.trim() || DEFAULT_GEMINI_API_BASE,
      );
      await setEvidencePreference(
        evidencePreferenceKeys.aiGeminiModel,
        draftModel.trim() || DEFAULT_GEMINI_MODEL,
      );
      if (draftKey.trim().length > 0) {
        await setEvidencePreference(
          evidencePreferenceKeys.aiGeminiApiKey,
          draftKey.trim(),
        );
      }
      const snap = await loadEvidenceAppPersistedState();
      hydrateFromSnapshot(snap);
      syncDraftsFromStore();
      setMessage("Configuração Gemini gravada.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível gravar as preferências.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleClearGeminiKey() {
    setBusy(true);
    setMessage(null);
    try {
      await setEvidencePreference(evidencePreferenceKeys.aiGeminiApiKey, "");
      const snap = await loadEvidenceAppPersistedState();
      hydrateFromSnapshot(snap);
      syncDraftsFromStore();
      setMessage("Chave API removida. O envio para o Gemini ficou desactivado.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível remover a chave.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[12px] text-muted-foreground">
          Configurações
        </p>
        <h1 className="font-mono text-[28px] font-semibold tracking-tight text-foreground">
          Preferências da aplicação
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          Exportação, templates e metadados continuam a ser geridos no assistente.
          Abaixo: integração opcional com{" "}
          <strong className="text-foreground">Google Gemini</strong> (API
          generativelanguage) para resumo corporativo e reescrita do resumo técnico.
        </p>
      </header>

      <section
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
        aria-label="Google Gemini"
      >
        <div>
          <h2 className="font-mono text-[15px] font-semibold text-foreground">
            Google Gemini
          </h2>
          <p className="mt-1 max-w-[60ch] font-mono text-[12px] text-muted-foreground">
            Obtenha uma chave em{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Google AI Studio
            </a>
            . Por defeito usa-se o endpoint público{" "}
            <code className="rounded bg-muted px-1">{DEFAULT_GEMINI_API_BASE}</code>{" "}
            e o modelo <code className="rounded bg-muted px-1">{DEFAULT_GEMINI_MODEL}</code>.
          </p>
        </div>

        {!hydrated ? (
          <p className="font-mono text-[13px] text-muted-foreground">
            A carregar preferências…
          </p>
        ) : (
          <>
            <label className="flex flex-col gap-1 font-mono text-[12px]">
              <span className="font-semibold text-muted-foreground">
                URL base da API (v1beta)
              </span>
              <input
                value={draftBase}
                disabled={busy}
                onChange={(e) => setDraftBase(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1 font-mono text-[12px]">
              <span className="font-semibold text-muted-foreground">Modelo</span>
              <input
                value={draftModel}
                disabled={busy}
                onChange={(e) => setDraftModel(e.target.value)}
                placeholder={DEFAULT_GEMINI_MODEL}
                className="h-10 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1 font-mono text-[12px]">
              <span className="font-semibold text-muted-foreground">
                Chave API
                {aiGeminiApiKeyConfigured ? (
                  <span className="ml-2 font-normal text-muted-foreground">
                    (chave guardada — deixe em branco para manter)
                  </span>
                ) : null}
              </span>
              <input
                type="password"
                value={draftKey}
                disabled={busy}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder={
                  aiGeminiApiKeyConfigured
                    ? "Nova chave (opcional)"
                    : "Cole a chave do AI Studio"
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoComplete="off"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="h-10 rounded-md bg-primary px-4 font-mono text-[13px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                onClick={() => void handleSaveGemini()}
              >
                Guardar IA
              </button>
              <button
                type="button"
                disabled={busy || !aiGeminiApiKeyConfigured}
                className="h-10 rounded-md border border-input px-4 font-mono text-[13px] hover:bg-muted disabled:opacity-50"
                onClick={() => void handleClearGeminiKey()}
              >
                Remover chave
              </button>
            </div>

            {message ? (
              <p className="font-mono text-[12px] text-muted-foreground">
                {message}
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
