/**
 * The Epistemic Record Format (ERF): normative data model.
 * v0.9.0, 2026-08-25. Draft; not yet published.
 *
 * This file is the normative data model of the specification (SPEC.md,
 * section 3, which carries an inline mirror of it; where the two differ,
 * this file governs).
 *
 * Field names are snake_case in these interfaces, a stated deviation from
 * TypeScript idiom (SPEC.md section 3.2): serialization fidelity outranks
 * style, and every example stays copy-pasteable between the spec and a
 * file. Object-shape unions are deliberately absent; the only unions are
 * string-literal value sets.
 */

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/** Corpus prefix plus sequence, e.g. "kwg-117". Never renamed, never reused. */
export type AtomId = string;

/** Unique across the deployment's corpora; encodes no location (ERF-36). */
export type ClaimId = string;

/** Same deployment namespace; slug SHOULD end with the conducted date (ERF-28). */
export type SurveyId = string;

/** A corpus id, per the corpus declaration (ERF-59). */
export type CorpusId = string;

/** A recorded topic-family name. */
export type FamilyName = string;

/**
 * A CSL-JSON bibliographic item (citationstyles.org). Deliberately open
 * here: CSL-JSON's own schema governs its shape.
 */
export type CSL = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Actors and value sets
// ---------------------------------------------------------------------------

/**
 * `human:<id>` for a person, `<producer>/<version>` for a model or agent,
 * `process:<id>` for automation (SPEC.md section 2). Writing and
 * confirming are separate acts recorded in separate fields.
 */
export type Actor = `human:${string}` | `${string}/${string}` | `process:${string}`;

export type EpistemicKind  = "observation" | "argument" | "bet" | "commitment";
export type Stance         = "for" | "against" | "withdrawn";
/** Claim-to-claim only; `edges` carries no other record type. */
export type Relation       = "supports" | "assumes" | "decomposes-into"
                           | "conflicts-with";
/** How much weight the attester's word carries for the fact the finding
 *  conveys; two inputs, the weaker governing (ERF-9, ERF-10). */
export type SourceQuality  = "high" | "medium" | "low";

// ---------------------------------------------------------------------------
// Entries (lines within a record; the -Entry suffix marks them)
// ---------------------------------------------------------------------------

/** When, and which actor. Timestamps are RFC 3339. */
export interface ActorStamp {
  timestamp: string;
  by: Actor;
}

/** One line of the append-only doxastic ledger (ERF-19, ERF-21). */
export interface StandingEntry {
  /** A full RFC 3339 instant with time and offset, never a bare date
   *  (ERF-19). This is the only ordered ledger in the format, so it is
   *  the only place precision is mandatory. */
  timestamp: string;
  stance: Stance;
  /** Only people take stances (ERF-21). */
  by: `human:${string}`;
  /** Required; an entry without a reason is a toggle, not a judgment. */
  why: string;
  /** What the ruler faced at ruling time, by id (ERF-20). */
  evidence_at_stance?: {
    atoms_for: AtomId[];
    atoms_against: AtomId[];
  };
}

/** One search act within a survey (ERF-26, ERF-27). Named for what a
 *  line of `searches` records: an act, conducted once. */
export interface SearchAct {
  /** The concrete instrument, named: which search engine, which database,
   *  which index, which script. Never a category. */
  tool: string;
  /** In the tool's own terms; for a manual review, the universe inspected. */
  query: string;
  /** Restriction where one applied: site filter, date range, corpus slice,
   *  inspection depth. */
  scope?: string;
  /** Yield as the instrument reported it; text, because reported precision
   *  varies by instrument (ERF-27). */
  hits_reported: string;
  /** When this act ran, for a survey spanning sittings; defaults to the
   *  survey's `conducted` timestamp. */
  timestamp?: string;
}

/** One recorded audit judgment (ERF-11, section 4.4). */
export interface AuditEntry {
  /** A bare model or tool identifier, read together with `protocol`.
   *  Deliberately not an `Actor`: an audit entry names the instrument
   *  that rendered a verdict, not a role in the practice (ERF-11). */
  auditor: string;
  verdict: "SUPPORTED" | "PARTIAL" | "UNSUPPORTED";
  timestamp: string;
  /** The versioned procedure that produced the verdict; verdicts under
   *  different protocols are not comparable. */
  protocol: string;
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

/** One piece of evidence: a verbatim quote, a finding, and the trail. */
export interface Atom {
  /** Corpus prefix + number, e.g. kwg-117. */
  id: AtomId;
  type: "atom";
  /** The corpus this record belongs to (ERF-54). */
  corpus: CorpusId;
  /** One sentence: what the quote shows; audited per ERF-11. */
  finding: string;
  /** Verbatim from the normalized text; `[...]` marks elision (ERF-6). */
  quote: string;
  /** The source quoted, named in the corpus's source list (ERF-4). */
  source: SourceId;
  source_quality: SourceQuality;
  /** The date the FACT is true of, distinct from when the atom recorded
   *  it. A year, a year and month, or a full date; never more precise than
   *  the source (ERF-14). A period figure carries the period's end; a
   *  statement about the future carries the date it was made. */
  as_of_date?: string;
  /** Recorded caveat about the evidence. The atom alone carries this:
   *  a record with a body puts its caveats there, and the atom has
   *  none, so this is its only prose. */
  limitations?: string;
  created: ActorStamp;
  last_modified?: ActorStamp;
  /** Judgment verdicts, recorded per auditor (ERF-11). */
  finding_audit: AuditEntry[];
}

/** A statement that can be true or false, one a person could stand behind
 *  or dispute (section 4.3). */
export interface Claim {
  /** Unique across the deployment's corpora (ERF-36). */
  id: ClaimId;
  type: "claim";
  /** The corpus this record belongs to; mutable where identity is not (ERF-17). */
  corpus: CorpusId;
  /** THE claim statement (normative, ERF-18). */
  title: string;
  epistemic_kind: EpistemicKind;
  created: ActorStamp;
  last_modified?: ActorStamp;
  /** Compact spoken name. */
  short_name?: string;
  /** Recorded membership for exact pulls. */
  families: FamilyName[];
  atoms_for: AtomId[];
  atoms_against: AtomId[];
  /** Absence/coverage backing (section 4.5): one list, no against side.
   *  Absence is evidenced by surveys; presence by atoms. */
  surveys?: SurveyId[];
  /** Typed relations to other claims, claim-to-claim only
   *  (section 5, ERF-43, ERF-44). */
  edges: { to: ClaimId; relation: Relation }[];
  /** Append-only; per-person; humans only (ERF-19, ERF-21). */
  standings: StandingEntry[];
  /** Does the evidence carry the claim (section 4.4). */
  evidence_audit: AuditEntry[];
  /** Pre-authored evidence-search key (SPEC.md section 3.1). */
  semantic_query?: string;
  /** SHOULD open by restating title; then working notes. */
  body: string;
}

/** A record of search acts and their yield (section 4.5). Neutral as to
 *  polarity: the same record backs an absence, sparseness, or density
 *  reading; the citing claim decides the use. */
export interface Survey {
  /** Unique in the deployment; SHOULD end with the conducted date (ERF-28). */
  id: SurveyId;
  type: "survey";
  corpus: CorpusId;
  /** What the survey sought, stated as one phrase or question. */
  title: string;
  /** When, and which actor, conducted the search. Machine actors are legal
   *  here: searching is machine work; judgment stays on the citing claim. */
  conducted: ActorStamp;
  /** The acts, one or more, each self-contained (ERF-26). */
  searches: SearchAct[];
  /** The curated subset worth recording; entries mint atoms when a hit
   *  deserves quoting (ERF-27). */
  notable_results: { what: string; note: string; atoms?: AtomId[] }[];
  /** The predecessor record when the same sought is searched again. */
  prior_survey?: SurveyId;
  /** Record-keeping edits only (a transfer, a body note, an atom link
   *  landing in `notable_results`); the conducted acts never change
   *  (ERF-28, ERF-48). */
  last_modified?: ActorStamp;
  /** The search narrated: method, yield, and reading. */
  body: string;
}

// ---------------------------------------------------------------------------
// Beside the records, a corpus has structure of its own: its declaration
// and its sources (ERF-3, ERF-4, ERF-5, ERF-59). Neither is a record.
// ---------------------------------------------------------------------------

/** The corpus declaration (ERF-59). */
export interface CorpusDeclaration {
  /** How a consumer finds this file: discovery is by content, never by
   *  filename or directory (ERF-54). */
  type: "corpus";
  id: CorpusId;
  title: string;
  /** SemVer (ERF-61). */
  spec_version: string;
  /** Opaque label; the format records it and does not read it (ERF-59). */
  classification?: string;
  owner?: Actor;
}

/** A source's id: its key in the corpus's source list (ERF-3). */
export type SourceId = string;

export interface SourceList {
  /** How a consumer finds this file (ERF-54). */
  type: "sources";
  sources: Record<SourceId, Source>;
}

export interface Source {
  /** Identifies the work; never contains a URL (ERF-7). */
  citation_text: string;
  /** Canonical when present; `citation_text` renders from it (ERF-8). */
  citation?: CSL;
  /** The raw file, as it arrived (ERF-2). */
  received?: Received;
  status:
    | "shipped"                 // ships under a licence that permits it (ERF-68)
    | "shipped-as-quotation"    // ships as a short quotation, under no licence (ERF-68, ERF-69)
    | "not-redistributable"     // copyright forbids republication (ERF-5)
    | "access-restricted"       // an access agreement forbids extraction (ERF-5)
    | "licence-unverified";     // rights could not be established (ERF-5)
  /** The text quotes are checked against: the pipeline's output, relative
   *  to the source list (ERF-1). */
  normalized?: string;
  /** "sha256:<hex>" of that file, so a reader can confirm the bytes the
   *  checks ran against (ERF-71). */
  normalized_digest?: string;
  /** REQUIRED when no normalized text ships (ERF-5). */
  reason?: string;
  /** SPDX identifier where one applies (ERF-68). */
  licence?: string;
  /** The licence's plain name, since an identifier does not explain itself. */
  licence_name?: string;
  /** Present when the normalized text is a passage rather than the whole
   *  work: who selected it and when (ERF-69). Selection is the one step of
   *  the pipeline no tool can be named for, so it is attributed. */
  excerpt?: Excerpt;
  /** The tool that produced markdown from the raw file, named with its exact
   *  version ("pymupdf4llm 0.3.4"). MUST be deterministic (ERF-70). */
  extraction?: string;
  /** The tool that normalized that markdown, named with its exact version
   *  ("pandoc 3.1.11 --wrap=none"). MUST be deterministic (ERF-70). */
  normalization?: string;
}

export interface Received {
  /** Where it came from, when it came from the web. */
  url?: string;
  /** Where the corpus holds it, when the corpus holds it. A published cut
   *  drops this and keeps `url` and `digest` (ERF-2). */
  path?: string;
  /** "sha256:<hex>", when the location serves stable bytes (ERF-71). */
  digest?: string;
  /** The date it arrived. REQUIRED when the location is mutable (ERF-2). */
  on?: string;
}

export interface Excerpt {
  /** Who selected the passage. An LLM may; it is recorded like any actor. */
  by: Actor;
  on: string;
}

// This file describes a record IN MEMORY. The serialization rules describe
// the file, and the two differ on purpose.
//
// List-typed fields are required here because a loaded record always has
// them. In a file they are omitted when empty (ERF-55), and a reader
// materializes an omitted list as an empty one (ERF-56). An omitted list
// means none, never unknown. This includes `finding_audit`: an atom nobody
// has audited yet is a complete record whose audit list is empty, not a
// malformed one.
//
// Optional fields (`?`) are different in kind. They assert existence when
// present: a `citation` means structure exists, a `fetched` means a
// fetch happened, a `last_modified` means an edit happened.
