/**
 * The computed readings, implemented from the specification text rather than
 * from any existing tooling. Nothing here is ever stored: every function is a
 * projection over records the corpus already holds.
 */
import type { Atom, Claim, StandingEntry } from "../types/erf.ts";
import type { LoadedCorpus } from "./corpus.ts";

export type Disposition =
  | "proposal" | "active" | "contested" | "rejected" | "retired";

/** Each person's newest stance, which is what `ERF-41` reads. */
export function currentStances(standings: StandingEntry[]): StandingEntry[] {
  const newest = new Map<string, StandingEntry>();
  for (const s of standings) {
    const prev = newest.get(s.by);
    if (!prev || String(s.timestamp) > String(prev.timestamp)) newest.set(s.by, s);
  }
  return [...newest.values()];
}

export interface DispositionReading {
  disposition: Disposition;
  /** Why it computes to that, in words a reader can check against the ledger. */
  because: string;
  current: StandingEntry[];
}

/**
 * `ERF-41`. No standings is a proposal. Otherwise discard withdrawn
 * stances, since withdrawal is exit rather than opposition, and read what
 * remains: nothing is retired, all `for` is active, all `against` is
 * rejected, a mix is contested. Total over every input, and no tie-break.
 */
export function disposition(claim: Claim): DispositionReading {
  const current = currentStances(claim.standings);
  if (current.length === 0) {
    return {
      disposition: "proposal",
      because: "No one has taken a stance, so the claim is a proposal. The format never infers a position from the strength of the evidence.",
      current,
    };
  }
  const held = current.filter((s) => s.stance !== "withdrawn");
  if (held.length === 0) {
    return {
      disposition: "retired",
      because: `Every current stance is "withdrawn", so the claim is retired. Retired means its holders left the question, not that it was shown false: read each why.`,
      current,
    };
  }
  const forCount = held.filter((s) => s.stance === "for").length;
  const againstCount = held.length - forCount;
  if (forCount > 0 && againstCount > 0) {
    const who = held.map((s) => `${s.by} ${s.stance}`).join(", ");
    return {
      disposition: "contested",
      because: `Current stances disagree (${who}). Contested is the terminal reading: no stance outranks another, and the format supplies no tie-break.`,
      current,
    };
  }
  if (againstCount > 0) {
    return {
      disposition: "rejected",
      because: `Every current holder stands against (${againstCount} of ${held.length}), so the claim is rejected. Rejected means judged false, which is not the same as retired.`,
      current,
    };
  }
  return {
    disposition: "active",
    because: `Every current holder stands for it (${forCount} of ${held.length}), so the claim is active.`,
    current,
  };
}

/**
 * Whether a reader can resolve an atom's backing: in a published corpus,
 * whether the captured copy travelled with the records.
 *
 * This is the viewer's own choice, not a rule of the format.
 * once required it and was retired on 2026-08-23, because v1 says nothing
 * about how a claim is presented to a reader without the sources. Showing
 * the gap is still the honest thing for a reader to see, so the reference
 * consumer keeps doing it.
 */
export function resolvable(atomId: string, c: LoadedCorpus): { ok: boolean; why: string } {
  const cap = c.captures.get(atomId);
  if (!cap) return { ok: false, why: "no capture recorded for this atom" };
  if (cap.status === "shipped" && cap.path) return { ok: true, why: "captured copy travels with the corpus" };
  return { ok: false, why: cap.reason ?? `capture status: ${cap.status}` };
}

export interface BackingReading {
  total: number;
  resolvable: number;
  /** True when a consumer may present the claim as backed at all. */
  presentableAsBacked: boolean;
  note: string;
}

/** What the viewer says before calling a claim backed. Its own rule, not the
 *  format's: see the note on `resolvable` above. */
export function backing(claim: Claim, c: LoadedCorpus): BackingReading {
  const ids = [...claim.atoms_for, ...claim.atoms_against];
  const ok = ids.filter((a) => resolvable(a, c).ok).length;
  const surveys = claim.surveys?.length ?? 0;
  if (ids.length === 0 && surveys === 0) {
    return { total: 0, resolvable: 0, presentableAsBacked: false, note: "no evidence attached" };
  }
  if (ok === ids.length) {
    return { total: ids.length, resolvable: ok, presentableAsBacked: true, note: "all evidence resolvable by this reader" };
  }
  return {
    total: ids.length,
    resolvable: ok,
    presentableAsBacked: false,
    note: `${ids.length - ok} of ${ids.length} atoms cannot be opened by this reader, so this claim is shown as a position, not as backed evidence`,
  };
}

/**
 * The normalization of `ERF-51`, in the specified order.
 *
 * Case is deliberately NOT folded: case is part of a verbatim quote, and
 * folding it lets a mis-cased quote pass a check whose whole job is fidelity.
 * An earlier draft of this viewer lowercased, which is what prompted the
 * requirement to say so.
 */
export function normalizeForCheck(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/\u00AD/g, "")
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/-\n\s*/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/[*_`]/g, "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export type QuoteCheck = { state: "pass" | "fail" | "uncheckable"; detail: string };

export function quoteCheck(atom: Atom, captureText: string | null): QuoteCheck {
  if (captureText === null) {
    return { state: "uncheckable", detail: "the captured copy is not present, so the check cannot run here" };
  }
  const hay = normalizeForCheck(captureText);
  // `ERF-52`: only [...] elides. Bare ... and … are literal source text.
  const parts = atom.quote.split("[...]").map(normalizeForCheck).filter(Boolean);
  if (parts.length === 0) {
    return { state: "fail", detail: "the quote is nothing but elisions, so it checks nothing" };
  }
  let cursor = 0;
  for (const p of parts) {
    const at = hay.indexOf(p, cursor);
    if (at < 0) return { state: "fail", detail: "a segment of the quote does not occur in the capture" };
    cursor = at + p.length;
  }
  return { state: "pass", detail: "the normalized quote occurs in the capture" };
}

/** `ERF-47`: a verdict older than the last change to what it judged. */
export function staleAudits(atom: Atom): boolean {
  const changed = atom.last_modified?.timestamp;
  if (!changed || atom.finding_audit.length === 0) return false;
  return atom.finding_audit.some((a) => String(a.timestamp) < String(changed));
}

/** `ERF-49`: the computed warning a render shows. */
export function unbacked(claim: Claim): boolean {
  const stood = currentStances(claim.standings).length > 0;
  if (!stood) return false;
  if (claim.epistemic_kind === "observation") {
    return claim.atoms_for.length === 0 && (claim.surveys?.length ?? 0) === 0;
  }
  if (claim.epistemic_kind === "argument") return claim.edges.length === 0;
  return false;
}

/** `ERF-35`: every reference resolves. */
export function danglingRefs(c: LoadedCorpus): string[] {
  const out: string[] = [];
  const has = (id: string) => c.claims.has(id) || c.surveys.has(id);
  for (const [id, cl] of c.claims) {
    for (const a of [...cl.atoms_for, ...cl.atoms_against]) {
      if (!c.atoms.has(a)) out.push(`${id} -> atom ${a}`);
    }
    for (const e of cl.edges) if (!has(e.to)) out.push(`${id} -> claim ${e.to}`);
    for (const s of cl.surveys ?? []) if (!c.surveys.has(s)) out.push(`${id} -> survey ${s}`);
  }
  for (const [id, s] of c.surveys) {
    for (const nr of s.notable_results) {
      for (const a of nr.atoms ?? []) if (!c.atoms.has(a)) out.push(`${id} -> atom ${a}`);
    }
  }
  return out;
}

/** Reverse index: which claims lean on an atom. */
export function claimsUsingAtom(c: LoadedCorpus): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const [id, cl] of c.claims) {
    for (const a of [...cl.atoms_for, ...cl.atoms_against]) {
      m.set(a, [...(m.get(a) ?? []), id]);
    }
  }
  return m;
}
