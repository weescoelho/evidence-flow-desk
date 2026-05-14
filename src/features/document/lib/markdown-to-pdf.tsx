/**
 * Markdown limitado para `@react-pdf/renderer` (sem HTML).
 * Cobre cabeçalhos, parágrafos, listas, blocos de código, HR e ênfase inline comum.
 */

import { Text, View } from "@react-pdf/renderer";
import type { ComponentProps, ReactElement } from "react";

type PdfStyle = NonNullable<ComponentProps<typeof View>["style"]>;

export type MarkdownPdfTheme = {
  container: PdfStyle;
  paragraph: PdfStyle;
  strong: PdfStyle;
  em: PdfStyle;
  codespan: PdfStyle;
  heading1: PdfStyle;
  heading2: PdfStyle;
  heading3: PdfStyle;
  bulletRow: PdfStyle;
  bulletGlyph: PdfStyle;
  orderedGlyph: PdfStyle;
  codeBlock: PdfStyle;
  hr: PdfStyle;
};

type MdBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; depth: number; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "code"; lines: string[] }
  | { type: "hr" };

function parseBlocks(markdown: string): MdBlock[] {
  const raw = markdown.replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const lines = raw.split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;

  function flushParagraph(buf: string[]): void {
    const t = buf.join("\n").trim();
    if (t.length > 0) blocks.push({ type: "paragraph", text: t });
    buf.length = 0;
  }

  let paraBuf: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmedEnd = line.trimEnd();

    if (trimmedEnd.startsWith("```")) {
      flushParagraph(paraBuf);
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", lines: codeLines });
      continue;
    }

    if (trimmedEnd.trim() === "") {
      flushParagraph(paraBuf);
      i += 1;
      continue;
    }

    const trimmed = trimmedEnd.trim();

    const hm = /^#{1,6}\s+(.*)$/.exec(trimmed);
    if (hm) {
      flushParagraph(paraBuf);
      const depth = Math.min(/^#+/.exec(trimmed)?.[0].length ?? 1, 6);
      blocks.push({
        type: "heading",
        depth,
        text: hm[1].trim(),
      });
      i += 1;
      continue;
    }

    if (/^(?:[-*_]\s*){3,}$/.test(trimmed)) {
      flushParagraph(paraBuf);
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+\S/.test(line)) {
      flushParagraph(paraBuf);
      const items: string[] = [];
      while (i < lines.length) {
        const L = lines[i];
        if (L.trim() === "") break;
        const m = /^\s*[-*]\s+(.*)$/.exec(L);
        if (!m) break;
        items.push(m[1].trimEnd());
        i += 1;
      }
      blocks.push({ type: "bullet", items });
      continue;
    }

    if (/^\s*\d+\.\s+\S/.test(line)) {
      flushParagraph(paraBuf);
      const items: string[] = [];
      while (i < lines.length) {
        const L = lines[i];
        if (L.trim() === "") break;
        const m = /^\s*\d+\.\s+(.*)$/.exec(L);
        if (!m) break;
        items.push(m[1].trimEnd());
        i += 1;
      }
      blocks.push({ type: "ordered", items });
      continue;
    }

    paraBuf.push(trimmedEnd.trim());
    i += 1;
  }

  flushParagraph(paraBuf);
  return blocks;
}

type Piece =
  | { k: "text"; v: string }
  | { k: "bold"; v: string }
  | { k: "italic"; v: string }
  | { k: "code"; v: string };

function parseInlinePieces(s: string): Piece[] {
  if (!s) return [{ k: "text", v: "" }];

  const out: Piece[] = [];
  let i = 0;

  while (i < s.length) {
    if (s.startsWith("**", i)) {
      const end = s.indexOf("**", i + 2);
      if (end !== -1) {
        out.push({ k: "bold", v: s.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end !== -1) {
        out.push({ k: "code", v: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (s[i] === "*" && s[i + 1] !== "*") {
      const end = s.indexOf("*", i + 1);
      if (end !== -1 && end > i + 1) {
        out.push({ k: "italic", v: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (s[i] === "_" && s[i + 1] !== "_") {
      const end = s.indexOf("_", i + 1);
      if (end !== -1 && end > i + 1) {
        out.push({ k: "italic", v: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    let next = s.length;
    const cand = [
      s.indexOf("**", i),
      s.indexOf("`", i),
      s.indexOf("*", i),
      s.indexOf("_", i),
    ].filter((x) => x > i);
    if (cand.length > 0) next = Math.min(...cand);

    out.push({ k: "text", v: s.slice(i, next) });
    i = next;
  }

  return mergeAdjacentText(out);
}

function mergeAdjacentText(pieces: Piece[]): Piece[] {
  const merged: Piece[] = [];
  for (const p of pieces) {
    const last = merged[merged.length - 1];
    if (p.k === "text" && last?.k === "text") {
      last.v += p.v;
    } else {
      merged.push({ ...p });
    }
  }
  return merged;
}

function InlineLine({
  text,
  theme,
  baseKey,
}: {
  text: string;
  theme: MarkdownPdfTheme;
  baseKey: string;
}): ReactElement {
  const pieces = parseInlinePieces(text);
  return (
    <Text style={theme.paragraph}>
      {pieces.map((p, idx) => {
        const key = `${baseKey}-${idx}`;
        switch (p.k) {
          case "bold":
            return (
              <Text key={key} style={theme.strong}>
                {p.v}
              </Text>
            );
          case "italic":
            return (
              <Text key={key} style={theme.em}>
                {p.v}
              </Text>
            );
          case "code":
            return (
              <Text key={key} style={theme.codespan}>
                {p.v}
              </Text>
            );
          default:
            return (
              <Text key={key}>
                {p.v}
              </Text>
            );
        }
      })}
    </Text>
  );
}

function headingStyle(depth: number, theme: MarkdownPdfTheme): PdfStyle {
  if (depth <= 1) return theme.heading1;
  if (depth === 2) return theme.heading2;
  return theme.heading3;
}

export function MarkdownView({
  markdown,
  theme,
}: {
  markdown: string;
  theme: MarkdownPdfTheme;
}): ReactElement {
  const blocks = parseBlocks(markdown);

  if (blocks.length === 0) {
    return (
      <View style={theme.container}>
        <Text style={theme.paragraph}> </Text>
      </View>
    );
  }

  return (
    <View style={theme.container}>
      {blocks.map((b, bi) => {
        const key = `md-${bi}`;
        switch (b.type) {
          case "paragraph":
            return (
              <View key={key} style={{ marginBottom: 6 }} wrap={false}>
                <InlineLine text={b.text} theme={theme} baseKey={`p-${bi}`} />
              </View>
            );
          case "heading":
            return (
              <View key={key} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={headingStyle(b.depth, theme)}>{b.text}</Text>
              </View>
            );
          case "bullet":
            return (
              <View key={key} style={{ marginBottom: 6 }}>
                {b.items.map((item, ii) => (
                  <View
                    key={`${key}-li-${ii}`}
                    style={theme.bulletRow}
                    wrap={false}
                  >
                    <Text style={theme.bulletGlyph}>•</Text>
                    <View style={{ flex: 1 }}>
                      <InlineLine
                        text={item}
                        theme={theme}
                        baseKey={`ul-${bi}-${ii}`}
                      />
                    </View>
                  </View>
                ))}
              </View>
            );
          case "ordered":
            return (
              <View key={key} style={{ marginBottom: 6 }}>
                {b.items.map((item, ii) => (
                  <View
                    key={`${key}-li-${ii}`}
                    style={theme.bulletRow}
                    wrap={false}
                  >
                    <Text style={theme.orderedGlyph}>{`${ii + 1}.`}</Text>
                    <View style={{ flex: 1 }}>
                      <InlineLine
                        text={item}
                        theme={theme}
                        baseKey={`ol-${bi}-${ii}`}
                      />
                    </View>
                  </View>
                ))}
              </View>
            );
          case "code":
            return (
              <View key={key} style={{ marginBottom: 8 }} wrap={false}>
                <Text style={theme.codeBlock}>
                  {b.lines.join("\n")}
                </Text>
              </View>
            );
          case "hr":
            return <View key={key} style={theme.hr} wrap={false} />;
          default:
            return null;
        }
      })}
    </View>
  );
}
