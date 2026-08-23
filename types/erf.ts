/**
 * The Epistemic Record Format (ERF): normative data model.
 * v1.0.4, 2026-08-23.
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

/** Unique across the realm's corpora; encodes no location (ERF-4.11).
 *  Across realms, identity is the pair of realm and id. */
export type ClaimId = string;

/** Same realm namespace as ClaimId (ERF-6.2). */
export type QuestionId = string;

/** Same realm namespace; slug SHOULD end with the conducted date (ERF-4.29). */
export type SurveyId = string;

/** A registered corpus id, per the corpus registry (ERF-8.3). */
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
export type QuestionStatus = "open" | "answered" | "parked";
/** `bears-on` targets a question; every other relation targets a claim
 *  (ERF-6.7a). */
export type Relation       = "supports" | "assumes" | "decomposes-into"
                           | "conflicts-with" | "bears-on";
/** How much weight the attester's word carries for the fact the finding
 *  conveys; two inputs, the weaker governing (ERF-4.8a, ERF-4.8b). */
export type SourceQuality  = "high" | "medium" | "low";

// ---------------------------------------------------------------------------
// Entries (lines within a record; the -Entry suffix marks them)
// ---------------------------------------------------------------------------

/** When, and which actor. Timestamps are RFC 3339. */
export interface ActorStamp {
  timestamp: string;
  by: Actor;
}

/** One line of the append-only doxastic ledger (ERF-4.14, ERF-4.15). */
export interface StandingEntry {
  /** RFC 3339 with time of day; same-day entries must order. */
  timestamp: string;
  stance: Stance;
  /** Only people take stances (ERF-4.15). */
  by: `human:${string}`;
  /** Required; an entry without a reason is a toggle, not a judgment. */
  why: string;
  /** What the ruler faced at ruling time, by id (ERF-4.14a). */
  evidence_at_stance?: {
    atoms_for: AtomId[];
    atoms_against: AtomId[];
  };
}

/** One search act within a survey (ERF-4.27, ERF-4.28). Named for what a
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
   *  varies by instrument (ERF-4.28). */
  hits_reported: string;
  /** When this act ran, for a survey spanning sittings; defaults to the
   *  survey's `conducted` timestamp. */
  timestamp?: string;
}

/** One recorded audit judgment (ERF-4.9, section 4.4). */
export interface AuditEntry {
  /** The model that rendered the verdict; read together with `protocol`. */
  auditor: string;
  verdict: "SUPPORTED" | "PARTIAL" | "UNSUPPORTED";
  timestamp: string;
  /** The versioned procedure that produced the verdict; verdicts under
   *  different protocols are not comparable. */
  protocol: string;
  /** Operator ruling that a PARTIAL stands as recorded. */
  accepted?: true;
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

/** One piece of evidence: a verbatim quote, a finding, and the trail. */
export interface Atom {
  /** Corpus prefix + number, e.g. kwg-117. */
  id: AtomId;
  type: "atom";
  /** Confidentiality tier and governing policy (ERF-7.2). */
  corpus: CorpusId;
  /** One sentence: what the quote shows (ERF-4.6). */
  finding: string;
  /** Verbatim from the capture; `[...]` marks elision (ERF-4.5). */
  quote: string;
  /** Human-readable citation; never contains a URL (ERF-4.7). */
  citation_text: string;
  /** Canonical when present; `citation_text` renders from it (ERF-4.8). */
  citation?: CSL;
  /** The locator actually retrieved; absent for received files. */
  fetched_url?: string;
  source_quality: SourceQuality;
  /** The date the FACT is true of, distinct from when it was recorded. */
  as_of_date?: string;
  /** Recorded caveat about the evidence. */
  limitations?: string;
  created: ActorStamp;
  last_modified?: ActorStamp;
  /** Judgment verdicts, recorded per auditor (ERF-4.9). */
  finding_audit: AuditEntry[];
}

/** A statement that can be true or false, one a person could stand behind
 *  or dispute (section 4.3). */
export interface Claim {
  /** Unique across the realm's corpora (ERF-4.11). */
  id: ClaimId;
  type: "claim";
  /** Confidentiality tier and governing policy; mutable where identity is not (ERF-4.12). */
  corpus: CorpusId;
  /** THE claim statement (normative, ERF-4.13). */
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
  /** Absence/coverage backing (section 4.6): one list, no against side.
   *  Absence is evidenced by surveys; presence by atoms. */
  surveys?: SurveyId[];
  /** Typed relations to other claims (section 5, ERF-6.6). */
  edges: { to: ClaimId; relation: Relation }[];
  /** Append-only; per-person; humans only (ERF-4.14, ERF-4.15). */
  standings: StandingEntry[];
  /** Does the evidence carry the claim (section 4.4). */
  evidence_audit: AuditEntry[];
  /** Pre-authored evidence-search key (SPEC.md section 3.1). */
  semantic_query?: string;
  /** SHOULD open by restating title; then working notes. */
  body: string;
}

/** A question asserts nothing; it is a sibling record, not a claim
 *  (section 4.5). */
export interface Question {
  /** Same realm namespace as claims (ERF-6.2). */
  id: QuestionId;
  type: "question";
  corpus: CorpusId;
  title: string;
  status: QuestionStatus;
  created: ActorStamp;
  last_modified?: ActorStamp;
  families: FamilyName[];
  /** The only structure a question carries (ERF-4.22). */
  sub_questions: QuestionId[];
  /** Written when status becomes answered (ERF-4.23). */
  answered_by: ClaimId[];
  body: string;
}

/** A record of search acts and their yield (section 4.6). Neutral as to
 *  polarity: the same record backs an absence, sparseness, or density
 *  reading; the citing claim decides the use. */
export interface Survey {
  /** Unique in the realm; SHOULD end with the conducted date (ERF-4.29). */
  id: SurveyId;
  type: "survey";
  corpus: CorpusId;
  /** What the survey sought, stated as one phrase or question. */
  title: string;
  /** When, and which actor, conducted the search. Machine actors are legal
   *  here: searching is machine work; judgment stays on the citing claim. */
  conducted: ActorStamp;
  /** The acts, one or more, each self-contained (ERF-4.27). */
  searches: SearchAct[];
  /** The curated subset worth recording; entries mint atoms when a hit
   *  deserves quoting (ERF-4.28). */
  notable_results: { what: string; note: string; atoms?: AtomId[] }[];
  /** What the acts did not cover and how deeply hits were inspected;
   *  SHOULD when cited for absence or sparseness; correctly absent for a
   *  complete search of a closed corpus (ERF-4.30). */
  limitations?: string;
  /** The predecessor record when the same sought is searched again. */
  prior_survey?: SurveyId;
  /** The search narrated: method, yield, and reading. */
  body: string;
}

// This file describes a record IN MEMORY. The serialization rules describe
// the file, and the two differ on purpose.
//
// List-typed fields are required here because a loaded record always has
// them. In a file they are omitted when empty (ERF-7.4), and a reader
// materializes an omitted list as an empty one (ERF-7.4a). An omitted list
// means none, never unknown. This includes `finding_audit`: an atom nobody
// has audited yet is a complete record whose audit list is empty, not a
// malformed one.
//
// Optional fields (`?`) are different in kind. They assert existence when
// present: a `citation` means structure exists, a `fetched_url` means a
// fetch happened, a `last_modified` means an edit happened.
