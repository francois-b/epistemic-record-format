/**
 * The vocabulary a reader of a cut page is handed, in one table, so the
 * legend is generated and the wording lives in one place. The kinds and
 * the dispositions are the specification's (`SPEC.md` section 5 for the
 * kinds, `ERF-41` for the dispositions); the marks are what the viewer's
 * own lines say. A term that is not here is not in the legend, and a
 * legend line with no term behind it cannot exist: the format has no
 * `[given]` mark, so none is listed.
 */

export interface Term {
  term: string;
  /** How the term is set: an apparatus tag, a bracketed mark, a word from a relations line, the arrow that opens one. */
  as: "tag" | "mark" | "word" | "arrow";
  gloss: string;
}

/** Epistemic kinds, each with what would settle a claim of that kind (`SPEC.md` section 5). */
export const KINDS: Term[] = [
  { term: "observation", as: "tag", gloss: "data or research settles it; it owes atoms" },
  { term: "argument", as: "tag", gloss: "reasoning settles it; it owes premises, the claims it assumes and the claims that support it" },
  { term: "commitment", as: "tag", gloss: "chosen conduct, to be enforced; the author's decision is the backing" },
  { term: "bet", as: "tag", gloss: "relied on, not established; the world will settle it" },
];

/** Dispositions, the computed reading of a claim's standings (`ERF-41`), each with a plain gloss. */
export const DISPOSITIONS: Term[] = [
  { term: "proposal", as: "tag", gloss: "drafted, not yet stood on" },
  { term: "active", as: "tag", gloss: "every current stance is for" },
  { term: "rejected", as: "tag", gloss: "every current stance is against" },
  { term: "contested", as: "tag", gloss: "stances on both sides" },
  { term: "retired", as: "tag", gloss: "every stance withdrawn, kept for the record" },
];

/** The marks and words a claim line and its relations line carry. */
export const MARKS: Term[] = [
  { term: "unbacked", as: "mark", gloss: "the promised backing is absent: no atoms behind an observation or a bet, no grounds behind an argument; stood on adds that someone stands on it anyway" },
  { term: "part of", as: "word", gloss: "an indented claim that is a part of its parent rather than an argument for it" },
  { term: "↳", as: "arrow", gloss: "every other relationship: premise of, rests on and includes (a claim placed elsewhere in this document, shown once), supports and supported by, conflicts with; the lines read in both directions" },
  { term: "counter-evidenced", as: "word", gloss: "an evidence line with atoms against: attached to the claim itself, it never clears the unbacked mark and never by itself moves the disposition" },
  { term: "backing not resolvable", as: "word", gloss: "an atom behind the claim quotes a source whose text this render does not hold, so the backing cannot be opened here" },
];

/** What a claim line reads as, and where a click goes. */
export const LEGEND_LEAD = "Each claim line reads: number · title · kind · disposition. Click a claim for its page, with its relations and its evidence.";

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/** One term as the page sets it. Kinds are not coloured, dispositions are: the viewer's convention. */
function termHtml(t: Term, group: "kind" | "disposition" | "mark"): string {
  switch (t.as) {
    case "tag": return `<span class="t${group === "disposition" ? ` d-${esc(t.term)}` : ""}">${esc(t.term)}</span>`;
    case "mark": return `<span class="mark"><span class="bkt">[</span>${esc(t.term)}<span class="bkt">]</span></span>`;
    case "word": return `<span class="t">${esc(t.term)}</span>`;
    case "arrow": return `<span class="legendarrow">${esc(t.term)}</span>`;
  }
}

function group(label: string, terms: Term[], kind: "kind" | "disposition" | "mark"): string {
  return `<div class="legendlabel">${esc(label)}</div><dl class="legendgrid">${
    terms.map((t) => `<dt>${termHtml(t, kind)}</dt><dd>${esc(t.gloss)}</dd>`).join("")}</dl>`;
}

/** The legend, generated from the tables above. */
export function legendHtml(): string {
  return `<div class="legend"><p class="legendlead">${esc(LEGEND_LEAD)}</p>${
    group("Kind: what would settle the claim", KINDS, "kind")}${
    group("Disposition: where the claim stands", DISPOSITIONS, "disposition")}${
    group("Marks", MARKS, "mark")}</div>`;
}
