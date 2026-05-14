import { invoke } from "@tauri-apps/api/core";

export function writeTextFile(path: string, contents: string) {
  return invoke<void>("write_text_file", { path, contents });
}

/** Grava bytes binários (ex.: PDF) via comando Tauri; payload em base64. */
export function writeBinaryFileBase64(path: string, contentsB64: string) {
  return invoke<void>("write_binary_file_base64", { path, contentsB64 });
}

/** Converte `Uint8Array` para base64 sem estourar a stack (ficheiros grandes). */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

export async function writePdfBlobToPath(
  path: string,
  blob: Blob,
): Promise<void> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  await writeBinaryFileBase64(path, uint8ArrayToBase64(buf));
}
