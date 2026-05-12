import type { GitCommandErrorPayload } from "../types/git";

/** Erros `Result<_, GitCommandError>` do Rust expostos pelo IPC do Tauri. */
export function parseGitCommandError(
  e: unknown
): GitCommandErrorPayload | null {
  if (e && typeof e === "object" && "code" in e && "message" in e) {
    const o = e as Record<string, unknown>;
    if (typeof o.code === "string" && typeof o.message === "string") {
      return { code: o.code, message: o.message };
    }
  }
  if (typeof e === "string") {
    try {
      const v = JSON.parse(e) as unknown;
      if (
        v &&
        typeof v === "object" &&
        "code" in (v as object) &&
        "message" in (v as object)
      ) {
        const o = v as Record<string, unknown>;
        if (typeof o.code === "string" && typeof o.message === "string") {
          return { code: o.code, message: o.message };
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}
