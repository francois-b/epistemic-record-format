/**
 * The computed readings, implemented from the specification text rather than
 * from any existing tooling. Nothing here is ever stored: every function is a
 * projection over records the corpus already holds.
 */
import type { Atom, Claim, StandingEntry } from "../types/erf.ts";
import * as commonmark from "commonmark";
import type { ConformanceFinding, LoadedCorpus } from "./corpus.ts";
import { bindingCandidates, shipsWithCorpus } from "./corpus.ts";

export type Disposition =
  | "proposal" | "active" | "contested" | "rejected" | "retired";

/** Each person's newest stance, which is what `ERF-41` reads. */
/**
 * A standing's timestamp as a comparable instant.
 *
 * YAML coerces an unquoted timestamp into a Date, so the value arriving here
 * is a Date rather than the string the file shows. Comparing with `String`
 * therefore compared JS date strings, which sort alphabetically by weekday
 * name: "Fri" before "Mon" before "Sat". Newest-stance selection, and with it
 * every computed disposition, turned on the day of the week. `ERF-19` demands
 * that same-day entries order, and only a parsed instant delivers that.
 */
function instant(v: unknown): number {
  if (v instanceof Date) return v.getTime();
  const n = Date.parse(String(v));
  return Number.isNaN(n) ? 0 : n;
}

/** `ERF-41`'s vocabulary. A stance outside it is left out of the computation. */
const STANCES = new Set(["for", "against", "withdrawn"]);
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * `ERF-41`: a standing is admitted to the computation only when its stance
 * is in the vocabulary, its timestamp is an instant (`ERF-19`) and its `by`
 * is a `human:` actor (`ERF-21`). A malformed entry is a producer error the
 * loader reports; here it is as though it had never been written, so the
 * person's previous admissible entry stays their newest (F-011, F-016).
 */
export function admissible(s: StandingEntry): boolean {
  return STANCES.has(String(s.stance)) && INSTANT.test(String(s.timestamp)) && String(s.by).startsWith("human:");
}

export function currentStances(standings: StandingEntry[]): StandingEntry[] {
  const newest = new Map<string, StandingEntry>();
  for (const s of standings) {
    if (!admissible(s)) continue;
    const prev = newest.get(s.by);
    // A later entry at the same instant is current: `standings` is an
    // ordered ledger in the model (`ERF-40`), so "later in the list" is a
    // fact about the model and not about bytes. `standingTies` flags it.
    if (!prev || instant(s.timestamp) >= instant(prev.timestamp)) newest.set(s.by, s);
  }
  return [...newest.values()];
}

/** `ERF-41`: two entries by one person at one instant. Flagged; the later in the ledger is current. */
export function standingTies(c: LoadedCorpus): string[] {
  const out: string[] = [];
  for (const [id, cl] of c.claims) {
    const seen = new Map<string, number>();
    for (const s of cl.standings ?? []) {
      if (!admissible(s)) continue;
      const k = `${s.by} at ${s.timestamp}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    for (const [k, n] of seen) if (n > 1) out.push(`${id}: ${n} entries by ${k}; the later in the ledger is current`);
  }
  return out;
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
  const src = c.sources.get(c.atoms.get(atomId)?.source ?? "");
  // `ERF-4` exists so these are distinguishable. An atom naming no listed
  // source is a defect in the corpus; a source with a recorded absence is a
  // corpus saying, deliberately, that this capture could not travel.
  // Reporting both as "no capture recorded" collapses the distinction the
  // rule is for.
  if (!src) return { ok: false, why: "the atom names no source the source list holds, which is a defect in the corpus rather than a statement about this atom (ERF-4)" };
  // Held is what decides whether backing can be opened; the status decides
  // what may TRAVEL. A local working corpus legitimately holds a capture for
  // a source it may never redistribute, and ERF-50 makes the check
  // re-runnable by anyone holding the captures, saying nothing about
  // shipping. (The earlier gate on shipping status silently skipped checks a
  // holder was entitled to run; found by the v0.9 stress battery, lane 4.)
  if (src.normalized) return { ok: true, why: "the source's normalized text is held with the corpus" };
  return { ok: false, why: src.reason ?? `no normalized text is held; status: ${src.status}` };
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
  // 1. CommonMark to plain text (ERF-51 step 1): what a reader saw. Leaf
  //    blocks are separated by U+2029 so a span cannot be spliced across
  //    two of them.
  const blocks = commonmarkBlocks(s);
  return blocks
    .map((b) => b
      // 2. NFC, then every Default_Ignorable code point goes: soft hyphens,
      //    zero-width spaces, joiners, the BOM.
      .normalize("NFC")
      .replace(/\p{Default_Ignorable_Code_Point}/gu, "")
      // 3. White_Space runs to one space, then trim. U+2029 is kept as the
      //    block separator, so a folded text folds to itself.
      .replace(/[^\S\u2029]+/gu, " ")
      .replace(/\s*\u2029\s*/gu, "\u2029")
      .trim())
    .filter((b) => b.length > 0)
    .join("\u2029");
}

/**
 * CommonMark rendered to plain text, one string per leaf block, using the
 * reference parser. Text and code nodes contribute their literal content, a
 * link its text, an image its description, raw HTML nothing, and a soft or
 * hard line break one space (ERF-51 step 1).
 */
function commonmarkBlocks(md: string): string[] {
  const out: string[] = [];
  const inline = (n: commonmark.Node): string => {
    let t = "";
    for (let ch = n.firstChild; ch; ch = ch.next) {
      switch (ch.type) {
        case "text": case "code": t += ch.literal ?? ""; break;
        case "softbreak": case "linebreak": t += " "; break;
        case "html_inline": break;
        default: t += inline(ch);
      }
    }
    return t;
  };
  const walk = (n: commonmark.Node): void => {
    for (let ch = n.firstChild; ch; ch = ch.next) {
      switch (ch.type) {
        case "paragraph": case "heading": out.push(inline(ch)); break;
        case "code_block": out.push(ch.literal ?? ""); break;
        case "html_block": case "thematic_break": break;
        default: walk(ch); // block_quote, list, item, document
      }
    }
  };
  walk(new commonmark.Parser().parse(md));
  return out;
}

/**
 * `ERF-52`: word boundaries under UAX #29's default rules, via the runtime's
 * segmenter, with the format's one stated departure: a hyphen between two
 * letters or digits does not break a word, so `binding` does not begin a
 * word inside `non-binding`. Boundaries are cached per text.
 */
const segmenter = new Intl.Segmenter("en", { granularity: "word" });
const boundaryCache = new Map<string, Set<number>>();
function wordBoundaries(hay: string): Set<number> {
  const hit = boundaryCache.get(hay); if (hit) return hit;
  const segs = [...segmenter.segment(hay)];
  const b = new Set<number>([0, hay.length]);
  for (const sg of segs) b.add(sg.index);
  for (let i = 1; i + 1 < segs.length; i++) {
    const sg = segs[i]!;
    if (/^[-‐‑]$/.test(sg.segment) && segs[i - 1]!.isWordLike && segs[i + 1]!.isWordLike) {
      b.delete(sg.index); b.delete(sg.index + 1);
    }
  }
  if (boundaryCache.size > 512) boundaryCache.clear();
  boundaryCache.set(hay, b);
  return b;
}

export type QuoteCheck = { state: "pass" | "fail" | "uncheckable"; detail: string };

export function quoteCheck(atom: Atom, captureText: string | null): QuoteCheck {
  if (captureText === null) {
    return { state: "uncheckable", detail: "the source's normalized text is not held here, so the check cannot run" };
  }
  const hay = normalizeForCheck(captureText);
  // `ERF-52`: only [...] elides. Bare ... and … are literal source text.
  const parts = atom.quote.split("[...]").map(normalizeForCheck).filter(Boolean);
  if (parts.length === 0) {
    return { state: "fail", detail: "the quote is nothing but elisions, so it checks nothing" };
  }
  let cursor = 0;
  for (const [i, p] of parts.entries()) {
    const at = findWholeWords(hay, p, cursor);
    if (at < 0) {
      const shown = p.length > 80 ? `${p.slice(0, 77)}...` : p;
      return { state: "fail", detail: `segment ${i + 1} of ${parts.length} does not occur in the source's normalized text as whole words${cursor ? " after the previous segment" : ""}: "${shown}"` };
    }
    cursor = at + p.length;
  }
  return { state: "pass", detail: "the normalized quote occurs in the source's normalized text" };
}

export function findWholeWords(hay: string, needle: string, from: number): number {
  const b = wordBoundaries(hay);
  let at = hay.indexOf(needle, from);
  while (at >= 0) {
    if (b.has(at) && b.has(at + needle.length)) return at;
    at = hay.indexOf(needle, at + 1);
  }
  return -1;
}

/**
 * `ERF-47`'s ordering, precision included: is `judged` stale against
 * `changed`? An earlier day is stale outright. Within one day, equal
 * precision reads as current (the re-audit that follows an edit lands on
 * the same day), while mixed precision cannot be ordered and resolves to
 * stale: a check that cannot tell says look, never rest.
 */
export function staleAgainst(judged: unknown, changed: unknown): boolean {
  const j = String(judged ?? "");
  const c = String(changed ?? "");
  const jDay = j.slice(0, 10);
  const cDay = c.slice(0, 10);
  if (jDay !== cDay) return jDay < cDay;
  const jFull = j.length > 10;
  const cFull = c.length > 10;
  if (jFull && cFull) return instant(judged) < instant(changed);
  return jFull !== cFull; // mixed precision on one day: unorderable, so stale
}

/** `ERF-47`: a verdict older than the last change to what it judged. */
export function staleAudits(atom: Atom): boolean {
  const changed = atom.last_modified?.timestamp;
  if (!changed || atom.finding_audit.length === 0) return false;
  return atom.finding_audit.some((a) => staleAgainst(a.timestamp, changed));
}

/**
 * `ERF-47`, the claim half. The requirement names three things whose
 * staleness is computed and only the atom's finding audit was covered, so a
 * stale backing audit read as current.
 */
export function staleEvidenceAudit(claim: Claim, c?: { atoms: Map<string, unknown> }): boolean {
  const audits = claim.evidence_audit ?? [];
  if (audits.length === 0) return false;
  // What an evidence audit judged (`ERF-47`, F-030): the claim and the atoms
  // attached to it. An atom edited or attached after the audit is a change
  // the audit never saw.
  const changes: unknown[] = [claim.last_modified?.timestamp];
  for (const id of [...(claim.atoms_for ?? []), ...(claim.atoms_against ?? [])]) {
    const at = c?.atoms.get(id) as { created?: { timestamp?: unknown }; last_modified?: { timestamp?: unknown } } | undefined;
    if (at) changes.push(at.last_modified?.timestamp ?? at.created?.timestamp);
  }
  return audits.some((a) => changes.some((ch) => ch !== undefined && staleAgainst(a.timestamp, ch)));
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
    return m !== undefined && staleAgainst(boundAt, m);
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

/**
 * `ERF-43`: an argument's premise closure, followed transitively through
 * its outgoing `assumes` edges and other claims' incoming `supports` edges
 * (`ERF-24`).
 *
 * The closure is what the edges REACH and never includes the argument
 * itself. Ruled 2026-08-25 (B-30): reading the root into its own closure
 * makes a premise-less argument a violation here and a flag under
 * section 2, unbacked, so the same record would be both conforming and not. Excluded,
 * it has an empty closure and satisfies this rule vacuously, and what is
 * wrong with it is that nothing backs it, which is section 2, unbacked's business.
 */
export function premiseClosure(root: Claim, c: LoadedCorpus): Set<string> {
  const seen = new Set<string>();
  const walk = (id: string): void => {
    const cl = c.claims.get(id);
    if (!cl) return;
    for (const e of cl.edges) {
      if (e.relation === "assumes" && !seen.has(e.to) && c.claims.has(e.to)) {
        seen.add(e.to); walk(e.to);
      }
    }
    for (const [other, ocl] of c.claims) {
      if (seen.has(other) || other === id) continue;
      if (ocl.edges.some((e) => e.relation === "supports" && e.to === id)) {
        seen.add(other); walk(other);
      }
    }
  };
  walk(root.id);
  seen.delete(root.id);
  return seen;
}

/**
 * `ERF-43`: the closure MUST terminate in non-argument leaves. A leaf is a
 * member of the closure that reaches no further premises; a leaf that is
 * itself an `argument` means the chain claims to be grounded and is not.
 *
 * The root is not its own leaf, so a premise-less argument does not appear
 * here. It appears in `unbacked` below, as a flag.
 */
export function argumentLeaves(root: Claim, c: LoadedCorpus): string[] {
  const out: string[] = [];
  for (const id of premiseClosure(root, c)) {
    const cl = c.claims.get(id);
    if (cl?.epistemic_kind !== "argument") continue;
    if (premiseClosure(cl, c).size === 0) out.push(id);
  }
  return out;
}

/**
 * `ERF-31`: an anchor MUST occur in its passage, folded under `ERF-51` on
 * both sides. Flagged rather than a violation, because an edit to the
 * prose is an act the format permits (section 2).
 *
 * The fold is what makes a hand-wrapped paragraph a non-issue: a newline
 * inside a sentence is a collapsed whitespace run, so an anchor that reads
 * as one phrase matches as one phrase. Ruled 2026-08-25 (B-34, B-35).
 */
export function brokenAnchors(c: LoadedCorpus): string[] {
  const out: string[] = [];
  for (const n of c.narratives) {
    // `ERF-31`: a binding's passage is the text from the end of the
    // previous binding's marker (or the start of the body) to the start of
    // its own marker. The whole body as the haystack made the check nearly
    // vacuous, since an anchor lifted from anywhere in a long document
    // matched (F-012, found by two cold implementations independently).
    // Markers inside the slice are stripped: a malformed candidate between
    // two bindings must not serve as the haystack for either.
    const ordered = [...n.bindings].sort((a, b) => a.index - b.index);
    const cands = bindingCandidates(n.body);
    let prevEnd = 0;
    for (const b of ordered) {
      // A malformed candidate inside the slice is blanked, never used as
      // haystack, and does not close a passage: only a binding does (F-016).
      let passage = n.body.slice(prevEnd, b.index);
      for (const c of cands) {
        if (c.index >= prevEnd && c.end <= b.index) {
          const s0 = c.index - prevEnd, e0 = c.end - prevEnd;
          passage = passage.slice(0, s0) + " ".repeat(e0 - s0) + passage.slice(e0);
        }
      }
      prevEnd = b.end;
      const hay = normalizeForCheck(passage);
      const needle = normalizeForCheck(b.anchor);
      // The anchor is a verbatim quotation of its passage and meets the
      // quote's test: the fold, and whole words.
      if (needle && findWholeWords(hay, needle, 0) < 0) {
        out.push(`${n.slug}: anchor "${b.anchor}" does not occur in its passage, the text `
          + `between the previous binding's marker and this one (claims ${b.claims.join(", ")})`);
      }
    }
  }
  return out;
}

/**
 * `ERF-2`: a source whose raw file is mutable at its location MUST record
 * `received.timestamp`. Whether a location is mutable is not decidable
 * from the corpus, so a URL with no timestamp is flagged rather than
 * failed: a reader cannot tell which version was read. Adopted from the
 * Rust validator's differential run.
 */
export function undatedRetrievals(c: LoadedCorpus): string[] {
  const out: string[] = [];
  for (const [id, src] of c.sources) {
    if (src.received?.url && !src.received.timestamp) out.push(`${id}: received.url with no received.timestamp; nothing says which version was read`);
  }
  return out;
}

/**
 * `ERF-43`: a validator MUST FLAG a closure terminating in a leaf whose
 * disposition is `retired`. A flag and not a violation, because a
 * withdrawal elsewhere creates the condition with no edit to the argument,
 * and an act the format permits cannot retroactively make a corpus
 * non-conforming (section 2).
 */
export function retiredPremises(c: LoadedCorpus): string[] {
  const out: string[] = [];
  for (const cl of c.claims.values()) {
    if (cl.epistemic_kind !== "argument") continue;
    for (const id of premiseClosure(cl, c)) {
      const prem = c.claims.get(id);
      if (prem && disposition(prem).disposition === "retired") {
        out.push(`${cl.id} rests on ${id}, whose holders have withdrawn`);
      }
    }
  }
  return out;
}

/** section 2, unbacked: the computed warning a render shows. An argument's premises
 *  arrive from both sides of the graph (`ERF-24`): its own outgoing
 *  `assumes` edges, and other claims' `supports` edges pointing at it, so
 *  both are consulted before calling it unbacked. */
export function unbacked(claim: Claim, c?: LoadedCorpus): boolean {
  // Fires whether or not anyone stands on the claim (ruled 2026-08-25,
  // F-020): a corpus built from its narrative down is proposals for most
  // of its life, and this is the list of the hollow ones. `stoodOn` says
  // which kind of unbacked a reader is looking at.
  const noEvidence = claim.atoms_for.length === 0 && (claim.surveys?.length ?? 0) === 0;
  if (claim.epistemic_kind === "observation") return noEvidence;
  if (claim.epistemic_kind === "argument") {
    // An argument carries atoms as well as premises; it is unbacked only
    // with neither.
    if (!noEvidence) return false;
    const assumes = claim.edges.some((e) => e.relation === "assumes");
    if (assumes) return false;
    if (!c) return claim.edges.length === 0;
    for (const [id, other] of c.claims) {
      if (id === claim.id) continue;
      if (other.edges.some((e) => e.relation === "supports" && e.to === claim.id)) return false;
    }
    return true;
  }
  return false;
}

/** Whether anyone currently stands on the claim; qualifies section 2, unbacked's flag. */
export function stoodOn(claim: Claim): boolean {
  return currentStances(claim.standings).length > 0;
}

/**
 * `ERF-35`: a reference asserting a CURRENT relationship MUST resolve.
 * References recording a PAST state are `evidenceRefsFlagged` below, and
 * are flags rather than violations.
 *
 * Returned in the `ConformanceFinding` shape so a validator can report a
 * dangling reference the same way it reports any other violation, and so
 * the conformance suite can assert the rule that fired.
 */
export function danglingRefs(c: LoadedCorpus): ConformanceFinding[] {
  const out: ConformanceFinding[] = [];
  const has = (id: string) => c.claims.has(id) || c.surveys.has(id);
  const miss = (record: string, field: string, what: string) =>
    out.push({ record, field, detail: `names ${what}, which the deployment does not hold (ERF-35)` });
  for (const [id, cl] of c.claims) {
    for (const a of cl.atoms_for) if (!c.atoms.has(a)) miss(id, "atoms_for", `atom ${a}`);
    for (const a of cl.atoms_against) if (!c.atoms.has(a)) miss(id, "atoms_against", `atom ${a}`);
    for (const e of cl.edges) if (!has(e.to)) miss(id, "edges", `claim ${e.to}`);
    for (const s of cl.surveys ?? []) if (!c.surveys.has(s)) miss(id, "surveys", `survey ${s}`);
  }
  for (const [id, s] of c.surveys) {
    for (const nr of s.notable_results) {
      for (const a of nr.atoms ?? []) if (!c.atoms.has(a)) miss(id, "notable_results", `atom ${a}`);
    }
    if (s.prior_survey && !c.surveys.has(s.prior_survey)) {
      miss(id, "prior_survey", `survey ${s.prior_survey}`);
    }
  }
  return out;
}

/**
 * `ERF-35`, the other half: an `evidence_at_stance` id that no longer
 * resolves is FLAGGED, never a violation. It records what a ruler faced at
 * the moment of ruling, and a corpus changing afterwards is an act the
 * format permits, so it cannot retroactively make the corpus
 * non-conforming. Same reasoning as `ERF-43`'s retired leaf.
 */
export function evidenceRefsFlagged(c: LoadedCorpus): string[] {
  const out: string[] = [];
  for (const [id, cl] of c.claims) {
    for (const st of cl.standings ?? []) {
      const ev = st.evidence_at_stance;
      if (!ev) continue;
      for (const a of [...(ev.atoms_for ?? []), ...(ev.atoms_against ?? [])]) {
        if (!c.atoms.has(a)) {
          out.push(`${id} standing ${st.timestamp} faced atom ${a}, which the corpus no longer holds`);
        }
      }
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
