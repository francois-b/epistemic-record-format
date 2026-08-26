/* GENERATED from schema/erf.schema.json by tools/generate-types.py. Do not edit:
 * change the schema and regenerate (the pre-commit hook does this when the
 * schema is staged; `npm run types` does it by hand). Not normative; the
 * schema is (SPEC.md section 3).
 *
 * One departure from the generator's output: the `x_` extension namespace
 * (ERF-72, `patternProperties: ^x_`) is dropped. TypeScript cannot hold an
 * index signature beside named fields of narrower types, and the loader
 * enforces ERF-72 against the schema itself with Ajv. */

/**
 * The normative data model (SPEC.md section 3, ERF-73): what every document a corpus holds looks like once loaded, with its body attached where the model has one. Every definition refuses fields the declared version does not define, outside the x_ namespace (ERF-72). Lists total in the model may be omitted on the wire when empty (ERF-56). The reason each definition takes its shape is written on the definition. Rules over more than one record, the quote check, and the obligations on acts are in SPEC.md and cannot be stated here.
 */
export type EpistemicRecordFormatDataModel = Atom | Claim | Survey | CorpusDeclaration | SourceList | Narrative;
/**
 * An atom's id: a mint-time prefix, a hyphen, and a sequence number, e.g. kwg-117; permanent, never renamed, never reused (ERF-13).
 */
export type AtomId = string;
/**
 * An identifier: one or more characters, none whitespace, '"', '<', '>' or '/'. A path separator is excluded because an id names a record and never where it lives (once ERF-15; the schema is the requirement, ERF-73). Deployment-unique across record types (ERF-36).
 */
export type Id = string;
/**
 * ERF-9, ERF-10.
 */
export type SourceQuality = "high" | "medium" | "low";
/**
 * A year, a year and month, or a full date; never more precise than the source gave (ERF-14).
 */
export type AsOfDate = string;
/**
 * A date where nothing is ordered, an instant where something is (ERF-19).
 */
export type DateOrInstant = Date | Instant;
/**
 * A calendar date, RFC 3339 full-date.
 */
export type Date = string;
/**
 * An RFC 3339 instant: date, time with seconds, and offset. Seconds are mandatory because RFC 3339 makes them so and because two stances on one instant are ordered by the ledger (ERF-41).
 */
export type Instant = string;
/**
 * Exactly one of the three forms; they are disjoint by construction (section 2).
 */
export type Actor = HumanActor | AgentActor | ProcessActor;
/**
 * A person. The id carries no '/', so it cannot also read as an agent id. A standing's `by` is this and nothing else.
 */
export type HumanActor = string;
/**
 * A model or agent, producer/version. The producer carries no ':', so it cannot also read as a human or process id.
 */
export type AgentActor = string;
/**
 * Automation.
 */
export type ProcessActor = string;
/**
 * Exactly three. A failed, unparseable or abandoned audit is never written as one: an audit that produced nothing did not happen (SPEC.md ERF-11).
 */
export type Verdict = "SUPPORTED" | "PARTIAL" | "UNSUPPORTED";
/**
 * What would check the claim (section 4.3).
 */
export type EpistemicKind = "observation" | "argument" | "bet" | "commitment";
/**
 * The four relations (ERF-24, ERF-43, ERF-44).
 */
export type Relation = "supports" | "assumes" | "decomposes-into" | "conflicts-with";
/**
 * ERF-41's vocabulary.
 */
export type Stance = "for" | "against" | "withdrawn";
/**
 * Semantic Versioning 2.0.0. What a MAJOR or MINOR increment means is stated under change control (once ERF-61).
 */
export type SemVer = string;
/**
 * sha256:<hex> (ERF-71).
 */
export type Digest = string;

/**
 * One piece of evidence (section 4.2).
 */
export interface Atom {
  id: AtomId;
  type: "atom";
  corpus: Id;
  finding: string;
  /**
   * Verbatim (ERF-6); checked, never trusted (ERF-50).
   */
  quote: string;
  source: Id;
  source_quality: SourceQuality;
  as_of_date?: AsOfDate;
  limitations?: string;
  created: ActorStamp;
  last_modified?: ActorStamp;
  /**
   * Total in the model; omitted on the wire when empty (ERF-55, ERF-56).
   */
  finding_audit?: AuditEntry[];
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `Atom`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * Who did it, and when. The event-time key is `timestamp` everywhere; an earlier `on` was retired because a YAML 1.1 reader resolves it to the boolean true.
 */
export interface ActorStamp {
  timestamp: DateOrInstant;
  by: Actor;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `ActorStamp`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * One recorded audit judgment (ERF-11, section 4.4).
 */
export interface AuditEntry {
  /**
   * The instrument, a bare identifier, never an Actor (ERF-11).
   */
  auditor: string;
  verdict: Verdict;
  timestamp: DateOrInstant;
  /**
   * The versioned procedure; verdicts under different protocols are not comparable.
   */
  protocol: string;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `AuditEntry`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * One statement a person could stand behind or dispute. It has no state field: its disposition is computed from its standings (ERF-41), a claim is born with no standing and is a proposal until someone takes one, and origin that carries evidential weight is a source to cite, not a status to store.
 */
export interface Claim {
  id: Id;
  type: "claim";
  corpus: Id;
  title: string;
  epistemic_kind: EpistemicKind;
  created: ActorStamp;
  last_modified?: ActorStamp;
  short_name?: string;
  families?: Id[];
  /**
   * Evidence for. Total in the model; omitted on the wire when empty (ERF-55, ERF-56).
   */
  atoms_for?: AtomId[];
  /**
   * Evidence against. Total in the model; omitted on the wire when empty (ERF-55, ERF-56).
   */
  atoms_against?: AtomId[];
  /**
   * Surveys backing the claim (ERF-25). Total in the model; omitted on the wire when empty (ERF-55, ERF-56).
   */
  surveys?: Id[];
  edges?: Edge[];
  /**
   * The ordered ledger (ERF-40).
   */
  standings?: StandingEntry[];
  evidence_audit?: AuditEntry[];
  semantic_query?: string;
  /**
   * The markdown body: the proposition, then working notes. Part of the model instance; on the wire it is the file body (ERF-53).
   */
  body: string;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `Claim`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
export interface Edge {
  to: Id;
  relation: Relation;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `Edge`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * One line of the append-only ledger (ERF-40). `timestamp` is a full instant with time and offset, never a bare date, because this is the format's only ordered ledger and a bare date and an instant on one day cannot be ordered; `by` is a person, because an LLM proposes and only a person takes a stance, and a stance speaks for one person, five endorsements being five entries; `why` is required, because an entry without a reason is a toggle and not a judgment.
 */
export interface StandingEntry {
  timestamp: Instant;
  stance: Stance;
  by: HumanActor;
  /**
   * Required; an entry without a reason is a toggle. Once ERF-39; the schema is the requirement (ERF-73).
   */
  why: string;
  evidence_at_stance?: EvidenceAtStance;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `StandingEntry`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * What the ruler faced at ruling time (ERF-20). Present and empty means stamped and faced nothing; absent means never stamped (ERF-56).
 */
export interface EvidenceAtStance {
  /**
   * Evidence for, as the ruler faced it. Total in the model; omitted on the wire when empty (ERF-56).
   */
  atoms_for?: AtomId[];
  /**
   * Evidence against, as the ruler faced it. Total in the model; omitted on the wire when empty (ERF-56).
   */
  atoms_against?: AtomId[];
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `EvidenceAtStance`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * A search act recorded as evidence of absence (section 4.5).
 */
export interface Survey {
  id: Id;
  type: "survey";
  corpus: Id;
  title: string;
  conducted: ActorStamp;
  /**
   * @minItems 1
   */
  searches: [SearchAct, ...SearchAct[]];
  notable_results?: NotableResult[];
  prior_survey?: Id;
  last_modified?: ActorStamp;
  /**
   * What was sought and what was found, in prose (ERF-28). Part of the model instance; on the wire it is the file body.
   */
  body: string;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `Survey`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * One search act (ERF-27).
 */
export interface SearchAct {
  /**
   * The concrete instrument, never a category (ERF-27; once ERF-26).
   */
  tool: string;
  query: string;
  scope?: string;
  /**
   * The yield as the instrument reported it; text (ERF-27).
   */
  hits_reported: string;
  timestamp?: DateOrInstant;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `SearchAct`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
export interface NotableResult {
  what: string;
  note: string;
  /**
   * Atoms minted from this result. Total in the model; omitted on the wire when empty (ERF-56).
   */
  atoms?: AtomId[];
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `NotableResult`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * Exactly one per corpus (ERF-54). `classification` is an opaque label this version records and does not read; what it means, and which corpora may cite or travel together, is deployment policy. The declaration declares no bars or gates.
 */
export interface CorpusDeclaration {
  type: "corpus";
  id: Id;
  title: string;
  spec_version: SemVer;
  /**
   * An opaque label this version records and does not read (ERF-59).
   */
  classification?: string;
  owner?: Actor;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `CorpusDeclaration`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * A corpus keeps a source list: one entry per work, keyed by a source id unique within the corpus. The top level is exactly `type` and `sources`. A source's citation, locator and normalized text live on the source and never on the atom; how the list is stored is the store's business and its interchange form the binding's.
 */
export interface SourceList {
  type: "sources";
  /**
   * Keyed by source id, unique within the corpus (ERF-3).
   */
  sources: {
    [k: string]: Source;
  };
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `SourceList`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * One work in the source list (ERF-2, ERF-6, ERF-8, ERF-68 to ERF-71).
 */
export interface Source {
  /**
   * Identifies the work and never carries a URL: a citation names a work, a locator names one copy, and that is `received.url`, the artifact retrieved rather than a page describing it. A web-native work's own identity may appear as `citation.URL`. A file received by hand has no locator and no `received`.
   */
  citation_text: string;
  citation?: CSL;
  received?: Received;
  /**
   * shipped: under a permitting licence. shipped-as-quotation: as a short quotation, under no licence. not-redistributable, access-restricted, licence-unverified: an absence, with `reason` required (the conditional below). Glosses in SPEC.md section 5.
   */
  status: "shipped" | "shipped-as-quotation" | "not-redistributable" | "access-restricted" | "licence-unverified";
  /**
   * Path of the normalized text, relative to the source list (ERF-1, ERF-35).
   */
  normalized?: string;
  normalized_digest?: Digest;
  /**
   * Why no normalized text is held (section 5, status vocabulary).
   */
  reason?: string;
  /**
   * SPDX identifier where one applies (ERF-68).
   */
  licence?: string;
  licence_name?: string;
  excerpt?: ActorStamp;
  /**
   * The deterministic extracting tool and exact version (ERF-70).
   */
  extraction?: string;
  /**
   * The deterministic normalizing tool and exact version (ERF-70).
   */
  normalization?: string;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `Source`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * A CSL-JSON item. Its fields are typed by CSL and preserved opaquely here (ERF-8).
 */
export interface CSL {
  [k: string]: unknown;
}
/**
 * The raw file, as it arrived (ERF-2).
 */
export interface Received {
  /**
   * Where it came from, when from the web; the artifact retrieved, not a landing page. Once ERF-7; the schema is the requirement (ERF-73).
   */
  url?: string;
  /**
   * Where the corpus holds the raw file, when it does (ERF-2).
   */
  path?: string;
  digest?: Digest;
  timestamp?: DateOrInstant;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `Received`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
/**
 * A document, not a record: prose someone wrote, with narrative bindings as its only structured content. It has no evidence, no standings and no disposition, because nothing about it is adjudicated; a person disputes the claims it binds, not the prose. `created` takes the stamp everything else takes because who wrote it is the fact a reader most wants.
 */
export interface Narrative {
  type: "narrative";
  title: string;
  corpus: Id;
  created: ActorStamp;
  /**
   * Prose, with narrative bindings as its only structured content (ERF-31).
   */
  body: string;
  /**
   * Extension field (ERF-72).
   *
   * This interface was referenced by `Narrative`'s JSON-Schema definition
   * via the `patternProperty` "^x_".
   */
}
