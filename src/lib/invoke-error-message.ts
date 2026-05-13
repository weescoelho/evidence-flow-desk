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
    const msg = (e as Record<string, unknown>).message;
    if (typeof msg === "string" && msg.trim().length > 0) {
      return msg;
    }
  }
  return fallback;
}
