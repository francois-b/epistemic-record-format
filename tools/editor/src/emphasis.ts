/**
 * Live preview of markdown emphasis, without a DOM: which `*` and `#` marks
 * to hide and which spans to style, given where the cursor is. Pure, so it
 * can be unit-tested; `index.ts` reads the spans off the syntax tree and
 * turns what this returns into decorations.
 *
 * The rule is the one markdown editors share: `**bold**` reads as bold with
 * its asterisks hidden, and the asterisks come back for the span the cursor
 * is inside, so the person sees what they are editing. Nothing in the file
 * changes; only the rendering.
 */
import type { Range } from "./marks.ts";

/** A styled span from the syntax tree, with the marks that delimit it. */
export interface Span {
  /** StrongEmphasis, Emphasis, or ATXHeading1..6. */
  name: string;
  from: number;
  to: number;
  /** The EmphasisMark or HeaderMark children. */
  marks: Range[];
}

export interface Styled extends Range { cls: "erf-strong" | "erf-em" | "erf-heading" }

export function classFor(name: string): Styled["cls"] | null {
  if (name === "StrongEmphasis") return "erf-strong";
  if (name === "Emphasis") return "erf-em";
  if (/^ATXHeading[1-6]$/.test(name)) return "erf-heading";
  return null;
}

/** Whether any cursor or selection touches the span, its marks included. */
export function cursorTouches(span: Range, cursors: Range[]): boolean {
  return cursors.some((r) => r.from <= span.to && r.to >= span.from);
}

/**
 * The spans to style and the marks to hide. A span's marks stay visible while
 * a cursor is in it. A heading's `#` marks take the single space after them
 * with them, so the heading text sits where the marks were; `doc` is read for
 * that space and nothing else.
 */
export function livePreview(spans: Span[], cursors: Range[], doc: string): { styled: Styled[]; hidden: Range[] } {
  const styled: Styled[] = [], hidden: Range[] = [];
  for (const s of spans) {
    const cls = classFor(s.name);
    if (!cls) continue;
    styled.push({ from: s.from, to: s.to, cls });
    if (cursorTouches(s, cursors)) continue;
    for (const m of s.marks) {
      const to = cls === "erf-heading" && doc[m.to] === " " ? m.to + 1 : m.to;
      if (to > m.from) hidden.push({ from: m.from, to });
    }
  }
  return { styled, hidden: hidden.sort((a, b) => a.from - b.from) };
}
