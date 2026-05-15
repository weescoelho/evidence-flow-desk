import type { CommitRow, FileChangeRow } from "../types/git";

const STATUS_LABEL: Record<FileChangeRow["status"], string> = {
  added: "adicionados",
  deleted: "removidos",
  modified: "modificados",
  renamed: "renomeados",
  copied: "copiados",
  other: "outros",
};

function countByStatus(files: FileChangeRow[]): Record<FileChangeRow["status"], number> {
  const out: Record<FileChangeRow["status"], number> = {
    added: 0,
    deleted: 0,
    modified: 0,
    renamed: 0,
    copied: 0,
    other: 0,
  };
  for (const f of files) {
    out[f.status]++;
  }
  return out;
}

export type TechnicalSummaryInput = {
  commits: CommitRow[];
  files: FileChangeRow[];
  commitsTruncated: boolean;
};

/**
 * Gera resumo técnico legível a partir dos dados de escopo (RF-006 subset MVP — sem LLM).
 */
export function buildTechnicalSummary(data: TechnicalSummaryInput): string {
  const lines: string[] = [];

  const { commits, files, commitsTruncated } = data;
  const nCommits = commits.length;
  const nFiles = files.length;

  if (nCommits === 0 && nFiles === 0) {
    return "Não há commits nem alterações de arquivo neste escopo para as branches selecionadas.";
  }

  if (nCommits === 0) {
    lines.push(
      "Não há commits listados para o intervalo calculado (as alterações de arquivo refletem o diff acumulado desde o ancestral comum até cada branch).",
    );
  } else if (nCommits === 1) {
    lines.push(
      `Este escopo inclui 1 commit${commitsTruncated ? " (atenção: a lista de commits pode estar truncada pelo limite de segurança)." : "."}`,
    );
  } else {
    lines.push(
      `Este escopo inclui ${nCommits} commits${commitsTruncated ? " (lista truncada pelo limite de segurança; reduza o número de branches ou refine o histórico)." : "."}`,
    );
  }

  if (nCommits > 0) {
    lines.push("");
    lines.push("Alterações registadas (mensagens):");
    for (const c of commits) {
      const tag = c.conventionalType ? `[${c.conventionalType}] ` : "";
      lines.push(`• ${tag}${c.summary} — ${c.shortHash}`);
    }
  }

  if (nFiles > 0) {
    const add = files.reduce((s, f) => s + f.linesAdded, 0);
    const rem = files.reduce((s, f) => s + f.linesRemoved, 0);
    const counts = countByStatus(files);
    const parts = (
      Object.entries(counts) as [FileChangeRow["status"], number][]
    )
      .filter(([, c]) => c > 0)
      .map(([st, c]) => `${c} ${STATUS_LABEL[st]}`);

    lines.push("");
    lines.push(
      nFiles === 1
        ? `Foi tocado 1 arquivo no agregado de alterações (+${add} / −${rem} linhas).`
        : `Foram tocados ${nFiles} arquivos no agregado de alterações (+${add} / −${rem} linhas).`,
    );
    if (parts.length > 0) {
      lines.push(`Por tipo: ${parts.join(", ")}.`);
    }
  }

  lines.push("");
  lines.push(
    "Este texto é gerado automaticamente a partir dos metadados Git e do diff agregado; não substitui revisão humana nem descreve o contúdo linha a linha.",
  );

  return lines.join("\n").trim();
}
