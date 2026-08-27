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
  /** Who is working this flag, when someone has taken it, and since when. */
  taken_by?: string;
  taken_ts?: string;
  /** The server's word that the take has aged out (TAKE_MINUTES): held by someone who is not working now. */
  take_stale?: boolean;
}

/** One atom under a bound claim: its side, its finding, and the page it was captured from (absent when the source was a file). */
export interface AtomInfo { id: string; side: "for" | "against"; finding: string; source: string; citation?: string; url?: string }

/** What a bound claim is, for the popover on the passage. */
export interface ClaimInfo { title: string; kind: string; disposition: string; evidence: number; atoms?: AtomInfo[] }

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
export interface FlagRange extends Range { cls: "erf-flag-open" | "erf-flag-taken" | "erf-flag-done"; flag: FlagMark }
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

/**
 * How a flagged passage draws: open and free, open and taken by a worker, or
 * done. A taken flag reads differently because the queue is shared: someone is
 * already on it. A take the server reports stale draws as open again: the
 * worker who held it is gone, and the rule (thirty minutes) is the server's.
 */
export function flagClass(f: FlagMark): "erf-flag-open" | "erf-flag-taken" | "erf-flag-done" {
  if (f.status === "done") return "erf-flag-done";
  return f.taken_by && !f.take_stale ? "erf-flag-taken" : "erf-flag-open";
}

/** Whether a flag is being worked now: open, asking for research, taken, and the take fresh. */
export function isWorked(f: FlagMark): boolean {
  return f.status === "open" && !!f.research && f.research !== "mint" && !!f.taken_by && !f.take_stale;
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
    flags.push({ ...r, cls: flagClass(f), flag: f });
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

// ---------- merging what another worker bound ----------
//
// A narrative can be written by two workers at once: a person typing in the
// editor, and an LLM in another chat or another session binding a passage.
// The only thing that other worker ever writes into the prose is a binding
// marker, so the two texts do not need a general merge. Every marker of theirs
// that this text lacks is placed on the passage its anchor names, and nothing
// of this text is ever removed: a marker the person deleted stays deleted.

/** The anchor a marker quotes, unescaped, or null when the marker carries none. */
export function markerAnchor(marker: string): string | null {
  const m = /"((?:[^"\\]|\\.)*)"/.exec(marker);
  return m ? m[1]!.replace(/\\(["\\])/g, "$1") : null;
}

/** How a marker is named when it could not be placed: its anchor, else its claim ids. */
function markerName(marker: string): string {
  return markerAnchor(marker) ?? (/claims:\s*([^"]*)/.exec(marker)?.[1] ?? marker).trim();
}

/**
 * The edits that bring the markers of `theirs` into `mine`, as ranges, so a
 * host can apply them through its own document and keep the cursor where the
 * person left it. `mergeMarkers` is this, applied.
 *
 * A marker whose exact text is already in `mine` is left alone. A marker for
 * an anchor `mine` already binds is rewritten in place, which is what a rebind
 * from elsewhere means; otherwise the marker goes on its own line at the end
 * of the paragraph its anchor sits in. An anchor that no longer occurs in
 * `mine` (the person rewrote those words) is a conflict: nothing is inserted
 * and the caller is told which.
 */
export function mergeChanges(mine: string, theirs: string): { changes: { from: number; to: number; insert: string }[]; inserted: number; conflicts: string[] } {
  const conflicts: string[] = [];
  const mineMarkers = markerRanges(mine);
  const groups = new Map<string, { from: number; to: number; lead: string; texts: string[] }>();
  let inserted = 0;
  for (const m of markerRanges(theirs)) {
    const marker = theirs.slice(m.from, m.to);
    if (mine.includes(marker)) continue;
    const anchor = markerAnchor(marker);
    const r = anchor ? locate(mine, anchor) : null;
    if (!r) { conflicts.push(markerName(marker)); continue; }
    const p = paragraphRange(mine, r.from);
    const already = mineMarkers.find((x) => x.from >= p.from && x.to <= p.to && markerAnchor(mine.slice(x.from, x.to)) === anchor);
    const at = already ? { from: already.from, to: already.to, lead: "" } : { from: trimEnd(mine, p.to), to: p.to, lead: "\n" };
    const key = `${at.from}:${at.to}`;
    const g = groups.get(key) ?? { ...at, texts: [] };
    g.texts.push(marker);
    groups.set(key, g);
    inserted++;
  }
  const changes = [...groups.values()]
    .sort((a, b) => b.from - a.from)
    .map((g) => ({ from: g.from, to: g.to, insert: g.texts.map((t, i) => (i === 0 ? g.lead : "\n") + t).join("") }));
  return { changes, inserted, conflicts };
}

/**
 * `mine` with every binding marker of `theirs` it lacks, placed on the passage
 * its anchor names. Pure, so it can be tested without a document; the editor
 * applies the same merge through `mergeChanges`.
 */
export function mergeMarkers(mine: string, theirs: string): { text: string; inserted: number; conflicts: string[] } {
  const { changes, inserted, conflicts } = mergeChanges(mine, theirs);
  let text = mine;
  for (const ch of changes) text = text.slice(0, ch.from) + ch.insert + text.slice(ch.to);
  return { text, inserted, conflicts };
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
    return info ? `${info.title} · ${id} · ${info.kind} · ${info.disposition} · ${info.evidence} atom${info.evidence === 1 ? "" : "s"}` : id;
  });
}

/**
 * The frontmatter block, when the document opens with one: from the first
 * `---` line to the closing one, inclusive. Null when there is none.
 */
export function frontmatterRange(doc: string): Range | null {
  if (!doc.startsWith("---\n") && !doc.startsWith("---\r\n")) return null;
  const close = /\n---[ \t]*(?:\r?\n|$)/.exec(doc.slice(3));
  if (!close) return null;
  return { from: 0, to: 3 + close.index + close[0].length };
}

/**
 * Line breaks that are only wrapping: a newline inside a paragraph, which
 * markdown reads as a space, and the newline before a binding marker, which
 * belongs to the passage the marker ends. Each range covers the newline and
 * the indentation that follows it, so hiding it joins the lines with one
 * displayed space. A hard break (two trailing spaces, or a backslash) is a
 * real break and is left alone; so is anything inside the frontmatter.
 *
 * `paragraphs` and `hardBreaks` come from the markdown syntax tree; this
 * function only does the arithmetic.
 */
export function softBreakRanges(doc: string, paragraphs: Range[], hardBreaks: Range[] = [], opts: { markers?: boolean } = {}): Range[] {
  const fm = frontmatterRange(doc);
  const out: Range[] = [];
  const isHard = (at: number): boolean => hardBreaks.some((h) => at >= h.from && at < h.to);
  const run = (at: number): number => { let i = at + 1; while (i < doc.length && (doc[i] === " " || doc[i] === "\t")) i++; return i; };
  for (const p of paragraphs) {
    if (fm && p.from < fm.to) continue;
    for (let i = p.from; i < p.to; i++) {
      if (doc[i] !== "\n" || isHard(i)) continue;
      const to = run(i);
      if (to >= p.to) continue;               // a newline that ends the paragraph is not inside it
      out.push({ from: i, to });
    }
  }
  if (opts.markers === false) return out.sort((a, b) => a.from - b.from);
  for (const m of markerRanges(doc)) {
    let i = m.from;
    while (i > 0 && (doc[i - 1] === " " || doc[i - 1] === "\t")) i--;
    if (i === 0 || doc[i - 1] !== "\n") continue;
    const nl = i - 1;
    if (fm && nl < fm.to) continue;
    const lineStart = doc.lastIndexOf("\n", nl - 1) + 1;
    if (!doc.slice(lineStart, nl).trim()) continue;     // a marker after a blank line stands alone
    if (out.some((r) => r.from === nl)) continue;
    out.push({ from: nl, to: m.from });
  }
  return out.sort((a, b) => a.from - b.from);
}

/**
 * The edit that makes a hand-wrapped narrative CommonMark-style, one line
 * per paragraph: every wrapping newline inside a paragraph becomes one
 * space. Hard breaks, the frontmatter, and a marker on its own line are
 * untouched, so the only bytes that change are the ones the display was
 * already showing as spaces. Returned as changes, so the host applies them
 * through the editor and they sit in the undo history.
 */
export function unwrapChanges(doc: string, paragraphs: Range[], hardBreaks: Range[] = []): { from: number; to: number; insert: string }[] {
  return softBreakRanges(doc, paragraphs, hardBreaks, { markers: false }).map((r) => ({ from: r.from, to: r.to, insert: " " }));
}

/**
 * Whether a narrative was hand-wrapped: at least three wrapping newlines
 * inside paragraphs, and every line they end short enough to have been
 * wrapped by a person or a formatter rather than a single long paragraph
 * that happens to hold a newline. A CommonMark-style file answers false.
 */
export function looksHardWrapped(doc: string, paragraphs: Range[], hardBreaks: Range[] = [], maxColumns = 120): boolean {
  const soft = softBreakRanges(doc, paragraphs, hardBreaks, { markers: false });
  if (soft.length < 3) return false;
  return soft.every((r) => r.from - (doc.lastIndexOf("\n", r.from - 1) + 1) <= maxColumns);
}
