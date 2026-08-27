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

/** A ruling as one line for the LLM's context. */
export function rulingLine(set: Pick<ProposalSet, "flag">, id: string, r: Ruled): string {
  if (r.ruling === "dropped") return `Flag #${set.flag}: the user dropped the proposal ${id}.`;
  if (r.ruling === "narrowed") return `Flag #${set.flag}: the user narrowed ${id} to "${r.title ?? ""}" and it is minted as claim ${r.claim ?? id}.`;
  return `Flag #${set.flag}: the user accepted ${id}; it is minted as claim ${r.claim ?? id}.`;
}
