/**
 * Proposals: what a worker puts to the person for a ruling, and what the
 * ruling did to each. Producer machinery, like flags and the research log:
 * a proposal is not a record, and the format never sees one. A claim is
 * written only when the person accepts or narrows a proposal on the card;
 * until then nothing about the claim exists but this.
 *
 * This module is pure (no filesystem), so the server and the app share it
 * and the state a card shows can be tested without either.
 */

export type Ruling = "accepted" | "narrowed" | "dropped";
export const RULINGS = ["accepted", "narrowed", "dropped"] as const;

/** One proposed claim, as the worker put it. */
export interface Proposal {
  /** The slug the claim would take. */
  id: string;
  title: string;
  epistemic_kind: string;
  atoms_for?: string[];
  atoms_against?: string[];
  /** What would settle it. */
  settles?: string;
  /** The worker's remark: what to watch, why it is thin. */
  note?: string;
}

/** What the person did with one proposal, and the claim it became. */
export interface Ruled { ruling: Ruling; ts: string; title?: string; claim?: string }

/** One worker's set of proposals for one flag, with the rulings as they land. */
export interface ProposalSet {
  flag: number;
  ts: string;
  by: string;
  narrative: string;
  anchor: string;
  span?: string;
  research: string;
  survey?: string;
  summary?: string;
  proposals: Proposal[];
  rulings: Record<string, Ruled>;
  /** open: waiting on the person; ruled: finished (bound, or every proposal dropped); superseded: a later set for the same flag replaced it. */
  status: "open" | "ruled" | "superseded";
  done_ts?: string;
  /** The claims the passage was bound to when the set was finished. */
  bound?: string[];
}

/** An atom as the card shows it: the quote and where it came from, resolved. */
export interface ResolvedAtom {
  id: string;
  side: "for" | "against";
  quote: string;
  finding: string;
  source: string;
  citation?: string;
  url?: string;
  page?: number;
  quality?: string;
  as_of?: string;
  limitations?: string;
  /** The id names no atom in the corpus. */
  missing?: boolean;
}

export interface ProposalView extends Proposal { atoms: ResolvedAtom[]; ruled?: Ruled }

export interface Counts { total: number; ruled: number; accepted: number; narrowed: number; dropped: number }

/** The set as the card reads it: every proposal with its atoms resolved, and the state of the ruling. */
export interface ProposalSetView {
  kind: "proposals";
  corpus: string;
  flag: number;
  ts: string;
  by: string;
  narrative: string;
  narrative_title: string;
  anchor: string;
  span?: string;
  research: string;
  survey?: string;
  summary?: string;
  proposals: ProposalView[];
  counts: Counts;
  all_ruled: boolean;
  status: ProposalSet["status"];
  bound?: string[];
}

export function counts(set: Pick<ProposalSet, "proposals" | "rulings">): Counts {
  const c: Counts = { total: set.proposals.length, ruled: 0, accepted: 0, narrowed: 0, dropped: 0 };
  for (const p of set.proposals) {
    const r = set.rulings[p.id];
    if (!r) continue;
    c.ruled++;
    c[r.ruling]++;
  }
  return c;
}

/** Every proposal has a ruling: the gate on "bind and finish". */
export function allRuled(set: Pick<ProposalSet, "proposals" | "rulings">): boolean {
  return set.proposals.length > 0 && set.proposals.every((p) => set.rulings[p.id]);
}

/** The claims that were minted by the rulings, in proposal order: what the passage is bound to. */
export function acceptedClaims(set: Pick<ProposalSet, "proposals" | "rulings">): string[] {
  return set.proposals.map((p) => set.rulings[p.id]).filter((r): r is Ruled => !!r && r.ruling !== "dropped" && !!r.claim).map((r) => r.claim!);
}

/** The one line that goes into the conversation when a set is finished. */
export function finishLine(set: Pick<ProposalSet, "flag" | "proposals" | "rulings">, bound: boolean): string {
  const by = (ruling: Ruling) => set.proposals.filter((p) => set.rulings[p.id]?.ruling === ruling).map((p) => set.rulings[p.id]!.claim ?? p.id);
  const parts: string[] = [];
  const a = by("accepted"), n = by("narrowed"), d = by("dropped");
  if (a.length) parts.push(`accepted ${a.join(", ")}`);
  if (n.length) parts.push(`narrowed ${n.join(", ")}`);
  if (d.length) parts.push(`dropped ${d.join(", ")}`);
  return `Flag #${set.flag} ruled: ${parts.join("; ") || "nothing"}; ${bound ? "bound." : "nothing to bind, flag resolved."}`;
}

/**
 * The prose a card carries is governed: two things are refused outright, the
 * rest is warned about. "load-bearing" and the em dash are banned in every
 * field the person reads (title, note, what would settle it, summary); a title
 * over thirty words, a note over two sentences, or a summary over two
 * sentences gets a warning line in the result, not a refusal, so a worker
 * learns the shape without losing the set.
 */
export const BANNED_PHRASES = ["load-bearing"] as const;
export const EM_DASH = "\u2014";
export const TITLE_MAX_WORDS = 30;
export const NOTE_MAX_SENTENCES = 2;

export function wordCount(s: string): number { return s.trim() ? s.trim().split(/\s+/).length : 0; }
export function sentenceCount(s: string): number {
  const t = s.trim(); if (!t) return 0;
  return t.split(/[.!?]+(?:\s+|$)/).filter((x) => x.trim()).length;
}

export interface ProseFindings { refusals: string[]; warnings: string[] }

/** What the prose of a set violates (refused) and what it stretches (warned). */
export function proseFindings(set: { summary?: string; proposals: Pick<Proposal, "id" | "title" | "note" | "settles">[] }): ProseFindings {
  const refusals: string[] = [], warnings: string[] = [];
  const banned = (where: string, text: string | undefined) => {
    if (!text) return;
    for (const b of BANNED_PHRASES) if (text.toLowerCase().includes(b)) refusals.push(`${where} says "${b}"; say what it rests on, or that it is the strongest, in plain words`);
    if (text.includes(EM_DASH)) refusals.push(`${where} uses an em dash; use a comma, a colon, or two sentences`);
  };
  banned("the summary", set.summary);
  if (set.summary && sentenceCount(set.summary) > NOTE_MAX_SENTENCES) warnings.push(`the summary runs to ${sentenceCount(set.summary)} sentences; two at most, or none`);
  for (const p of set.proposals) {
    banned(`${p.id}'s title`, p.title); banned(`${p.id}'s note`, p.note); banned(`${p.id}'s settles`, p.settles);
    if (wordCount(p.title) > TITLE_MAX_WORDS) warnings.push(`${p.id}'s title is ${wordCount(p.title)} words; one plain sentence, ${TITLE_MAX_WORDS} at most`);
    if (p.note && sentenceCount(p.note) > NOTE_MAX_SENTENCES) warnings.push(`${p.id}'s note runs to ${sentenceCount(p.note)} sentences; two at most: how strong, and what the gap is`);
  }
  return { refusals, warnings };
}

/** A ruling as one line for the LLM's context. */
export function rulingLine(set: Pick<ProposalSet, "flag">, id: string, r: Ruled): string {
  if (r.ruling === "dropped") return `Flag #${set.flag}: the user dropped the proposal ${id}.`;
  if (r.ruling === "narrowed") return `Flag #${set.flag}: the user narrowed ${id} to "${r.title ?? ""}" and it is minted as claim ${r.claim ?? id}.`;
  return `Flag #${set.flag}: the user accepted ${id}; it is minted as claim ${r.claim ?? id}.`;
}
