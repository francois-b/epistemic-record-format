/**
 * The ruling card, as DOM: one proposal set, the person's buttons on it.
 * Pure of the host: it takes the set the server resolved, two handlers
 * (rule, finish) and the state it should open in, and builds elements;
 * `main.ts` mounts it, owns the tool calls behind the handlers, and remembers
 * the state. Kept apart so the card can be rendered on a plain page with real
 * content and looked at.
 *
 * The hierarchy, top to bottom: an eyebrow (how many, from what kind of
 * pass); the flagged passage as the title, in the reading face; the
 * narrative's title as the deck; then the proposals; then the finish line.
 * Nothing else above the proposals: no ids, no worker, no survey slug, no
 * summary paragraph. Each proposal: a quiet corner row (kind, id), the claim,
 * a line saying how much evidence it has, the quotes once they are asked for,
 * two small labelled lines, the buttons.
 *
 * Three states, because one conversation holds several passes and a card with
 * every quote open is several screens tall. *Folded* is one line: the flagged
 * passage, how many proposals, how many are ruled, and where the set stands.
 * *Summary* is the head with one row per proposal, which is what a person
 * rules on: the claim, its counts, its three buttons. *Full* opens every
 * quote. A card opens in summary and the evidence comes one proposal at a
 * time, so a third flag does not bury the first.
 *
 * The card is an inline card and stays one: it never asks for fullscreen, and
 * inline the app reports its own height to the host, so folding has to shrink
 * it. Nothing here sets a height and nothing scrolls inside it.
 */
import type { ProposalSetView, ProposalView, ResolvedAtom, Ruling } from "../src/proposals.ts";

export interface CardHandlers {
  rule(v: ProposalSetView, id: string, ruling: Ruling, title?: string): void;
  finish(v: ProposalSetView): void;
}

/** How much of the card is open. The research trail uses the same three words. */
export type CardState = "folded" | "summary" | "full";

export interface CardOptions {
  /** What to open in; summary when nothing is given. */
  state?: CardState;
  /** The state a press moved to: the host remembers it, the card does not. */
  onState?(state: CardState): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** What kind of pass produced the set, for the eyebrow. */
export function passName(research: string): string {
  if (research === "survey") return "from a survey";
  if (research === "back" || research === "opposite") return "from a back pass";
  return "from a decomposition";
}

/** A passage longer than this is shown clipped, with a toggle to show it whole. */
export const CLAMP_CHARS = 240;
/** The folded line carries about this much of the flagged passage. */
export const FOLD_CHARS = 100;

/** Where the set stands, for the folded line. */
export function stateWord(v: ProposalSetView): string {
  if (v.status === "superseded") return "superseded";
  if (v.status === "ruled") return v.bound?.length ? `bound to ${v.bound.length} claim${v.bound.length === 1 ? "" : "s"}` : "finished";
  return "open";
}

/** Cut a passage to one line's worth of characters, on a word where one is near. */
export function clip(s: string, n = FOLD_CHARS): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.lastIndexOf(" ", n - 1);
  return t.slice(0, cut > n * 0.6 ? cut : n - 1).trimEnd() + "…";
}

export interface FoldedLine { passage: string; counts: string; state: string; text: string }

/** The one line a folded card shows: the flagged passage, the counts, the state word. */
export function foldedLine(v: ProposalSetView, chars = FOLD_CHARS): FoldedLine {
  const passage = clip(v.span ?? v.anchor, chars);
  const counts = `${v.counts.total} proposal${v.counts.total === 1 ? "" : "s"} · ${v.counts.ruled} of ${v.counts.total} ruled`;
  const state = stateWord(v);
  return { passage, counts, state, text: `“${passage}” · ${counts} · ${state}` };
}

export interface Opening {
  /** What the person last chose for this set, when the host kept it. */
  stored?: CardState | null;
  status: ProposalSetView["status"];
  ts: string;
  /** The newest set this app has drawn for the corpus, when a host replays several cards. */
  newest?: string | null;
}

/**
 * What a card opens in. The person's own choice wins. A set that is finished
 * or superseded opens folded, since its work is done and the conversation has
 * moved on; so does a set older than the newest card drawn, which is how a
 * replayed conversation shows its earlier passes as one line each. Everything
 * else opens in summary.
 */
export function openingState(o: Opening): CardState {
  if (o.stored === "folded" || o.stored === "summary" || o.stored === "full") return o.stored;
  if (o.status !== "open") return "folded";
  if (o.newest && o.newest > o.ts) return "folded";
  return "summary";
}

export function proposalsCard(v: ProposalSetView, h: CardHandlers, o: CardOptions = {}): HTMLElement {
  const root = el("main", "props");
  let state: CardState = o.state ?? "summary";

  function go(next: CardState): void {
    if (next === state) return;
    state = next;
    o.onState?.(next);
    paintCard();
  }

  function paintCard(): void {
    root.replaceChildren();
    root.classList.toggle("folded", state === "folded");
    if (state === "folded") { root.appendChild(foldedRow(v, () => go("summary"))); return; }

    const headrow = el("div", "headrow");
    const chev = el("button", "chev", "▾"); chev.type = "button"; chev.title = "fold the card to one line";
    chev.addEventListener("click", () => go("folded"));
    const eyebrow = el("button", "eyebrow", `${v.counts.total} proposal${v.counts.total === 1 ? "" : "s"} · ${passName(v.research)}`);
    eyebrow.type = "button"; eyebrow.title = "fold the card to one line";
    eyebrow.addEventListener("click", () => go("folded"));
    const all = el("button", "allquotes", state === "full" ? "fewer quotes" : "all quotes");
    all.type = "button"; all.title = state === "full" ? "close the quotes and rule on the claims" : "open every proposal's quotes at once";
    all.addEventListener("click", () => go(state === "full" ? "summary" : "full"));
    headrow.append(chev, eyebrow, all);
    root.appendChild(headrow);

    const flagged = v.span ?? v.anchor;
    const passage = el("blockquote", "passage", `“${flagged}”`);
    if (flagged.length > CLAMP_CHARS) {
      passage.classList.add("clamped");
      const toggle = el("button", "showall", "show all"); toggle.type = "button";
      toggle.addEventListener("click", () => {
        const clamped = passage.classList.toggle("clamped");
        toggle.textContent = clamped ? "show all" : "show less";
      });
      root.appendChild(passage);
      root.appendChild(toggle);
    } else root.appendChild(passage);
    root.appendChild(el("p", "deck", v.narrative_title));

    for (const p of v.proposals) root.appendChild(proposalBox(v, p, h, state === "full"));

    const foot = el("div", "foot");
    foot.appendChild(el("span", "count", v.status === "ruled"
      ? `finished · ${v.bound?.length ? `bound to ${v.bound.join(", ")}` : "nothing bound, flag resolved"}`
      : `${v.counts.ruled} of ${v.counts.total} ruled${v.counts.ruled ? ` · ${v.counts.accepted} accepted · ${v.counts.narrowed} narrowed · ${v.counts.dropped} dropped` : ""}`));
    if (v.status === "open") {
      const fin = el("button", "", v.counts.accepted + v.counts.narrowed ? "bind and finish" : "finish");
      fin.type = "button"; fin.disabled = !v.all_ruled;
      fin.title = v.all_ruled ? "bind the passage to the accepted claims and resolve the flag" : "rule on every proposal first";
      fin.addEventListener("click", () => h.finish(v));
      foot.appendChild(fin);
    } else if (v.status === "superseded") foot.appendChild(el("span", "", "superseded by a later set"));
    root.appendChild(foot);
    const err = el("p", "err"); err.id = "props-err"; err.hidden = true; root.appendChild(err);
  }

  paintCard();
  return root;
}

/** The folded card: one line, and pressing it opens the card again. */
function foldedRow(v: ProposalSetView, open: () => void): HTMLElement {
  const row = el("button", "foldline"); row.type = "button"; row.title = "open the ruling card";
  const f = foldedLine(v);
  row.appendChild(el("span", "chev", "▸"));
  row.appendChild(el("span", "fold-passage", `“${f.passage}”`));
  row.appendChild(el("span", "fold-counts", f.counts));
  row.appendChild(el("span", `fold-state ${v.status}`, f.state));
  row.addEventListener("click", open);
  return row;
}

/** One atom: the quote first, the finding under it fainter, the id at the top right, the citation as a link. */
function atomRow(a: ResolvedAtom): HTMLElement {
  const row = el("div", `atom ${a.side}${a.missing ? " missing" : ""}`);
  const corner = el("div", "corner");
  corner.appendChild(el("span", `side ${a.side}`, a.side));
  corner.appendChild(el("span", "aid", a.id));
  row.appendChild(corner);
  if (a.missing) { row.appendChild(el("p", "finding", "no such atom in this corpus")); return row; }
  row.appendChild(el("blockquote", "", `“${a.quote}”`));
  row.appendChild(el("p", "finding", a.finding));
  const cite = el("p", "cite");
  const who = el("a", "", a.citation ?? a.source);
  if (a.url) { who.href = a.url; who.title = a.url; who.target = "_blank"; who.rel = "noopener"; }
  else { who.href = `capture-${encodeURIComponent(a.id)}.html`; who.title = "the quote in the held text"; }
  cite.appendChild(who);
  if (a.page) cite.appendChild(document.createTextNode(` · page ${a.page}`));
  if (a.url) { cite.appendChild(document.createTextNode(" · ")); const held = el("a", "capture", "capture"); held.href = `capture-${encodeURIComponent(a.id)}.html`; held.title = "the quote in the held text"; cite.appendChild(held); }
  if (a.quality || a.as_of) cite.appendChild(el("span", "faint", ` · ${[a.quality, a.as_of].filter(Boolean).join(" · ")}`));
  row.appendChild(cite);
  return row;
}

/** A small labelled line: the label in sentence case on its own line, the text under it at the same size. */
function labelled(label: string, text: string): HTMLElement {
  const d = el("p", "meta");
  d.appendChild(el("span", "label", label));
  d.appendChild(document.createTextNode(text));
  return d;
}

/** How much evidence a proposal carries, for the row a person rules on. */
export function evidenceLine(p: Pick<ProposalView, "atoms">): string {
  const f = p.atoms.filter((a) => a.side === "for").length;
  const against = p.atoms.filter((a) => a.side === "against").length;
  return `for ${f} · against ${against}`;
}

/**
 * One proposal. The title is text; "accept narrower" turns it into an edit box
 * until saved or cancelled. The quotes sit behind a disclosure, open from the
 * start in the full card and on request otherwise, so a person reads one
 * proposal's evidence at a time. The three buttons work the same either way.
 */
function proposalBox(v: ProposalSetView, p: ProposalView, h: CardHandlers, quotesOpen: boolean): HTMLElement {
  const box = el("div", `prop${p.ruled ? ` ruled-${p.ruled.ruling}` : ""}`);
  const open = !p.ruled && v.status === "open";
  const hasMore = p.atoms.length > 0 || !!p.settles || !!p.note;
  const paint = (editing: boolean, quotes: boolean): void => {
    box.replaceChildren();
    const corner = el("div", "corner");
    corner.appendChild(el("span", "kind", p.epistemic_kind));
    corner.appendChild(el("span", "id", p.id));
    box.appendChild(corner);
    let edit: HTMLTextAreaElement | null = null;
    if (editing) {
      edit = document.createElement("textarea");
      edit.className = "title-edit"; edit.rows = 3; edit.value = p.title;
      edit.setAttribute("aria-label", `the narrower claim for ${p.id}`);
      box.appendChild(edit);
      box.appendChild(el("p", "hint", "Edit the claim down to what the evidence supports; the proposed wording stays in the notes."));
    } else {
      box.appendChild(el("p", "title", p.ruled?.title ?? p.title));
      if (p.ruled?.title) box.appendChild(el("p", "was", `proposed as: ${p.title}`));
    }
    if (hasMore) {
      const row = el("div", "evidence");
      row.appendChild(el("span", "counts", p.atoms.length ? evidenceLine(p) : "no quotes; a note or a settling line"));
      const disclose = el("button", "disclose", quotes ? "hide quotes" : "quotes"); disclose.type = "button";
      disclose.title = quotes ? "close this proposal's evidence" : "open this proposal's quotes, what would settle it, and the worker's note";
      disclose.addEventListener("click", () => paint(editing, !quotes));
      row.appendChild(disclose);
      box.appendChild(row);
      if (quotes) {
        for (const a of p.atoms) box.appendChild(atomRow(a));
        if (p.settles) box.appendChild(labelled("What would settle it", p.settles));
        if (p.note) box.appendChild(labelled("Note", p.note));
      }
    } else box.appendChild(el("p", "meta", "no evidence attached: an argument, a commitment, or a gap"));
    const actions = el("div", "actions");
    if (p.ruled) {
      actions.appendChild(el("span", `ruled ${p.ruled.ruling}`, p.ruled.ruling === "dropped" ? "dropped" : `${p.ruled.ruling} · claim ${p.ruled.claim ?? p.id}`));
    } else if (open && editing && edit) {
      const save = el("button", "narrow", "save"); save.type = "button"; save.disabled = true; save.title = "mint the claim with this wording";
      const cancel = el("button", "", "cancel"); cancel.type = "button";
      edit.addEventListener("input", () => { save.disabled = edit!.value.trim() === p.title || !edit!.value.trim(); });
      save.addEventListener("click", () => h.rule(v, p.id, "narrowed", edit!.value.trim()));
      cancel.addEventListener("click", () => paint(false, quotes));
      actions.append(save, cancel);
      queueMicrotask(() => edit!.focus());
    } else if (open) {
      const accept = el("button", "accept", "accept"); accept.type = "button"; accept.title = "mint the claim as proposed";
      const narrow = el("button", "narrow", "accept narrower"); narrow.type = "button"; narrow.title = "accept a smaller claim: edit it down to what the evidence supports, then save";
      const drop = el("button", "drop", "drop"); drop.type = "button"; drop.title = "no claim; the drop is recorded";
      accept.addEventListener("click", () => h.rule(v, p.id, "accepted"));
      narrow.addEventListener("click", () => paint(true, quotes));
      drop.addEventListener("click", () => h.rule(v, p.id, "dropped"));
      actions.append(accept, narrow, drop);
    }
    box.appendChild(actions);
  };
  paint(false, quotesOpen);
  return box;
}
