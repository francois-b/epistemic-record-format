/**
 * The Epistemic Record Format (ERF): normative data model.
 * v1.0-draft-2, 2026-08-22.
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

/** Registry prefix plus sequence, e.g. "kwg-117". Never renamed, never reused. */
export type AtomId = string;

/** Globally unique slug across ALL corpora; encodes no location (ERF-4.11). */
export type ClaimId = string;

/** Same global namespace as ClaimId (ERF-6.2). */
export type QuestionId = string;

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
export type Relation       = "supports" | "assumes" | "decomposes-into" | "conflicts-with";
/** Grades the source situation only (ERF-4.8a). Value vocabulary under review. */
export type SourceQuality  = "high" | "medium" | "low";
/** Typed reasons for negative standing moves (ERF-4.14c). Provisional. */
export type StanceCause    = "superseded-by" | "disconfirmed" | "scope-too-broad"
                           | "absorbed-into" | "no-longer-relevant" | "source-unreliable";

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
  /** Negative moves (`against`, `withdrawn`) only (ERF-4.14c). */
  cause?: StanceCause;
  /** What the ruler faced at ruling time, by id (ERF-4.14a). */
  evidence_at_stance?: {
    atoms_for: AtomId[];
    atoms_against: AtomId[];
  };
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
  /** Registry prefix + number, e.g. kwg-117. */
  id: AtomId;
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
  as_of?: string;
  /** Recorded caveat about the evidence. */
  limitations?: string;
  created: ActorStamp;
  modified?: ActorStamp;
  /** Judgment verdicts, recorded per auditor (ERF-4.9). */
  finding_audit: AuditEntry[];
}

/** A statement that can be true or false, one a person could stand behind
 *  or dispute (section 4.3). */
export interface Claim {
  /** Globally unique across ALL corpora (ERF-4.11). */
  id: ClaimId;
  type: "claim";
  /** Ownership; mutable where identity is not (ERF-4.12). */
  corpus: CorpusId;
  /** THE claim statement (normative, ERF-4.13). */
  title: string;
  epistemic_kind: EpistemicKind;
  created: ActorStamp;
  modified?: ActorStamp;
  /** Compact spoken name. */
  handle?: string;
  /** Recorded membership for exact pulls. */
  families: FamilyName[];
  atoms_for: AtomId[];
  atoms_against: AtomId[];
  /** Typed relations to other claims (section 5, ERF-6.6). */
  edges: { to: ClaimId; relation: Relation }[];
  /** Append-only; per-person; humans only (ERF-4.14, ERF-4.15). */
  standings: StandingEntry[];
  /** Does the backing carry the claim (section 4.4). */
  backing_audit: AuditEntry[];
  /** Pre-authored evidence-search key (SPEC.md section 3.1). */
  semantic_query?: string;
  /** SHOULD open by restating title; then working notes. */
  body: string;
}

/** A question asserts nothing; it is a sibling record, not a claim
 *  (section 4.5). */
export interface Question {
  /** Same global namespace as claims (ERF-6.2). */
  id: QuestionId;
  type: "question";
  corpus: CorpusId;
  title: string;
  status: QuestionStatus;
  created: ActorStamp;
  modified?: ActorStamp;
  families: FamilyName[];
  /** The only structure a question carries (ERF-4.22). */
  sub_questions: QuestionId[];
  /** Written when status becomes answered (ERF-4.23). */
  answered_by: ClaimId[];
  body: string;
}

// Lists are total in the type and MAY be empty; empty lists are omitted in
// serialization (SPEC.md section 7). Optional fields (`?`) assert existence
// when present: a `citation` means structure exists, a `fetched_url` means
// a fetch happened, a `modified` means an edit happened.
