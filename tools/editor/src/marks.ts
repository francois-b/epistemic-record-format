/**
 * The editor's arithmetic: where a mark lands in the text. Every function
 * here is pure, takes the document as a string, and knows nothing about
 * CodeMirror or a DOM, so it can be unit-tested with `node --test`. The view
 * code in `index.ts` does nothing but turn what these return into
 * decorations.
 *
 * The document is the markdown source, binding markers included. A marker
 * quotes its own anchor, so every search runs over the text with markers
 * blanked out; blanking preserves length, so an offset into the masked text
 * is an offset into the real one.
 */

/** A flag as the server reports it: a passage someone marked to back later. */
export interface FlagMark {
  id: number;
  anchor: string;
  research?: string;
  status: "open" | "done";
  claims?: string[];
  note?: string;
}

/** What a bound claim is, for the reader hovering the passage. */
export interface ClaimInfo { title: string; kind: string; disposition: string; evidence: number }

/** A binding as the server reports it: a passage and the claims it rests on. */
export interface BindingMark {
  anchor: string;
  claims: string[];
  /** current, stale, broken, missing-claim or indeterminate. */
  status: string;
  claimInfo?: Record<string, ClaimInfo>;
}

/** Everything the editor decorates from. */
export interface Marks { flags: FlagMark[]; bindings: BindingMark[] }

export interface Range { from: number; to: number }
export interface FlagRange extends Range { cls: "erf-flag-open" | "erf-flag-done"; flag: FlagMark }
export interface BoundRange extends Range { cls: string; binding: BindingMark }
export interface MarkerRange extends Range { claims: string[] }

export interface Computed {
  /** The flagged words themselves, underlined. */
  flags: FlagRange[];
  /** The passage a binding covers, minus the marker that ends it. */
  bound: BoundRange[];
  /** Each `<!-- claims: … -->` marker, to be collapsed to a widget. */
  markers: MarkerRange[];
  /** Anchors that no longer occur in the text: the prose moved under them. */
  missing: string[];
}

const MARKER = /<!--\s*claims:[\s\S]*?-->/g;

/** The document with every binding marker blanked, same length, so offsets carry over. */
export function maskMarkers(doc: string): string {
  return doc.replace(MARKER, (m) => " ".repeat(m.length));
}

/** Every binding marker in the document, with the claim ids it names. */
export function markerRanges(doc: string): MarkerRange[] {
  const out: MarkerRange[] = [];
  for (const m of doc.matchAll(MARKER)) {
    const at = m.index ?? 0;
    const ids = /claims:\s*([^"]*)/.exec(m[0])?.[1] ?? "";
    out.push({ from: at, to: at + m[0].length, claims: ids.trim().split(/\s+/).filter(Boolean) });
  }
  return out;
}

/**
 * Where an anchor sits in the document: the first occurrence outside a
 * marker. Exact first; failing that, once more with every run of whitespace
 * in the anchor allowed to match any run of whitespace, so an anchor written
 * on one line still finds its passage after the paragraph was hand-wrapped.
 * Null when neither matches.
 */
export function locate(doc: string, anchor: string): Range | null {
  const needle = anchor.trim();
  if (!needle) return null;
  const hay = maskMarkers(doc);
  const at = hay.indexOf(needle);
  if (at >= 0) return { from: at, to: at + needle.length };
  const pattern = needle.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  const m = new RegExp(pattern).exec(hay);
  return m ? { from: m.index, to: m.index + m[0].length } : null;
}

/**
 * The paragraph holding an offset: from just after the previous blank line to
 * just before the next one. The plan's first cut at "the passage", and the
 * same cut the server takes when it reads a flag's passage.
 */
export function paragraphRange(doc: string, at: number): Range {
  const before = doc.lastIndexOf("\n\n", Math.max(0, at - 1));
  const from = before < 0 ? 0 : before + 2;
  const after = doc.indexOf("\n\n", at);
  const to = after < 0 ? doc.length : after;
  return { from: Math.min(from, at), to: Math.max(to, at) };
}

/** current is bound; broken and missing-claim are broken; stale and indeterminate both mean the backing is not confirmed. */
export function boundClass(status: string): string {
  if (status === "current") return "erf-bound";
  if (status === "broken" || status === "missing-claim") return "erf-bound-broken";
  return "erf-bound-stale";
}

/** Every mark placed in the document, and the anchors that could not be placed. */
export function computeMarks(doc: string, marks: Marks): Computed {
  const missing: string[] = [];
  const markers = markerRanges(doc);

  const flags: FlagRange[] = [];
  for (const f of marks.flags ?? []) {
    const r = locate(doc, f.anchor);
    if (!r) { missing.push(f.anchor); continue; }
    flags.push({ ...r, cls: f.status === "done" ? "erf-flag-done" : "erf-flag-open", flag: f });
  }

  const bound: BoundRange[] = [];
  for (const b of marks.bindings ?? []) {
    const r = locate(doc, b.anchor);
    if (!r) { missing.push(b.anchor); continue; }
    const p = paragraphRange(doc, r.from);
    // the marker ends the passage in the source; underline the prose, not the comment
    const inside = markers.filter((m) => m.from >= p.from && m.from < p.to).map((m) => m.from);
    const to = inside.length ? Math.min(...inside) : p.to;
    bound.push({ from: p.from, to: Math.max(p.from, trimEnd(doc, to)), cls: boundClass(b.status), binding: b });
  }

  return { flags, bound, markers, missing };
}

/** Walk back over trailing whitespace, so a decoration does not end in the blank before a marker. */
function trimEnd(doc: string, to: number): number {
  let i = to;
  while (i > 0 && /\s/.test(doc[i - 1] ?? "")) i--;
  return i;
}

/**
 * The anchor a selection offers: the selected words, whitespace collapsed,
 * cut to at most twelve. The host decides whether it is unique; the server
 * checks it again and refuses if it is not.
 */
export function anchorFrom(selected: string, maxWords = 12): string {
  return selected.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, maxWords).join(" ");
}

/** The tooltip a bound passage shows: one line per claim, with what is known of it. */
export function claimLines(b: BindingMark): string[] {
  return b.claims.map((id) => {
    const info = b.claimInfo?.[id];
    return info ? `${id} · ${info.kind} · ${info.disposition} · ${info.evidence} atom${info.evidence === 1 ? "" : "s"} — ${info.title}` : id;
  });
}
