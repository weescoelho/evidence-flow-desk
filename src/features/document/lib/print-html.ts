/**
 * Abre o fluxo de impressão do sistema com o HTML fornecido (ex.: «Guardar como PDF»).
 */
export function printHtmlDocument(fullHtml: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!idoc || !win) {
    iframe.remove();
    return;
  }

  const cleanup = (): void => {
    iframe.remove();
  };

  idoc.open();
  idoc.write(fullHtml);
  idoc.close();

  const trigger = (): void => {
    try {
      win.focus();
      win.print();
    } finally {
      window.setTimeout(cleanup, 500);
    }
  };

  iframe.onload = trigger;
  if (idoc.readyState === "complete") {
    window.setTimeout(trigger, 0);
  }
}
