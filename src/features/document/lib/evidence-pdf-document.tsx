/** Documento de evidência em PDF (@react-pdf/renderer) — paridade de conteúdo com `buildEvidenceBodyHtml`. */

import {
  Document,
  Image,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

import type { CommitRow, FileChangeRow } from "@/features/git/types/git";

import type { EvidenceDocumentPayload } from "./build-evidence-html";
import {
  collectRevisionTableRows,
  revisionRowFromPayloadScalars,
  type DocumentRevisionRow,
} from "./document-revision-history";
import {
  MarkdownView,
  type MarkdownPdfTheme,
} from "./markdown-to-pdf";
import {
  normalizeEvidenceTemplateLayoutKey,
  type EvidenceTemplateLayoutKey,
} from "./evidence-template-layouts";

export type EvidencePdfOptions = {
  documentTitle?: string;
  numberPagesPrint?: boolean;
};

/** Largura útil A4 em pt (595.28 − margens horizontais). Evita % aninhados com flex, que geram NaN no Yoga. */
const PAGE_INNER_W = Math.floor(595.28 - 34 * 2);

function ptPct(pctVal: number): number {
  return Math.round((PAGE_INNER_W * pctVal) / 100);
}

function safeText(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s);
}

function safeLineDeltaDisplay(added: unknown, removed: unknown): string {
  const a =
    typeof added === "number" && Number.isFinite(added)
      ? Math.max(0, Math.floor(added))
      : 0;
  const r =
    typeof removed === "number" && Number.isFinite(removed)
      ? Math.max(0, Math.floor(removed))
      : 0;
  if (a + r <= 0) return "—";
  return `+${a} / −${r}`;
}

const COL_COMMIT = [
  ptPct(14),
  ptPct(12),
  ptPct(22),
  PAGE_INNER_W - ptPct(14) - ptPct(12) - ptPct(22),
] as const;

const COL_FILE = [ptPct(58), ptPct(22), ptPct(20)] as const;

const COL_REV = [
  ptPct(15),
  ptPct(20),
  ptPct(40),
  PAGE_INNER_W - ptPct(15) - ptPct(20) - ptPct(40),
] as const;

const W_META_DT = ptPct(28);
const W_META_DD = PAGE_INNER_W - W_META_DT;
const W_COVER_DT = ptPct(36);
const W_COVER_DD = PAGE_INNER_W - W_COVER_DT;
const W_SHOT_CELL = Math.floor(PAGE_INNER_W / 2);
const FILE_STATUS_PT: Record<FileChangeRow["status"], string> = {
  added: "adicionado",
  deleted: "removido",
  modified: "modificado",
  renamed: "renomeado",
  copied: "copiado",
  other: "outro",
};

function safeImageDataUrl(url: string): string {
  if (!url.startsWith("data:image/")) return "";
  return url;
}

function repositoryBasename(repositoryPath: string): string {
  const parts = repositoryPath.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function formatGeneratedAtLong(): string {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function displayOrDash(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  return t.length > 0 ? t : "—";
}

function createStyles(layout: EvidenceTemplateLayoutKey): Styles {
  const audit = layout === "audit";
  const border = audit ? "#18181b" : "#e7e5e4";
  const thBg = audit ? "#f4f4f5" : "#f5f5f4";
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      color: audit ? "#000000" : "#1c1917",
      paddingTop: 52,
      paddingBottom: 40,
      paddingHorizontal: 34,
    },
    headerBanner: {
      position: "absolute",
      top: 14,
      left: 34,
      right: 34,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerImgLeft: {
      maxHeight: 32,
      maxWidth: 118,
      objectFit: "contain",
      objectPosition: "left top",
    },
    headerImgRight: {
      maxHeight: 32,
      maxWidth: 118,
      objectFit: "contain",
      objectPosition: "right top",
    },
    headerBannerSide: {
      flexBasis: 0,
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    pageFooter: {
      position: "absolute",
      bottom: 18,
      left: 34,
      right: 34,
      fontSize: 9,
      color: "#57534e",
      textAlign: "center",
    },
    docHeader: {
      marginBottom: 10,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    h1: {
      fontSize: 19,
      fontWeight: 700,
      color: audit ? "#000000" : "#0c0a09",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 9.5,
      color: "#57534e",
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.55,
      color: audit ? "#18181b" : "#292524",
      marginTop: 14,
      marginBottom: 6,
      paddingBottom: 5,
      borderBottomWidth: 2,
      borderBottomColor: audit ? "#18181b" : "#292524",
    },
    sectionLead: {
      fontSize: 9.5,
      color: "#57534e",
      marginBottom: 8,
    },
    pre: {
      backgroundColor: audit ? "#ffffff" : "#fafaf9",
      borderWidth: 1,
      borderColor: border,
      borderRadius: audit ? 0 : 6,
      padding: 10,
      fontSize: 9.75,
      fontFamily: "Courier",
      lineHeight: 1.55,
    },
    metaBox: {
      backgroundColor: "#fafaf9",
      borderWidth: 1,
      borderColor: border,
      borderRadius: 6,
      padding: 12,
      marginTop: 6,
    },
    metaRow: {
      flexDirection: "row",
      marginBottom: 5,
    },
    metaDt: {
      width: W_META_DT,
      fontSize: 9.5,
      fontWeight: 600,
      color: "#44403c",
    },
    metaDd: {
      width: W_META_DD,
      fontSize: 10,
    },
    warn: {
      backgroundColor: "#fffbeb",
      borderWidth: 1,
      borderColor: "#fcd34d",
      padding: 8,
      borderRadius: 6,
      fontSize: 10,
      color: "#713f12",
      marginBottom: 8,
    },
    coverBox: {
      borderWidth: 1,
      borderColor: "#d4d4d8",
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
      backgroundColor: "#fafafa",
    },
    coverTitle: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 10,
      color: "#0c0a09",
    },
    coverRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    coverDt: {
      width: W_COVER_DT,
      fontWeight: 600,
      fontSize: 10,
      color: "#3f3f46",
    },
    coverDd: {
      width: W_COVER_DD,
      fontSize: 10,
    },
    table: {
      marginTop: 6,
      marginBottom: 8,
      borderWidth: audit ? 2 : 0,
      borderColor: audit ? "#18181b" : border,
    },
    trHeader: {
      flexDirection: "row",
      backgroundColor: thBg,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    th: {
      paddingVertical: 6,
      paddingHorizontal: 7,
      fontSize: 8.5,
      fontWeight: 700,
      textTransform: "uppercase",
      color: "#44403c",
      borderWidth: audit ? 1 : 0,
      borderColor: audit ? "#18181b" : "transparent",
    },
    tr: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e7e5e4",
    },
    trEven: {
      backgroundColor: "#fafaf9",
    },
    td: {
      paddingVertical: 6,
      paddingHorizontal: 7,
      fontSize: 10,
      borderWidth: audit ? 1 : 0,
      borderColor: audit ? "#18181b" : "transparent",
    },
    tdCode: {
      fontFamily: "Courier",
      fontSize: 9.75,
    },
    screenshotRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e7e5e4",
    },
    screenshotImgCell: {
      width: W_SHOT_CELL,
      padding: 8,
      alignItems: "center",
      justifyContent: "center",
      borderRightWidth: 1,
      borderRightColor: "#e7e5e4",
    },
    screenshotImg: {
      maxWidth: W_SHOT_CELL - 18,
      maxHeight: 175,
      objectFit: "contain",
      borderWidth: 1,
      borderColor: "#d6d3d1",
    },
    screenshotDescCell: {
      width: W_SHOT_CELL,
      padding: 8,
      fontSize: 10,
    },
    h3: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#44403c",
      marginTop: 10,
      marginBottom: 4,
    },
    labelMuted: {
      fontSize: 8.5,
      fontWeight: 600,
      textTransform: "uppercase",
      color: "#a8a29e",
    },
    markdownContainer: {
      backgroundColor: audit ? "#ffffff" : "#fafaf9",
      borderWidth: 1,
      borderColor: border,
      borderRadius: audit ? 0 : 6,
      padding: 10,
    },
    markdownParagraph: {
      fontSize: 9.75,
      fontFamily: "Helvetica",
      lineHeight: 1.55,
      color: audit ? "#000000" : "#1c1917",
    },
    markdownStrong: {
      fontFamily: "Helvetica",
      fontWeight: 700,
      color: audit ? "#000000" : "#1c1917",
    },
    markdownEm: {
      fontFamily: "Helvetica",
      fontStyle: "italic",
      color: audit ? "#000000" : "#1c1917",
    },
    markdownCodespan: {
      fontFamily: "Courier",
      fontSize: 9,
      backgroundColor: "#f4f4f5",
      paddingHorizontal: 2,
      color: audit ? "#000000" : "#1c1917",
    },
    markdownH1: {
      fontSize: 12,
      fontWeight: 700,
      color: audit ? "#000000" : "#292524",
      fontFamily: "Helvetica",
    },
    markdownH2: {
      fontSize: 11,
      fontWeight: 700,
      color: audit ? "#18181b" : "#292524",
      fontFamily: "Helvetica",
    },
    markdownH3: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#44403c",
      fontFamily: "Helvetica",
    },
    markdownBulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    markdownBulletGlyph: {
      width: 14,
      marginRight: 6,
      fontSize: 9.75,
      color: audit ? "#000000" : "#1c1917",
    },
    markdownOrderedGlyph: {
      width: 20,
      marginRight: 6,
      fontSize: 9.75,
      color: audit ? "#000000" : "#1c1917",
    },
    markdownCodeBlock: {
      fontFamily: "Courier",
      fontSize: 9,
      lineHeight: 1.45,
      backgroundColor: "#f4f4f5",
      borderWidth: 1,
      borderColor: border,
      borderRadius: audit ? 0 : 4,
      padding: 8,
      color: audit ? "#000000" : "#1c1917",
    },
    markdownHr: {
      borderBottomWidth: 1,
      borderBottomColor: border,
      marginVertical: 8,
      width: "100%",
    },
  });
}

function markdownPdfTheme(styles: Styles): MarkdownPdfTheme {
  return {
    container: styles.markdownContainer,
    paragraph: styles.markdownParagraph,
    strong: styles.markdownStrong,
    em: styles.markdownEm,
    codespan: styles.markdownCodespan,
    heading1: styles.markdownH1,
    heading2: styles.markdownH2,
    heading3: styles.markdownH3,
    bulletRow: styles.markdownBulletRow,
    bulletGlyph: styles.markdownBulletGlyph,
    orderedGlyph: styles.markdownOrderedGlyph,
    codeBlock: styles.markdownCodeBlock,
    hr: styles.markdownHr,
  };
}

function SectionTitle({
  children,
  styles,
}: {
  children: string;
  styles: Styles;
}): ReactElement {
  return (
    <Text style={styles.sectionTitle} wrap={false}>
      {children}
    </Text>
  );
}

function TemplateHeader({
  left,
  right,
  styles,
}: {
  left: string;
  right: string;
  styles: Styles;
}): ReactElement | null {
  if (!left && !right) return null;
  return (
    <View style={styles.headerBanner} fixed>
      <View style={[styles.headerBannerSide, { justifyContent: "flex-start" }]}>
        {left ? <Image src={left} style={styles.headerImgLeft} /> : null}
      </View>
      <View style={[styles.headerBannerSide, { justifyContent: "flex-end" }]}>
        {right ? <Image src={right} style={styles.headerImgRight} /> : null}
      </View>
    </View>
  );
}

function PageNumbers({
  show,
  styles,
}: {
  show: boolean;
  styles: Styles;
}): ReactElement | null {
  if (!show) return null;
  return (
    <Text
      style={styles.pageFooter}
      fixed
      render={({ pageNumber, totalPages }) =>
        `Página ${pageNumber} de ${totalPages}`
      }
    />
  );
}

function MetaGrid({
  rows,
  styles,
}: {
  rows: Array<[string, string]>;
  styles: Styles;
}): ReactElement {
  return (
    <View style={styles.metaBox}>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.metaRow} wrap={false}>
          <Text style={styles.metaDt}>{k}</Text>
          <Text style={styles.metaDd}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function ClassicBody({
  p,
  styles,
}: {
  p: EvidenceDocumentPayload;
  styles: Styles;
}): ReactElement {
  const templateLine = p.templateLabel.trim() || "padrão";
  const changeLine = p.changeId.trim() || "—";
  const envLine = p.environment.trim() || "—";
  const generatedAt = formatGeneratedAtLong();

  return (
    <View>
      <View style={styles.docHeader}>
        <Text style={styles.h1}>Evidência técnica</Text>
        <Text style={styles.subtitle}>
          Template <Text style={{ fontWeight: 700 }}>{templateLine}</Text>
        </Text>
      </View>

      <SectionTitle styles={styles}>Metadados</SectionTitle>
      <MetaGrid
        styles={styles}
        rows={[
          ["Change ID / ticket", changeLine],
          ["Ambiente", envLine],
          ["Gerado em", generatedAt],
        ]}
      />

      {p.commitsTruncated ? (
        <View style={styles.warn} wrap={false}>
          <Text>
            <Text style={{ fontWeight: 700 }}>Atenção:</Text> a lista de commits
            foi truncada pelo limite de segurança da aplicação.
          </Text>
        </View>
      ) : null}

      <SectionTitle styles={styles}>Resumo técnico</SectionTitle>
      <MarkdownView
        markdown={safeText(p.technicalSummary)}
        theme={markdownPdfTheme(styles)}
      />

      {p.corporateSummary?.trim() ? (
        <View>
          <SectionTitle styles={styles}>Resumo corporativo</SectionTitle>
          <MarkdownView
            markdown={safeText(p.corporateSummary.trim())}
            theme={markdownPdfTheme(styles)}
          />
        </View>
      ) : null}

      <SectionTitle styles={styles}>{`Commits (${p.commits.length})`}</SectionTitle>
      <CommitsTable commits={p.commits} styles={styles} />

      <SectionTitle styles={styles}>{`Arquivos (${p.files.length})`}</SectionTitle>
      <FilesTable files={p.files} styles={styles} />

      <ScreenshotsSection p={p} styles={styles} />
    </View>
  );
}

function CommitsTable({
  commits,
  styles,
}: {
  commits: CommitRow[];
  styles: Styles;
}): ReactElement {
  const [w0, w1, w2, w3] = COL_COMMIT;
  return (
    <View style={styles.table}>
      <View style={styles.trHeader} wrap={false}>
        <Text style={[styles.th, { width: w0 }]}>Hash</Text>
        <Text style={[styles.th, { width: w1 }]}>Tipo</Text>
        <Text style={[styles.th, { width: w2 }]}>Autor</Text>
        <Text style={[styles.th, { width: w3 }]}>Resumo</Text>
      </View>
      {commits.length === 0 ? (
        <View style={styles.tr} wrap={false}>
          <Text style={[styles.td, { width: PAGE_INNER_W }]}>
            Nenhum commit no intervalo.
          </Text>
        </View>
      ) : (
        commits.map((c, i) => (
          <View
            key={c.hash}
            style={[styles.tr, i % 2 === 1 ? styles.trEven : {}]}
            wrap={false}
          >
            <Text style={[styles.td, styles.tdCode, { width: w0 }]}>
              {safeText(c.shortHash)}
            </Text>
            <Text style={[styles.td, { width: w1 }]}>
              {safeText(c.conventionalType ?? "—")}
            </Text>
            <Text style={[styles.td, { width: w2 }]}>
              {safeText(c.authorName)}
            </Text>
            <Text style={[styles.td, { width: w3 }]}>
              {safeText(c.summary)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function FilesTable({
  files,
  styles,
}: {
  files: FileChangeRow[];
  styles: Styles;
}): ReactElement {
  const [wPath, wStatus, wDelta] = COL_FILE;
  return (
    <View style={styles.table}>
      <View style={styles.trHeader} wrap={false}>
        <Text style={[styles.th, { width: wPath }]}>Caminho</Text>
        <Text style={[styles.th, { width: wStatus }]}>Estado</Text>
        <Text style={[styles.th, { width: wDelta }]}>Linhas</Text>
      </View>
      {files.length === 0 ? (
        <View style={styles.tr} wrap={false}>
          <Text style={[styles.td, { width: PAGE_INNER_W }]}>
            Nenhuma alteração de arquivo.
          </Text>
        </View>
      ) : (
        files.map((f, i) => {
          const delta = safeLineDeltaDisplay(f.linesAdded, f.linesRemoved);
          const pathExtra =
            f.status === "renamed" &&
            f.pathBefore &&
            f.pathAfter &&
            f.pathBefore !== f.pathAfter
              ? ` (${f.pathBefore} → ${f.pathAfter})`
              : "";
          return (
            <View
              key={`${f.path}-${i}`}
              style={[styles.tr, i % 2 === 1 ? styles.trEven : {}]}
            >
              <Text style={[styles.td, { width: wPath }]}>
                {safeText(f.path)}
                {pathExtra}
              </Text>
              <Text style={[styles.td, { width: wStatus }]}>
                {FILE_STATUS_PT[f.status]}
              </Text>
              <Text style={[styles.td, { width: wDelta }]}>{delta}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

function ScreenshotsSection({
  p,
  styles,
}: {
  p: EvidenceDocumentPayload;
  styles: Styles;
}): ReactElement | null {
  if (p.screenshots.length === 0) return null;
  const cells: ReactElement[] = [];
  for (let i = 0; i < p.screenshots.length; i += 1) {
    const s = p.screenshots[i];
    const src = safeImageDataUrl(s.dataUrl);
    const rowBg = i % 2 === 0 ? "#f0efed" : "#ebe9e6";
    const descBg = i % 2 === 0 ? "#ffffff" : "#f5f5f4";
    if (!src) {
      cells.push(
        <View
          key={`${s.fileName}-${i}`}
          style={[styles.screenshotRow, { backgroundColor: descBg }]}
          wrap={false}
        >
          <View style={{ width: PAGE_INNER_W, padding: 8 }}>
            <View style={styles.warn}>
              <Text>Imagem omitida (formato inválido).</Text>
            </View>
            <Text>
              <Text style={styles.labelMuted}>Ficheiro </Text>
              <Text style={{ fontFamily: "Courier", fontSize: 9 }}>
                {safeText(s.fileName)}
              </Text>
            </Text>
          </View>
        </View>,
      );
      continue;
    }
    const cap = s.caption.trim();
    cells.push(
      <View
        key={`${s.fileName}-${i}`}
        style={[styles.screenshotRow, { backgroundColor: rowBg }]}
        wrap={false}
      >
        <View style={[styles.screenshotImgCell, { backgroundColor: rowBg }]}>
          <Image src={src} style={styles.screenshotImg} />
        </View>
        <View style={[styles.screenshotDescCell, { backgroundColor: descBg }]}>
          {cap.length > 0 ? (
            <View>
              <Text style={{ marginBottom: 6 }}>{safeText(cap)}</Text>
              <Text>
                <Text style={styles.labelMuted}>Ficheiro </Text>
                <Text style={{ fontFamily: "Courier", fontSize: 9 }}>
                  {safeText(s.fileName)}
                </Text>
              </Text>
            </View>
          ) : (
            <View>
              <Text
                style={{
                  marginBottom: 6,
                  color: "#78716c",
                  fontStyle: "italic",
                }}
              >
                Sem descrição informada.
              </Text>
              <Text>
                <Text style={styles.labelMuted}>Ficheiro </Text>
                <Text style={{ fontFamily: "Courier", fontSize: 9 }}>
                  {safeText(s.fileName)}
                </Text>
              </Text>
            </View>
          )}
        </View>
      </View>,
    );
  }
  return (
    <View>
      <SectionTitle styles={styles}>{`Capturas de ecrã (${p.screenshots.length})`}</SectionTitle>
      <Text style={styles.sectionLead}>
        Registo das evidências gráficas: cada linha liga a imagem à descrição e
        ao ficheiro de origem.
      </Text>
      <View style={[styles.table, { borderWidth: 0 }]}>{cells}</View>
    </View>
  );
}

function formatRevisionRowAuthor(
  row: DocumentRevisionRow,
  fallbackOwner: string | undefined,
): string {
  const docAuthorRaw = row.author.trim();
  return docAuthorRaw.length > 0 ? docAuthorRaw : displayOrDash(fallbackOwner);
}

function MarketBody({
  p,
  styles,
}: {
  p: EvidenceDocumentPayload;
  styles: Styles;
}): ReactElement {
  const product =
    (p.productName ?? "").trim() ||
    repositoryBasename(p.repositoryPath) ||
    "—";
  const revisionRows = collectRevisionTableRows(
    p.documentRevisionHistory,
    revisionRowFromPayloadScalars({
      documentVersion: p.documentVersion,
      documentRevisionDate: p.documentRevisionDate,
      documentRevisionSummary: p.documentRevisionSummary,
      documentRevisionAuthor: p.documentRevisionAuthor,
    }),
  );

  const corpor = (p.corporateSummary ?? "").trim();
  const tech = safeText(p.technicalSummary);

  const [wv, wd, ww, wa] = COL_REV;

  return (
    <View>
      <View style={styles.coverBox} wrap={false}>
        <Text style={styles.coverTitle}>{product}</Text>
        <View style={styles.coverRow}>
          <Text style={styles.coverDt}>Versão da entrega</Text>
          <Text style={styles.coverDd}>{displayOrDash(p.releaseVersion)}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverDt}>Data de implantação</Text>
          <Text style={styles.coverDd}>{displayOrDash(p.deploymentDate)}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverDt}>Ambiente</Text>
          <Text style={styles.coverDd}>{displayOrDash(p.environment)}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverDt}>Change ID / ticket</Text>
          <Text style={styles.coverDd}>{displayOrDash(p.changeId)}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverDt}>Responsável técnico</Text>
          <Text style={styles.coverDd}>{displayOrDash(p.technicalOwner)}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverDt}>Aprovador</Text>
          <Text style={styles.coverDd}>{displayOrDash(p.approver)}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverDt}>Gerado em</Text>
          <Text style={styles.coverDd}>{formatGeneratedAtLong()}</Text>
        </View>
        <View style={styles.coverRow}>
          <Text style={styles.coverDt}>Escopo Git (branches)</Text>
          <Text style={styles.coverDd}>{p.branchRefs.join(", ")}</Text>
        </View>
      </View>

      {p.commitsTruncated ? (
        <View style={styles.warn} wrap={false}>
          <Text>
            <Text style={{ fontWeight: 700 }}>Atenção:</Text> a lista de commits
            foi truncada pelo limite de segurança da aplicação.
          </Text>
        </View>
      ) : null}

      <SectionTitle styles={styles}>Controle de versões do documento</SectionTitle>
      <View style={styles.table}>
        <View style={styles.trHeader} wrap={false}>
          <Text style={[styles.th, { width: wv }]}>Versão</Text>
          <Text style={[styles.th, { width: wd }]}>Data</Text>
          <Text style={[styles.th, { width: ww }]}>Alteração</Text>
          <Text style={[styles.th, { width: wa }]}>Responsável</Text>
        </View>
        {revisionRows.map((row, i) => {
          const docVer = row.version.trim() || "1.0";
          const docDate =
            row.date.trim() || new Date().toLocaleDateString("pt-BR");
          const docWhat = row.summary.trim() || "Emissão inicial";
          const docAuthor = formatRevisionRowAuthor(row, p.technicalOwner);
          return (
            <View
              key={`${docVer}-${i}`}
              style={[styles.tr, i % 2 === 1 ? styles.trEven : {}]}
              wrap={false}
            >
              <Text style={[styles.td, { width: wv }]}>{docVer}</Text>
              <Text style={[styles.td, { width: wd }]}>{docDate}</Text>
              <Text style={[styles.td, { width: ww }]}>{docWhat}</Text>
              <Text style={[styles.td, { width: wa }]}>{docAuthor}</Text>
            </View>
          );
        })}
      </View>

      <SectionTitle styles={styles}>Resumo executivo</SectionTitle>
      {corpor.length > 0 ? (
        <View>
          <MarkdownView
            markdown={safeText(corpor)}
            theme={markdownPdfTheme(styles)}
          />
          {tech.trim().length > 0 ? (
            <View>
              <Text style={styles.h3}>Contexto técnico</Text>
              <MarkdownView markdown={tech} theme={markdownPdfTheme(styles)} />
            </View>
          ) : null}
        </View>
      ) : (
        <MarkdownView markdown={tech} theme={markdownPdfTheme(styles)} />
      )}

      <ScreenshotsSection p={p} styles={styles} />

      <Text style={styles.h3}>Escopo técnico</Text>
      <FilesTable files={p.files} styles={styles} />
    </View>
  );
}

export function EvidencePdfDocument({
  payload,
  documentTitle,
  numberPagesPrint = false,
}: {
  payload: EvidenceDocumentPayload;
} & EvidencePdfOptions): ReactElement {
  const layout = normalizeEvidenceTemplateLayoutKey(payload.templateLayoutKey);
  const styles = createStyles(layout);
  const left = safeImageDataUrl((payload.templateHeaderImageLeft ?? "").trim());
  const right = safeImageDataUrl(
    (payload.templateHeaderImageRight ?? "").trim(),
  );
  const title =
    documentTitle?.trim() || "Evidência técnica — EvidenceFlow";

  const body =
    layout === "market_standard" ? (
      <MarketBody p={payload} styles={styles} />
    ) : (
      <ClassicBody p={payload} styles={styles} />
    );

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <TemplateHeader left={left} right={right} styles={styles} />
        <PageNumbers show={numberPagesPrint} styles={styles} />
        {body}
      </Page>
    </Document>
  );
}

/** Gera o PDF como `Blob` para gravação via Tauri ou download. */
export async function buildEvidencePdfBlob(
  payload: EvidenceDocumentPayload,
  options?: EvidencePdfOptions,
): Promise<Blob> {
  return pdf(
    <EvidencePdfDocument
      payload={payload}
      documentTitle={options?.documentTitle}
      numberPagesPrint={options?.numberPagesPrint}
    />,
  ).toBlob();
}
