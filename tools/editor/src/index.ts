/**
 * The ERF editor: a markdown editor over a narrative's source, with the
 * record drawn on top of it.
 *
 * Host-agnostic on purpose. It knows how to show text, where a flag and a
 * binding sit in it, and when the person selected something or asked to save.
 * It never calls a tool, never fetches, and never decides what a gesture
 * means: the host does all of that through the handle below. The MCP app is
 * its first host; a native app with a web view can be its second without a
 * rewrite.
 *
 * It works on the markdown source, not a document model, which is why binding
 * markers, footnotes and frontmatter round-trip byte for byte: nothing is
 * parsed and re-serialized. `getText()` is always the file.
 */
import { EditorState, StateField, StateEffect, Annotation, type Extension } from "@codemirror/state";
import { EditorView, keymap, Decoration, WidgetType, showTooltip, drawSelection, highlightSpecialChars, type DecorationSet, type Tooltip, type TooltipView, type ViewUpdate } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, HighlightStyle, ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { computeMarks, anchorFrom, softBreakRanges, frontmatterRange, unwrapChanges, looksHardWrapped, mergeChanges, type Marks, type Range } from "./marks.ts";
import { hitBinding, popoverAfterClick, step, mapPopover, claimCard, sourceHref, type Popover } from "./popover.ts";

export type { Marks, FlagMark, BindingMark, ClaimInfo, AtomInfo } from "./marks.ts";
export { anchorFrom, mergeMarkers } from "./marks.ts";

/** What a selection offers the host: the words, the anchor to flag on, and where to put a popover. */
export interface Selected { text: string; anchor: string; rect: DOMRect }

export interface EditorHandle {
  /** Replace the document; used when the file changed on disk under an unmodified editor. */
  setText(text: string): void;
  /** The document as it stands, markers and frontmatter included. */
  getText(): string;
  /** Recompute the decorations. Returns the anchors that no longer occur in the text. */
  setMarks(m: Marks): { missing: string[] };
  onSelectionChange(cb: (sel: Selected | null) => void): void;
  /** Cmd/Ctrl-S, and once the document has been quiet for `autosaveMs`. */
  onSave(cb: (text: string) => void): void;
  /** True while the document differs from the last text set or saved. */
  isDirty(): boolean;
  /** Take the editor's word for it that what is on screen is now what is on disk. */
  markSaved(): void;
  /** Whether the file was hand-wrapped: wrapping newlines inside its paragraphs, which CommonMark reads as spaces. */
  looksHardWrapped(): boolean;
  /** Make it CommonMark-style, one line per paragraph, as one undoable edit. Returns how many newlines became spaces. */
  unwrap(): number;
  /**
   * Take the binding markers of another version of this file that this one
   * lacks, as one undoable edit that leaves the prose and the cursor alone.
   * Returns how many were placed, and the anchors of any that could not be:
   * those words are no longer here.
   */
  mergeFrom(theirs: string): { inserted: number; conflicts: string[] };
  focus(): void;
  destroy(): void;
}

const setMarksEffect = StateEffect.define<Marks>();
const external = Annotation.define<boolean>();

const marksField = StateField.define<Marks>({
  create: () => ({ flags: [], bindings: [] }),
  update(v, tr) {
    for (const e of tr.effects) if (e.is(setMarksEffect)) return e.value;
    return v;
  },
});

/**
 * A binding marker, collapsed. It is still in the document and still in
 * `getText()`; only its rendering is a diamond. The cursor entering it
 * expands it, which is how a marker gets edited by hand.
 */
class MarkerWidget extends WidgetType {
  constructor(readonly claims: string[]) { super(); }
  override eq(other: MarkerWidget): boolean { return other.claims.join(" ") === this.claims.join(" "); }
  override toDOM(): HTMLElement {
    const s = document.createElement("span");
    s.className = "erf-marker";
    s.textContent = this.claims.length > 1 ? `◆ ${this.claims.length}` : "◆";
    s.title = `bound to ${this.claims.join(", ") || "nothing"}`;
    s.setAttribute("data-erf-claims", this.claims.join(" "));
    return s;
  }
  override ignoreEvent(): boolean { return false; }
}

/**
 * A newline that is only wrapping, shown as the space markdown reads it as.
 * The newline stays in the document and in `getText()`; a hand-wrapped file
 * is written back exactly as it was read.
 */
class SpaceWidget extends WidgetType {
  override eq(): boolean { return true; }
  override toDOM(): HTMLElement { const s = document.createElement("span"); s.className = "erf-soft"; s.textContent = " "; return s; }
}

/** Paragraphs and hard breaks, from the markdown syntax tree; the arithmetic is in marks.ts. */
function blocks(state: EditorState): { paragraphs: Range[]; hardBreaks: Range[] } {
  const tree = ensureSyntaxTree(state, state.doc.length, 200) ?? syntaxTree(state);
  const paragraphs: Range[] = [], hardBreaks: Range[] = [];
  tree.iterate({ enter(n) {
    if (n.name === "Paragraph") paragraphs.push({ from: n.from, to: n.to });
    else if (n.name === "HardBreak") hardBreaks.push({ from: n.from, to: n.to });
  } });
  return { paragraphs, hardBreaks };
}

/** Everything the marks say, as decorations, recomputed from the document each time it or they move. */
function build(state: EditorState): DecorationSet {
  const doc = state.doc.toString();
  const c = computeMarks(doc, state.field(marksField));
  const out: { from: number; to: number; value: Decoration }[] = [];
  // wrapping newlines read as one space, so a hand-wrapped paragraph flows with the measure
  const { paragraphs, hardBreaks } = blocks(state);
  for (const r of softBreakRanges(doc, paragraphs, hardBreaks)) out.push({ from: r.from, to: r.to, value: Decoration.replace({ widget: new SpaceWidget() }) });
  // the frontmatter belongs to the record, not the prose: shown, dimmed, never reflowed
  const fm = frontmatterRange(doc);
  if (fm) for (let pos = fm.from; pos < fm.to; ) { const line = state.doc.lineAt(pos); out.push({ from: line.from, to: line.from, value: Decoration.line({ class: "erf-frontmatter" }) }); pos = line.to + 1; }
  for (const b of c.bound) {
    if (b.to <= b.from) continue;
    out.push({ from: b.from, to: b.to, value: Decoration.mark({ class: b.cls, attributes: { "data-erf-claims": b.binding.claims.join(" ") } }) });
  }
  for (const f of c.flags) {
    if (f.to <= f.from) continue;
    out.push({ from: f.from, to: f.to, value: Decoration.mark({ class: f.cls, attributes: { "data-erf-flag": String(f.flag.id) } }) });
  }
  for (const m of c.markers) {
    // an expanded marker is one the cursor is inside: editing it is how a binding is fixed by hand
    const open = state.selection.ranges.some((r) => r.to >= m.from && r.from <= m.to);
    if (!open) out.push({ from: m.from, to: m.to, value: Decoration.replace({ widget: new MarkerWidget(m.claims) }) });
  }
  return Decoration.set(out.map((r) => r.value.range(r.from, r.to)), true);
}

const decorations = StateField.define<DecorationSet>({
  create: (state) => build(state),
  update(deco, tr) {
    if (tr.docChanged || tr.selection || tr.effects.some((e) => e.is(setMarksEffect))) return build(tr.state);
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// ---- the binding popover ---------------------------------------------------
// A click on a bound passage (or its marker) opens a card listing what the
// passage rests on, one claim at a time, with its atoms and where each came
// from. It opens on a click and not on hover because it has buttons and links
// in it, and a hover card cannot be reached by the pointer. A second click on
// the passage, a click elsewhere, Escape, or typing closes it. The state is
// in `popover.ts`; this is the DOM.

const popoverEffect = StateEffect.define<Popover | null>();

const popoverField = StateField.define<Popover | null>({
  create: () => null,
  update(v, tr) {
    for (const e of tr.effects) if (e.is(popoverEffect)) return e.value;
    if (tr.docChanged) return mapPopover(v, (pos, assoc) => tr.changes.mapPos(pos, assoc));
    return v;
  },
  provide: (f) => showTooltip.from(f, (p) => (p ? popoverTooltip(p) : null)),
});

function popoverTooltip(p: Popover): Tooltip {
  return { pos: p.from, end: p.to, above: true, arrow: true, create: createPopover };
}

/** One tooltip view for the field's lifetime: `create` is stable, so CodeMirror keeps the DOM and calls `update` as the claim steps. */
function createPopover(view: EditorView): TooltipView {
  const dom = document.createElement("div");
  dom.className = "erf-pop";
  const paint = (p: Popover | null): void => { if (p) renderPopover(dom, p, view); };
  paint(view.state.field(popoverField));
  return { dom, update(u: ViewUpdate) { if (u.state.field(popoverField) !== u.startState.field(popoverField)) paint(u.state.field(popoverField)); } };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function renderPopover(dom: HTMLElement, p: Popover, view: EditorView): void {
  const card = claimCard(p);
  dom.replaceChildren();
  const head = el("div", "erf-pop-head");
  head.appendChild(el("span", "erf-pop-status", `bound · ${p.binding.status}`));
  if (card && card.of > 1) {
    const nav = el("span", "erf-pop-nav");
    const prev = el("button", "erf-pop-arrow", "‹"); prev.title = "previous claim"; prev.type = "button";
    const next = el("button", "erf-pop-arrow", "›"); next.title = "next claim"; next.type = "button";
    const go = (d: 1 | -1) => (e: Event) => { e.preventDefault(); const cur = view.state.field(popoverField); if (cur) view.dispatch({ effects: popoverEffect.of(step(cur, d)) }); };
    prev.addEventListener("click", go(-1)); next.addEventListener("click", go(1));
    nav.append(prev, el("span", "erf-pop-count", `${card.at}/${card.of}`), next);
    head.appendChild(nav);
  }
  dom.appendChild(head);
  if (!card) { dom.appendChild(el("div", "erf-pop-title", "bound to nothing")); return; }
  const title = el("a", "erf-pop-title", card.title) as HTMLAnchorElement;
  title.href = `claim-${encodeURIComponent(card.id)}.html`;
  title.title = "open the claim";
  dom.appendChild(title);
  dom.appendChild(el("div", "erf-pop-meta", [card.id, card.kind, card.disposition].filter(Boolean).join(" · ")));
  if (!card.atoms.length) { dom.appendChild(el("div", "erf-pop-none", "no atoms yet")); return; }
  const list = el("ul", "erf-pop-atoms");
  for (const a of card.atoms) {
    const li = el("li", `erf-pop-atom erf-pop-${a.side}`);
    li.appendChild(el("span", "erf-pop-side", a.side));
    li.appendChild(el("span", "erf-pop-finding", ` ${a.finding} `));
    const src = el("a", "erf-pop-source", a.citation ?? a.source ?? a.id) as HTMLAnchorElement;
    src.href = sourceHref(a);
    src.title = a.url ? "open the page this was captured from" : "open the atom";
    li.appendChild(src);
    list.appendChild(li);
  }
  dom.appendChild(list);
}

/** The bound passage under a pointer event, whether on the prose or on a collapsed marker. */
function bindingAt(view: EditorView, e: MouseEvent) {
  const c = computeMarks(view.state.doc.toString(), view.state.field(marksField));
  const widget = (e.target as HTMLElement).closest?.(".erf-marker") as HTMLElement | null;
  if (widget) {
    const ids = widget.getAttribute("data-erf-claims") ?? "";
    return c.bound.find((b) => b.binding.claims.join(" ") === ids) ?? null;
  }
  const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
  return pos === null ? null : hitBinding(c, pos);
}

const popoverHandlers = EditorView.domEventHandlers({
  click(e, view) {
    // a click that ends a drag is a selection, not a request for the card
    if (!view.state.selection.main.empty) return false;
    const next = popoverAfterClick(view.state.field(popoverField), bindingAt(view, e));
    if (next !== view.state.field(popoverField)) view.dispatch({ effects: popoverEffect.of(next) });
    return false;
  },
});

const closePopover = (view: EditorView): boolean => {
  if (!view.state.field(popoverField)) return false;
  view.dispatch({ effects: popoverEffect.of(null) });
  return true;
};

/**
 * Plain and readable, and nothing more: the plan rules typography out. A
 * monospace face, a comfortable measure, a line height that lets the
 * underlines show. Colours come from the host's variables where it sets them,
 * and fall back to something legible where it does not.
 */
function theme(): Extension {
  return EditorView.theme({
    "&": {
      color: "var(--ink, #1a1a1a)",
      backgroundColor: "var(--paper, #ffffff)",
      fontFamily: "var(--mono, ui-monospace, Menlo, monospace)",
      fontSize: "13.5px",
      height: "100%",
    },
    ".cm-scroller": { lineHeight: "1.7", overflow: "auto", fontFamily: "inherit" },
    ".cm-content": { maxWidth: "78ch", margin: "0 auto", padding: "1rem 0 40vh", caretColor: "var(--accent, #1a3a6e)" },
    ".cm-line": { padding: "0 .4rem" },
    "&.cm-focused": { outline: "none" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent, #1a3a6e)" },
    // the base theme names these with the scroller in the selector, so the override has to as well
    ".cm-selectionLayer .cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": { backgroundColor: "color-mix(in srgb, var(--accent, #1a3a6e) 30%, transparent)" },
    ".cm-content ::selection": { backgroundColor: "transparent" },
    ".erf-frontmatter": { opacity: "0.55" },
    ".erf-soft": { whiteSpace: "pre-wrap" },
    ".erf-flag-open": { borderBottom: "2px dashed var(--warn, #8a4b1e)" },
    // taken: someone else is on it, so the line is solid rather than waiting
    ".erf-flag-taken": { borderBottom: "2px solid var(--accent, #1a3a6e)" },
    ".erf-flag-done": { borderBottom: "1px dotted var(--mutedlt, #a5a09a)" },
    // translucent, so the selection layer beneath the content stays visible inside a bound passage
    ".erf-bound": { backgroundColor: "color-mix(in srgb, var(--good, #1f5c3d) 9%, transparent)", boxShadow: "inset 0 -1px 0 var(--good, #1f5c3d)" },
    ".erf-bound-stale": { backgroundColor: "color-mix(in srgb, var(--warn, #8a4b1e) 10%, transparent)", boxShadow: "inset 0 -1px 0 var(--warn, #8a4b1e)" },
    ".erf-bound-broken": { backgroundColor: "color-mix(in srgb, #c0392b 12%, transparent)", boxShadow: "inset 0 -1px 0 var(--brokenrule, #c0392b)" },
    ".erf-marker": {
      display: "inline-block", cursor: "default", padding: "0 .35em", marginLeft: ".3em",
      borderRadius: "3px", border: "1px solid var(--rule, #d8d3cc)",
      background: "var(--codebg, #fefcf8)", color: "var(--good, #1f5c3d)", fontSize: ".85em",
    },
    // the popover: a card the pointer can enter, with arrows and links
    ".cm-tooltip.cm-tooltip-above:has(.erf-pop)": { border: "none", background: "transparent" },
    ".erf-pop": {
      width: "46ch", maxWidth: "calc(100vw - 2rem)", padding: ".5rem .7rem .55rem", borderRadius: "6px",
      border: "1px solid var(--rule, #d8d3cc)", background: "var(--paper, #fff)",
      color: "var(--ink, #1a1a1a)", font: "12.5px/1.5 var(--sans, system-ui, sans-serif)",
      boxShadow: "0 3px 14px rgba(0,0,0,.28)",
    },
    ".erf-pop-head": { display: "flex", alignItems: "baseline", gap: ".5rem", marginBottom: ".3rem" },
    ".erf-pop-status": { color: "var(--muted, #5a5550)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: "10px", marginRight: "auto" },
    ".erf-pop-nav": { display: "inline-flex", alignItems: "center", gap: ".25rem" },
    ".erf-pop-count": { color: "var(--muted, #5a5550)", fontVariantNumeric: "tabular-nums", fontSize: "11px" },
    ".erf-pop-arrow": {
      border: "1px solid var(--rule, #d8d3cc)", background: "var(--codebg, #fefcf8)", color: "var(--ink, #1a1a1a)",
      borderRadius: "4px", padding: "0 .45em", cursor: "pointer", font: "inherit", lineHeight: "1.3",
    },
    ".erf-pop-arrow:hover": { borderColor: "var(--accent, #1a3a6e)", color: "var(--accent, #1a3a6e)" },
    ".erf-pop-title": { display: "block", fontWeight: "600", color: "var(--ink, #1a1a1a)", textDecoration: "none" },
    ".erf-pop-title:hover": { color: "var(--accent, #1a3a6e)" },
    ".erf-pop-meta": { color: "var(--muted, #5a5550)", fontFamily: "var(--mono, ui-monospace, Menlo, monospace)", fontSize: "11px", margin: ".1rem 0 .35rem" },
    ".erf-pop-none": { color: "var(--muted, #5a5550)", fontStyle: "italic" },
    ".erf-pop-atoms": { listStyle: "none", margin: "0", padding: "0", maxHeight: "14rem", overflow: "auto" },
    ".erf-pop-atom": { padding: ".25rem 0", borderTop: "1px solid var(--rulelt, #ebe7e1)" },
    ".erf-pop-side": {
      display: "inline-block", fontSize: "10px", textTransform: "uppercase", letterSpacing: ".05em",
      padding: "0 .35em", borderRadius: "3px", border: "1px solid var(--rule, #d8d3cc)", color: "var(--good, #1f5c3d)", marginRight: ".3em",
    },
    ".erf-pop-against .erf-pop-side": { color: "var(--warn, #8a4b1e)" },
    ".erf-pop-source": { color: "var(--accent, #1a3a6e)", fontStyle: "italic" },
  });
}

/** What comes free with the markdown parser: structure marked, nothing resized. */
const highlight = HighlightStyle.define([
  { tag: tags.heading, color: "var(--accent, #1a3a6e)", fontWeight: "600" },
  { tag: tags.link, color: "var(--accent, #1a3a6e)" },
  { tag: tags.url, color: "var(--muted, #5a5550)" },
  { tag: tags.monospace, color: "var(--good, #1f5c3d)" },
  { tag: tags.quote, color: "var(--muted, #5a5550)" },
  { tag: tags.comment, color: "var(--mutedlt, #a5a09a)" },
  { tag: tags.processingInstruction, color: "var(--mutedlt, #a5a09a)" },
]);

export function createEditor(parent: HTMLElement, text: string, opts?: { autosaveMs?: number }): EditorHandle {
  const autosaveMs = opts?.autosaveMs ?? 2000;
  let onSelection: (sel: Selected | null) => void = () => {};
  let onSaveCb: (text: string) => void = () => {};
  let timer: ReturnType<typeof setTimeout> | null = null;
  let saved = text;

  // The host, not the editor, decides that a save happened: a write the server
  // refuses must leave the document dirty, or the next digest change would be
  // reconciled against text nobody kept.
  const fire = (): void => {
    timer = null;
    const now = view.state.doc.toString();
    if (now === saved) return;
    onSaveCb(now);
  };
  const save = (): boolean => { if (timer) { clearTimeout(timer); timer = null; } fire(); return true; };

  const selectionOf = (): Selected | null => {
    const r = view.state.selection.main;
    if (r.empty) return null;
    const selected = view.state.sliceDoc(r.from, r.to);
    const anchor = anchorFrom(selected);
    if (anchor.length < 8) return null;
    const a = view.coordsAtPos(r.from), b = view.coordsAtPos(r.to);
    const left = Math.min(a?.left ?? 0, b?.left ?? 0), right = Math.max(a?.right ?? 0, b?.right ?? 0);
    const top = Math.min(a?.top ?? 0, b?.top ?? 0), bottom = Math.max(a?.bottom ?? 0, b?.bottom ?? 0);
    return { text: selected.replace(/\s+/g, " ").trim(), anchor, rect: new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top)) };
  };

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: text,
      extensions: [
        history(),
        drawSelection(),
        highlightSpecialChars(),
        EditorView.lineWrapping,
        markdown(),
        syntaxHighlighting(highlight),
        marksField,
        decorations,
        popoverField,
        popoverHandlers,
        keymap.of([{ key: "Mod-s", preventDefault: true, run: save }, { key: "Escape", run: closePopover }, ...historyKeymap, ...defaultKeymap]),
        theme(),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && !u.transactions.some((t) => t.annotation(external))) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(fire, autosaveMs);
          }
          if (u.selectionSet || u.docChanged) onSelection(selectionOf());
        }),
      ],
    }),
  });

  return {
    setText(next: string): void {
      if (timer) { clearTimeout(timer); timer = null; }
      saved = next;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next }, annotations: external.of(true) });
    },
    getText: () => view.state.doc.toString(),
    setMarks(m: Marks): { missing: string[] } {
      view.dispatch({ effects: setMarksEffect.of(m), annotations: external.of(true) });
      return { missing: computeMarks(view.state.doc.toString(), m).missing };
    },
    onSelectionChange(cb): void { onSelection = cb; },
    onSave(cb): void { onSaveCb = cb; },
    isDirty: () => view.state.doc.toString() !== saved,
    markSaved(): void { saved = view.state.doc.toString(); },
    looksHardWrapped(): boolean {
      const { paragraphs, hardBreaks } = blocks(view.state);
      return looksHardWrapped(view.state.doc.toString(), paragraphs, hardBreaks);
    },
    unwrap(): number {
      const { paragraphs, hardBreaks } = blocks(view.state);
      const changes = unwrapChanges(view.state.doc.toString(), paragraphs, hardBreaks);
      if (changes.length) view.dispatch({ changes, userEvent: "erf.unwrap" });
      return changes.length;
    },
    mergeFrom(theirs: string): { inserted: number; conflicts: string[] } {
      const { changes, inserted, conflicts } = mergeChanges(view.state.doc.toString(), theirs);
      // one transaction, so it is one step of undo, and the host saves what is here afterwards
      if (changes.length) view.dispatch({ changes, userEvent: "erf.merge", annotations: external.of(true) });
      return { inserted, conflicts };
    },
    focus: () => view.focus(),
    destroy(): void { if (timer) clearTimeout(timer); view.destroy(); },
  };
}
