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
 * This is the viewer's own choice and no requirement asks for it. A rule
 * once did, and it was retired on 2026-08-23 when v1 stopped saying anything
 * about how a claim is presented to a reader who lacks the sources. Showing
 * the gap is still the honest thing for a reader to see, so the reference
 * consumer keeps doing it, and demonstrating more than the format demands is
 * a better example than compliance would be.
 */
export function resolvable(atomId: string, c: LoadedCorpus): { ok: boolean; why: string } {
  const cap = c.captures.get(atomId);
  // `ERF-4` exists so these two are distinguishable. An atom with no entry
  // is a defect in the mapping; an atom with a recorded absence is a corpus
  // saying, deliberately, that this capture could not travel. Reporting both
  // as "no capture recorded" collapsed the distinction the rule was for.
  if (!cap) return { ok: false, why: "no entry in the capture mapping, which is a defect in the mapping rather than a statement about this atom (ERF-4)" };
  if (cap.status === "shipped" && cap.path) return { ok: true, why: "captured copy travels with the corpus" };
  return { ok: false, why: cap.reason ?? `capture recorded as absent, status: ${cap.status}` };
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
 * The normalization of `ERF-51`, in the specified order: the six
 * markup-unwrapping steps a to f, then the ten-step sequence.
 *
 * Both halves are mandatory. Unwrapping was optional until 2026-08-23, and
 * the measurement that made it mandatory is the reason to implement it here:
 * over one corpus, running the sequence without it moved the failure rate
 * from 9% to 19%, so the optional step decided the verdict on roughly one
 * atom in ten. This viewer implemented steps 1 to 10 only, which meant the
 * reference consumer computed verdicts under exactly the configuration the
 * specification says produces divergent answers, and printed them to a
 * reader as "Quote check passes".
 *
 * Case is deliberately NOT folded: case is part of a verbatim quote, and
 * folding it lets a mis-cased quote pass a check whose whole job is fidelity.
 * An earlier draft of this viewer lowercased, which is what prompted the
 * requirement to say so.
 */
export function normalizeForCheck(s: string): string {
  return s
    // a. Markdown link syntax reduces to its link text.
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // b. Attribute blobs in braces are removed.
    .replace(/\{[^}]*\}/g, "")
    // c. Parenthesized link targets: absolute, protocol-relative,
    //    root-relative, fragment-only.
    .replace(/\((?:https?:)?\/\/[^)]*\)/g, "")
    .replace(/\(#[^)]*\)/g, "")
    .replace(/\(\/[^)]*\)/g, "")
    // d. Blockquote markers at the start of a line, with one following space.
    .replace(/^[ \t]*>[ ]?/gm, "")
    // e. Square brackets, straight double quotes, and \u00AE \u2122 \u00A9 ^ \.
    .replace(/[[\]"\u00AE\u2122\u00A9^\\]/g, "")
    // f. A space before , . ; : ! ? \u2014 a document-export artifact.
    .replace(/ ([,.;:!?])/g, "$1")
    // 1. Unicode NFKC.
    .normalize("NFKC")
    // 2. Soft hyphens.
    .replace(/\u00AD/g, "")
    // 3. Typographic single quotes.
    .replace(/[\u2018\u2019\u201B]/g, "'")
    // 4. Typographic double quotes.
    .replace(/[\u201C\u201D\u201F]/g, '"')
    // 5. Dash variants.
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    // 6. Words broken across lines.
    .replace(/-\n\s*/g, "")
    // 7. Runs of two or more hyphens.
    .replace(/-{2,}/g, "-")
    // 8. Emphasis and code markers.
    .replace(/[*_`]/g, "")
    // 9. Dash spacing.
    .replace(/\s*-\s*/g, "-")
    // 10. Whitespace runs, then trim.
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

/**
 * `ERF-47`, the claim half. The requirement names three things whose
 * staleness is computed and only the atom's finding audit was covered, so a
 * stale backing audit read as current.
 */
export function staleEvidenceAudit(claim: Claim): boolean {
  const changed = claim.last_modified?.timestamp;
  const audits = claim.evidence_audit ?? [];
  if (!changed || audits.length === 0) return false;
  return audits.some((a) => String(a.timestamp) < String(changed));
}

export type BindingStaleness = "current" | "stale" | "indeterminate";

/**
 * `ERF-32`. A binding is stale when the claim it names was modified after
 * the binding was made. Without `bound-at` the answer is `indeterminate`,
 * which the requirement demands explicitly: a validator that cannot tell
 * must say so rather than reassure. Every legacy binding is in that state.
 */
export function bindingStaleness(
  boundAt: string | undefined,
  claimIds: string[],
  c: LoadedCorpus,
): { state: BindingStaleness; why: string } {
  if (!boundAt) {
    return {
      state: "indeterminate",
      why: "the binding records no bound-at date, so whether the claim moved under it cannot be determined",
    };
  }
  const moved = claimIds.filter((id) => {
    const m = c.claims.get(id)?.last_modified?.timestamp;
    return m !== undefined && String(m) > String(boundAt);
  });
  return moved.length
    ? { state: "stale", why: `changed after this passage was bound to it: ${moved.join(", ")}` }
    : { state: "current", why: `no claim here has changed since ${boundAt}` };
}

/**
 * `ERF-44`: the pair is stored once, on either side, so a claim's conflicts
 * are its own outbound edges plus the inbound ones other claims declare. A
 * consumer reading only outbound edges shows an incomplete conflict set,
 * which is what this viewer did.
 */
export function conflictsFor(claimId: string, c: LoadedCorpus): string[] {
  const out = new Set<string>();
  for (const e of c.claims.get(claimId)?.edges ?? []) {
    if (e.relation === "conflicts-with") out.add(e.to);
  }
  for (const [id, cl] of c.claims) {
    if (id === claimId) continue;
    for (const e of cl.edges) {
      if (e.relation === "conflicts-with" && e.to === claimId) out.add(id);
    }
  }
  return [...out];
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
