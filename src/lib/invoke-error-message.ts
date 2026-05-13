/** Tauri `invoke` nem sempre lança `Error`; extrair mensagem legível. */
export function invokeErrorMessage(
  e: unknown,
  fallback: string,
): string {
  if (typeof e === "string" && e.trim().length > 0) {
    return e;
  }
  if (e instanceof Error && e.message.trim().length > 0) {
    return e.message;
  }
  if (e !== null && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const msg = o.message;
    if (typeof msg === "string" && msg.trim().length > 0) {
      return msg;
    }
    const errField = o.error;
    if (typeof errField === "string" && errField.trim().length > 0) {
      return errField;
    }
  }
  return fallback;
}
