/**
 * The ruling card, as DOM: one proposal set, the person's buttons on it.
 * Pure of the host: it takes the set the server resolved and two handlers
 * (rule, finish), and builds elements; `main.ts` mounts it and owns the tool
 * calls behind the handlers. Kept apart so the card can be rendered on a
 * plain page with real content and looked at.
 *
 * The hierarchy, top to bottom: an eyebrow (how many, from what kind of
 * pass); the flagged passage as the title, in the reading face; the
 * narrative's title as the deck; then the proposals; then the finish line.
 * Nothing else above the proposals: no ids, no worker, no survey slug, no
 * summary paragraph. Each proposal: a quiet corner row (kind, id), the claim,
 * the quotes, two small labelled lines, the buttons.
 */
import type { ProposalSetView, ProposalView, ResolvedAtom, Ruling } from "../src/proposals.ts";

export interface CardHandlers {
  rule(v: ProposalSetView, id: string, ruling: Ruling, title?: string): void;
  finish(v: ProposalSetView): void;
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

export function proposalsCard(v: ProposalSetView, h: CardHandlers): HTMLElement {
  const root = el("main", "props");
  root.appendChild(el("p", "eyebrow", `${v.counts.total} proposal${v.counts.total === 1 ? "" : "s"} · ${passName(v.research)}`));

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

  for (const p of v.proposals) root.appendChild(proposalBox(v, p, h));

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
  return root;
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

/** One proposal. The title is text; "accept narrower" turns it into an edit box until saved or cancelled. */
function proposalBox(v: ProposalSetView, p: ProposalView, h: CardHandlers): HTMLElement {
  const box = el("div", `prop${p.ruled ? ` ruled-${p.ruled.ruling}` : ""}`);
  const open = !p.ruled && v.status === "open";
  const paint = (editing: boolean): void => {
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
    for (const a of p.atoms) box.appendChild(atomRow(a));
    if (!p.atoms.length) box.appendChild(el("p", "meta", "no evidence attached: an argument, a commitment, or a gap"));
    if (p.settles) box.appendChild(labelled("What would settle it", p.settles));
    if (p.note) box.appendChild(labelled("Note", p.note));
    const actions = el("div", "actions");
    if (p.ruled) {
      actions.appendChild(el("span", `ruled ${p.ruled.ruling}`, p.ruled.ruling === "dropped" ? "dropped" : `${p.ruled.ruling} · claim ${p.ruled.claim ?? p.id}`));
    } else if (open && editing && edit) {
      const save = el("button", "narrow", "save"); save.type = "button"; save.disabled = true; save.title = "mint the claim with this wording";
      const cancel = el("button", "", "cancel"); cancel.type = "button";
      edit.addEventListener("input", () => { save.disabled = edit!.value.trim() === p.title || !edit!.value.trim(); });
      save.addEventListener("click", () => h.rule(v, p.id, "narrowed", edit!.value.trim()));
      cancel.addEventListener("click", () => paint(false));
      actions.append(save, cancel);
      queueMicrotask(() => edit!.focus());
    } else if (open) {
      const accept = el("button", "accept", "accept"); accept.type = "button"; accept.title = "mint the claim as proposed";
      const narrow = el("button", "narrow", "accept narrower"); narrow.type = "button"; narrow.title = "accept a smaller claim: edit it down to what the evidence supports, then save";
      const drop = el("button", "drop", "drop"); drop.type = "button"; drop.title = "no claim; the drop is recorded";
      accept.addEventListener("click", () => h.rule(v, p.id, "accepted"));
      narrow.addEventListener("click", () => paint(true));
      drop.addEventListener("click", () => h.rule(v, p.id, "dropped"));
      actions.append(accept, narrow, drop);
    }
    box.appendChild(actions);
  };
  paint(false);
  return box;
}
