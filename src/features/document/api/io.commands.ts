import { invoke } from "@tauri-apps/api/core";

export function writeTextFile(path: string, contents: string) {
  return invoke<void>("write_text_file", { path, contents });
}
