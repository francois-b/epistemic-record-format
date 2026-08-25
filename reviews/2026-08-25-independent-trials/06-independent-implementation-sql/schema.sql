-- ============================================================================
-- schema.sql -- the Epistemic Record Format (ERF v0.9 draft) as a relational
-- schema in SQLite.
--
-- Built cold from SPEC.md alone. Every table, column, CHECK, FK, index,
-- trigger and view below carries the requirement id it serves. Where the
-- specification does not answer a question the schema had to answer anyway,
-- the comment says INVENTED and the choice is logged in
-- relational-questions.md / friction-log.md.
--
-- Conventions in the comments:
--   [ERF-nn]   the requirement served
--   INVENTED   the spec does not decide this; the schema had to
--   CANNOT     the requirement is not expressible in a schema at all
--   PROJECTION derived data, recomputable, never truth [ERF-62]
--
-- Read order: scopes -> corpus structure -> records -> record subtypes ->
-- the lists -> the opaque sidecar -> interchange provenance -> triggers ->
-- validator views.
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================================
-- 1. SCOPES
-- ============================================================================

-- [ERF-35][ERF-36][ERF-37][ERF-38] All three uniqueness/resolution rules are
-- scoped to "the deployment": "the set of corpora read and cited together,
-- under one operator or organization" (section 2). The format gives a
-- deployment no id, no declaration, no record and no file. A relational
-- schema cannot have an unnamed scope: uniqueness is enforced by a key, and a
-- key needs columns. So the deployment is INVENTED here as a first-class row.
-- Every id-unique and every reference-resolves rule below hangs off it.
CREATE TABLE deployment (
  id    TEXT PRIMARY KEY,
  note  TEXT                       -- free text; the format defines nothing here
) STRICT;

-- [ERF-59] The corpus declaration. Not a record: no created stamp, no
-- standings, no disposition.
-- INVENTED: corpus ids are assumed unique within a deployment. The spec says
-- record ids are deployment-unique (ERF-36) and says nothing at all about
-- corpus ids; but records name their corpus by bare id (ERF-54), so the id
-- must resolve deployment-wide or `corpus:` is ambiguous.
CREATE TABLE corpus (
  deployment_id  TEXT NOT NULL REFERENCES deployment(id)
                   ON DELETE CASCADE ON UPDATE CASCADE,
  id             TEXT NOT NULL,
  title          TEXT NOT NULL,     -- [ERF-59] REQUIRED, "for a person"
  -- [ERF-61] SemVer 2.0.0. The CHECK covers MAJOR.MINOR.PATCH and an optional
  -- pre-release/build tail; it deliberately does not validate the tail's
  -- grammar (SemVer's tail rules are not expressible in GLOB).
  spec_version   TEXT NOT NULL
                   CHECK (spec_version GLOB '[0-9]*.[0-9]*.[0-9]*'),
  -- [ERF-59] "an opaque label this version records and does not read".
  -- Modelled as free TEXT precisely because a CHECK here would be reading it.
  classification TEXT,
  owner          TEXT CHECK (owner IS NULL OR erf_is_actor(owner)),
  PRIMARY KEY (deployment_id, id)
) STRICT;

-- ============================================================================
-- 2. THE SOURCE LIST  (section 4.1 -- not a record)
-- ============================================================================

-- [ERF-3] "one entry per work, ... keyed by a source id unique WITHIN the
-- corpus". Note the scope: source ids are corpus-scoped, record ids are
-- deployment-scoped. That asymmetry is the reason the primary key here is
-- three columns and the primary key of `record` is two.
CREATE TABLE corpus_source (
  deployment_id  TEXT NOT NULL,
  corpus_id      TEXT NOT NULL,
  id             TEXT NOT NULL,     -- the source key [ERF-3]

  -- [ERF-7] "citation_text MUST NOT contain a URL". Enforced as a state
  -- constraint: no scheme-ish substring. Deliberately crude -- a URL without
  -- a scheme ("archive.org/x") is not caught, and CANNOT be, without deciding
  -- what a URL is, which the spec does not.
  citation_text  TEXT NOT NULL
                   CHECK (citation_text NOT GLOB '*://*'
                          AND citation_text NOT GLOB '*www.*'),
  -- [ERF-8] CSL, canonical when present. Stored as a JSON blob: CSL-JSON is a
  -- normative external schema (References), and shredding it into tables
  -- would be implementing CSL, not ERF.
  citation_json  TEXT CHECK (citation_json IS NULL OR json_valid(citation_json)),

  -- [ERF-7] the artifact actually retrieved; absent for a received file.
  fetched_url    TEXT,
  -- [ERF-71] "sha256:<hex>", algorithm named.
  fetched_digest TEXT
                   CHECK (fetched_digest IS NULL
                          OR fetched_digest GLOB '[a-z0-9-]*:[0-9a-f]*'),

  -- [ERF-5][ERF-68] closed vocabulary.
  status         TEXT NOT NULL CHECK (status IN (
                     'shipped',                -- under a licence [ERF-68]
                     'shipped-as-quotation',   -- under none     [ERF-68][ERF-69]
                     'not-redistributable',    -- copyright      [ERF-5]
                     'access-restricted',      -- agreement      [ERF-5]
                     'licence-unverified')),   -- unestablished  [ERF-5]
  path           TEXT,               -- the capture, relative to the list
  reason         TEXT,               -- REQUIRED when no capture ships [ERF-5]
  licence        TEXT,               -- SPDX identifier [ERF-68]
  licence_name   TEXT,               -- plain name [ERF-68]
  excerpt        INTEGER CHECK (excerpt IS NULL OR excerpt IN (0,1)), -- [ERF-69]
  converter_tool TEXT,               -- [ERF-70] tool AND exact version
  converter_deterministic INTEGER
                   CHECK (converter_deterministic IS NULL
                          OR converter_deterministic IN (0,1)),

  PRIMARY KEY (deployment_id, corpus_id, id),
  FOREIGN KEY (deployment_id, corpus_id) REFERENCES corpus(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- [ERF-4][ERF-5] "Every source MUST either give its capture's path or
  -- record that no capture is held and why." The two shipping statuses owe a
  -- path; the three absence statuses owe a reason. This is the one place the
  -- spec's closed vocabulary and its conditional-requiredness line up exactly,
  -- so it is a clean CHECK.
  CHECK (
    (status IN ('shipped','shipped-as-quotation') AND path IS NOT NULL)
    OR
    (status IN ('not-redistributable','access-restricted','licence-unverified')
     AND reason IS NOT NULL AND length(trim(reason)) > 0)
  ),
  -- [ERF-70] a recorded converter must state determinism; the two fields are
  -- one fact and neither half is meaningful alone.
  CHECK ((converter_tool IS NULL AND converter_deterministic IS NULL)
      OR (converter_tool IS NOT NULL AND converter_deterministic IS NOT NULL)),
  -- [ERF-71] a digest describes a fetch; there is nothing for it to describe
  -- without one.
  CHECK (fetched_digest IS NULL OR fetched_url IS NOT NULL)
) STRICT;

-- CANNOT: [ERF-2] "a received file ... MUST be retained as received, and a
-- revision arriving later MUST be a new source, never an overwrite". Half of
-- this is a transition constraint (see trigger erf_source_received_immutable
-- below) and half is unenforceable: nothing in `Source` says whether a source
-- IS a received file. The only signal is the absence of `fetched`, and
-- ERF-7's "a received file has no retrieval locator" makes that inference
-- circular -- a fetched source whose author simply omitted the url is
-- indistinguishable from a received one.

-- ============================================================================
-- 3. THE RECORD SUPERTYPE
-- ============================================================================

-- [ERF-36] "Every record id MUST be unique across every corpus in the
-- deployment, REGARDLESS OF RECORD TYPE". That single sentence decides the
-- whole shape of this schema: there must be one table whose primary key is
-- (deployment, id) and into which all three record types funnel. Per-type
-- tables with per-type primary keys could not express it -- three separate
-- keys permit an atom and a claim to share an id.
--
-- [ERF-38] "A validator MUST reject a deployment containing duplicate record
-- ids" is therefore this primary key. See relational-questions.md Q9: making
-- the invariant a key means an invalid corpus cannot be *stored*, so the
-- database cannot hold the thing the validator is meant to report on.
CREATE TABLE record (
  deployment_id  TEXT NOT NULL,
  id             TEXT NOT NULL,

  -- [ERF-54] "Records MUST self-describe: type and corpus are written on
  -- every record of every type, and no meaning lives in a path."
  -- [ERF-57] deliberately NOT a CHECK against a closed set: a consumer "MUST
  -- preserve unknown fields and UNKNOWN RECORD TYPES as opaque data ... and
  -- MUST NOT reject a corpus solely because it contains them". A CHECK IN
  -- ('atom','claim','survey') here would make this schema a non-conforming
  -- consumer. See relational-questions.md Q3.
  type           TEXT NOT NULL CHECK (length(type) > 0),
  corpus_id      TEXT NOT NULL,

  -- created / last_modified. [ERF-47][ERF-48][ERF-58]
  -- INVENTED placement: `created` is a field of Atom and Claim but NOT of
  -- Survey -- a survey has `conducted` instead. ERF-48 nonetheless says any
  -- change "MUST set last_modified to a timestamp later than its created",
  -- which a survey has none of. So `created` is nullable here and required by
  -- type below; ERF-48's trigger falls back to `conducted` for surveys.
  created_timestamp      TEXT CHECK (created_timestamp IS NULL
                                     OR erf_is_timestamp(created_timestamp)),
  created_by             TEXT CHECK (created_by IS NULL OR erf_is_actor(created_by)),
  -- [ERF-48] "A record never edited since minting correctly carries no
  -- last_modified at all" -- hence nullable, and hence NOT defaulted.
  last_modified_timestamp TEXT CHECK (last_modified_timestamp IS NULL
                                      OR erf_is_timestamp(last_modified_timestamp)),
  last_modified_by        TEXT CHECK (last_modified_by IS NULL
                                      OR erf_is_actor(last_modified_by)),

  -- 1 when `type` is one of the three the format defines; 0 for a record this
  -- schema is holding opaquely under ERF-57.
  is_known       INTEGER NOT NULL CHECK (is_known IN (0,1)),

  PRIMARY KEY (deployment_id, id),
  FOREIGN KEY (deployment_id, corpus_id) REFERENCES corpus(deployment_id, id)
    -- ON DELETE RESTRICT: INVENTED. The format never mentions deleting
    -- anything (see relational-questions.md Q6). RESTRICT is the reading most
    -- faithful to a format whose ledgers are append-only: dropping a corpus
    -- must not silently take its records with it.
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CHECK (created_timestamp IS NULL OR created_by IS NOT NULL),
  CHECK (last_modified_timestamp IS NULL OR last_modified_by IS NOT NULL),
  -- [ERF-47][ERF-48] guards `atom`/`claim` only; a survey legitimately has no
  -- created (see above).
  CHECK (is_known = 0 OR type = 'survey' OR created_timestamp IS NOT NULL)
) STRICT;

-- The FK targets that let a subtype row inherit its record's corpus without
-- being free to disagree with it.
CREATE UNIQUE INDEX record_id_corpus_ux ON record(deployment_id, id, corpus_id);
CREATE UNIQUE INDEX record_id_type_ux   ON record(deployment_id, id, type);
CREATE INDEX record_corpus_ix           ON record(deployment_id, corpus_id);

-- ============================================================================
-- 4. RECORD SUBTYPES
-- ============================================================================

-- ---------------------------------------------------------------- 4.1 atom --
-- [ERF-13] an atom's id is "a mint-time prefix plus a sequence number
-- (kwg-117), never renamed and never reused". The GLOB enforces the shape.
-- "Never reused" is a constraint over the history of ids, not over the set of
-- live ones: see erf_id_never_reused / record_id_tombstone below.
CREATE TABLE atom (
  deployment_id  TEXT NOT NULL,
  id             TEXT NOT NULL,
  -- carried down from `record` so the source FK can be composite; the FK
  -- below makes disagreeing with `record.corpus_id` impossible.
  corpus_id      TEXT NOT NULL,

  finding        TEXT NOT NULL CHECK (length(trim(finding)) > 0),
  -- [ERF-6][ERF-52] verbatim; `[...]` is the only elision marker. Whether the
  -- quote actually occurs in the capture is ERF-50/51's mechanical check and
  -- MUST NOT be stored [ERF-11] -- so there is no column for it here, by
  -- design. The one thing a CHECK can say is ERF-52's "a quote whose spans
  -- are all empty MUST fail".
  quote          TEXT NOT NULL
                   CHECK (length(trim(replace(quote, '[...]', ''))) > 0),
  source_id      TEXT NOT NULL,                              -- [ERF-4]
  source_quality TEXT NOT NULL
                   CHECK (source_quality IN ('high','medium','low')), -- [ERF-9]
  -- [ERF-14] "the date the FACT is true of". A bare date, explicitly: ERF-19
  -- says "a bare date remains correct where nothing is ordered, as in an
  -- atom's as_of_date".
  as_of_date     TEXT CHECK (as_of_date IS NULL OR erf_is_date(as_of_date)),
  limitations    TEXT,                                       -- [ERF-14]

  PRIMARY KEY (deployment_id, id),
  FOREIGN KEY (deployment_id, id, corpus_id)
    REFERENCES record(deployment_id, id, corpus_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  -- [ERF-4] "the named id MUST exist in the corpus's source list". The FK is
  -- three-column because source ids are corpus-scoped [ERF-3]. Consequence
  -- the spec never states: an atom cannot change corpus unless the target
  -- corpus's source list already contains the same source id. See Q5.
  FOREIGN KEY (deployment_id, corpus_id, source_id)
    REFERENCES corpus_source(deployment_id, corpus_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (id GLOB '*-[0-9]*')                                 -- [ERF-13]
) STRICT;
-- NOTE the absence of a `body` column. Section 4.2 / ERF-53: "an atom's body
-- is empty, so its file is frontmatter and nothing else". The emptiness is
-- structural here rather than a CHECK on a column that should not exist.

-- --------------------------------------------------------------- 4.2 claim --
CREATE TABLE claim (
  deployment_id  TEXT NOT NULL,
  id             TEXT NOT NULL,
  -- [ERF-18] "title MUST state the claim; it is the normative statement."
  title          TEXT NOT NULL CHECK (length(trim(title)) > 0),
  -- [ERF-24][ERF-49] the kind is the backing contract.
  epistemic_kind TEXT NOT NULL CHECK (epistemic_kind IN
                   ('observation','argument','bet','commitment')),
  short_name     TEXT,                       -- guidance, 4.3
  semantic_query TEXT,                       -- guidance, 3.1/4.3; machine-read
  -- [ERF-18] the body carries the working notes and SHOULD open by restating
  -- the title. SHOULD, and "whether an opening in other words still states
  -- the same claim is a reading" -- so no CHECK. Reported as advice by the
  -- view v_erf18_restatement_advisory.
  body           TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (deployment_id, id),
  FOREIGN KEY (deployment_id, id) REFERENCES record(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;
-- NOTE the absence of a `disposition` / `state` / `status` column.
-- [ERF-22] "A claim MUST NOT store a state field: the disposition is computed
-- (ERF-41)." In a schema that prohibition is expressed by a column that does
-- not exist, plus the view v_claim_disposition below. It is the only MUST NOT
-- in the specification that a schema satisfies by omission.

-- -------------------------------------------------------------- 4.3 survey --
CREATE TABLE survey (
  deployment_id     TEXT NOT NULL,
  id                TEXT NOT NULL,
  title             TEXT NOT NULL CHECK (length(trim(title)) > 0), -- [ERF-28]
  -- [ERF-28] "conducted", machine actors legal. A bare date is legal here
  -- ("a bare date remains correct where nothing is ordered, as in ... a
  -- survey's conducted", ERF-19) even though staleness IS computed from it.
  conducted_timestamp TEXT NOT NULL CHECK (erf_is_timestamp(conducted_timestamp)),
  conducted_by        TEXT NOT NULL CHECK (erf_is_actor(conducted_by)),
  -- [ERF-28] re-run linkage. FK to survey, not to record: the field is typed
  -- SurveyId. Self-referential, so a survey chain is a linked list.
  prior_survey_id   TEXT,
  body              TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (deployment_id, id),
  FOREIGN KEY (deployment_id, id) REFERENCES record(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (deployment_id, prior_survey_id) REFERENCES survey(deployment_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (prior_survey_id IS NULL OR prior_survey_id <> id)   -- no self-predecessor
) STRICT;

-- --------------------------------------------- 4.4 unknown record types -----
-- [ERF-57] A consumer preserves unknown record types as opaque data. Their
-- fields land in record_extra_field; their body lands here.
CREATE TABLE opaque_record_body (
  deployment_id TEXT NOT NULL,
  id            TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (deployment_id, id),
  FOREIGN KEY (deployment_id, id) REFERENCES record(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

-- ============================================================================
-- 5. THE LISTS
--
-- Every list-typed field becomes a child table with an explicit `pos`.
-- INVENTED: the specification never says whether list order carries meaning.
-- It must be stored regardless, because ERF-53 demands a lossless round trip
-- through a serialization in which order is visible. See Q4.
-- [ERF-55] "Empty lists MUST be omitted" and [ERF-56] "a reader MUST
-- materialize an omitted list-typed field as an empty list" are both
-- satisfied structurally: zero child rows IS the empty list, and the writer
-- omits the key.
-- ============================================================================

-- [ERF-11][ERF-12] finding_audit: judgment verdicts, per auditor, with the
-- protocol version that produced them.
CREATE TABLE atom_finding_audit (
  deployment_id TEXT NOT NULL,
  atom_id       TEXT NOT NULL,
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  -- [ERF-11] "a bare model or tool identifier, DELIBERATELY NOT an Actor".
  -- Hence no erf_is_actor CHECK here, and hence no FK to any actor table.
  auditor       TEXT NOT NULL CHECK (length(trim(auditor)) > 0),
  -- [ERF-12] exactly one of three. A failed or abandoned audit MUST NOT be
  -- written as a verdict, which is why the closed set has no failure member.
  verdict       TEXT NOT NULL CHECK (verdict IN ('SUPPORTED','PARTIAL','UNSUPPORTED')),
  timestamp     TEXT NOT NULL CHECK (erf_is_timestamp(timestamp)),  -- [ERF-58]
  -- [ERF-11] "the protocol travels with the verdict"; required, not optional.
  protocol      TEXT NOT NULL CHECK (length(trim(protocol)) > 0),
  PRIMARY KEY (deployment_id, atom_id, pos),
  FOREIGN KEY (deployment_id, atom_id) REFERENCES atom(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

-- [ERF-24] evidence_audit: same entry shape, different question, different
-- parent. Two tables rather than one shared `audit_entry`: the shape is
-- shared but the entity is not -- a finding audit belongs to an atom and an
-- evidence audit to a claim, and a single table would need a
-- discriminator plus a CHECK to stop an evidence audit landing on an atom.
CREATE TABLE claim_evidence_audit (
  deployment_id TEXT NOT NULL,
  claim_id      TEXT NOT NULL,
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  auditor       TEXT NOT NULL CHECK (length(trim(auditor)) > 0),
  verdict       TEXT NOT NULL CHECK (verdict IN ('SUPPORTED','PARTIAL','UNSUPPORTED')),
  timestamp     TEXT NOT NULL CHECK (erf_is_timestamp(timestamp)),
  protocol      TEXT NOT NULL CHECK (length(trim(protocol)) > 0),
  PRIMARY KEY (deployment_id, claim_id, pos),
  FOREIGN KEY (deployment_id, claim_id) REFERENCES claim(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

-- [ERF-19][ERF-21][ERF-39][ERF-40] the standings ledger. Append-only,
-- per-person, humans only, every entry reasoned.
CREATE TABLE claim_standing (
  deployment_id TEXT NOT NULL,
  claim_id      TEXT NOT NULL,
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  -- [ERF-19] "MUST be a full RFC 3339 instant carrying both a time and an
  -- offset ... and MUST NOT be a bare date." The one place in the format
  -- where precision is mandatory, because this is the only ordered ledger.
  timestamp     TEXT NOT NULL CHECK (erf_is_instant(timestamp)),
  stance        TEXT NOT NULL CHECK (stance IN ('for','against','withdrawn')),
  -- [ERF-21][ERF-39] "A standing's `by` MUST be a human: actor."
  by            TEXT NOT NULL CHECK (by GLOB 'human:?*'),
  -- [ERF-19][ERF-39] "an entry without a reason is a toggle, not a judgment".
  why           TEXT NOT NULL CHECK (length(trim(why)) > 0),
  PRIMARY KEY (deployment_id, claim_id, pos),
  FOREIGN KEY (deployment_id, claim_id) REFERENCES claim(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;
-- NOTE: no UNIQUE on (claim, by). ERF-19 requires a correction to be a NEW
-- entry, and ERF-41 reads "each person's newest entry", so one person holds
-- many entries on one claim by design.

-- [ERF-20] evidence_at_stance: "what the ruler faced". A nested pair of id
-- lists inside an append-only entry -- so it is append-only too (its parent
-- entry cannot be edited, therefore neither can this).
CREATE TABLE standing_evidence (
  deployment_id TEXT NOT NULL,
  claim_id      TEXT NOT NULL,
  standing_pos  INTEGER NOT NULL,
  side          TEXT NOT NULL CHECK (side IN ('for','against')),
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  atom_id       TEXT NOT NULL,
  PRIMARY KEY (deployment_id, claim_id, standing_pos, side, pos),
  FOREIGN KEY (deployment_id, claim_id, standing_pos)
    REFERENCES claim_standing(deployment_id, claim_id, pos)
    ON DELETE CASCADE ON UPDATE CASCADE,
  -- The FK that should not be a cascade: [ERF-20] says this records what the
  -- ruler faced AT RULING TIME. If an atom later left the claim's evidence
  -- lists, the historical fact stands. RESTRICT, so an atom named by a past
  -- ruling cannot be deleted out from under it. See Q7.
  FOREIGN KEY (deployment_id, atom_id) REFERENCES atom(deployment_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) STRICT;
-- NOTE: no column for drift or for counts. [ERF-20] "Drift MUST NOT be stored
-- there ... Counts are not an acceptable digest either." Another MUST NOT
-- expressed by absence.

-- [ERF-23] evidence lives on the claim, in both directions.
-- One table with a `side` discriminator rather than two: atoms_for and
-- atoms_against are the same relation under opposite polarity, and ERF-23
-- treats them as one rule.
CREATE TABLE claim_atom (
  deployment_id TEXT NOT NULL,
  claim_id      TEXT NOT NULL,
  side          TEXT NOT NULL CHECK (side IN ('for','against')),
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  atom_id       TEXT NOT NULL,
  PRIMARY KEY (deployment_id, claim_id, side, pos),
  FOREIGN KEY (deployment_id, claim_id) REFERENCES claim(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  -- [ERF-35] "Every reference MUST resolve within the deployment". The FK
  -- targets `atom`, not `record`: the field is typed AtomId. That is stricter
  -- than ERF-35's own words ("name existing records") -- see Q2.
  FOREIGN KEY (deployment_id, atom_id) REFERENCES atom(deployment_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  -- INVENTED: the same atom twice on the same side of the same claim is
  -- meaningless. The spec forbids it nowhere.
  UNIQUE (deployment_id, claim_id, side, atom_id)
) STRICT;
-- NOTE: no constraint stops one atom sitting in atoms_for AND atoms_against
-- of the same claim. The spec forbids that nowhere either, and a quote that
-- cuts both ways is imaginable, so it is left legal. See Q8.

-- [ERF-25] absence/coverage backing.
CREATE TABLE claim_survey (
  deployment_id TEXT NOT NULL,
  claim_id      TEXT NOT NULL,
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  survey_id     TEXT NOT NULL,
  PRIMARY KEY (deployment_id, claim_id, pos),
  FOREIGN KEY (deployment_id, claim_id) REFERENCES claim(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (deployment_id, survey_id) REFERENCES survey(deployment_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (deployment_id, claim_id, survey_id)
) STRICT;
-- NOTE the asymmetry, which section 4.5 states as design: there is a
-- `surveys` list and no `surveys_against`. "A survey cannot disconfirm a gap
-- claim, because what disconfirms it is a found source, and a found source is
-- atom-shaped."

-- guidance, 4.3: recorded topic-family membership, "a decision rather than a
-- guess". FamilyName is a bare string alias -- no family table exists in the
-- data model, so families are not entities and there is nothing to point at.
CREATE TABLE claim_family (
  deployment_id TEXT NOT NULL,
  claim_id      TEXT NOT NULL,
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  family        TEXT NOT NULL CHECK (length(trim(family)) > 0),
  PRIMARY KEY (deployment_id, claim_id, pos),
  FOREIGN KEY (deployment_id, claim_id) REFERENCES claim(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE (deployment_id, claim_id, family)
) STRICT;

-- [ERF-43][ERF-44] claim-to-claim edges, and only claim-to-claim (section 5
-- note: "edges means claim-to-claim and carries no other record type").
CREATE TABLE claim_edge (
  deployment_id TEXT NOT NULL,
  claim_id      TEXT NOT NULL,        -- the subject; edges are subject-first
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  to_claim_id   TEXT NOT NULL,
  relation      TEXT NOT NULL CHECK (relation IN
                  ('supports','assumes','decomposes-into','conflicts-with')),
  PRIMARY KEY (deployment_id, claim_id, pos),
  FOREIGN KEY (deployment_id, claim_id) REFERENCES claim(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  -- RESTRICT, not CASCADE: deleting a claim that another claim assumes would
  -- silently unmake the second claim's premise set [ERF-24].
  FOREIGN KEY (deployment_id, to_claim_id) REFERENCES claim(deployment_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  -- [ERF-43] "Self-edges MUST NOT exist." A pure state constraint, so a CHECK.
  CHECK (claim_id <> to_claim_id),
  -- INVENTED: one relation per ordered pair. The spec forbids duplicates
  -- nowhere, but two identical edges say nothing twice.
  UNIQUE (deployment_id, claim_id, to_claim_id, relation)
) STRICT;
CREATE INDEX claim_edge_to_ix ON claim_edge(deployment_id, to_claim_id, relation);

-- [ERF-44] "conflicts-with MUST be stored once per pair." The reciprocal is
-- derived, so A->B and B->A are the same fact and the second is a violation.
-- Expressible as a partial unique index over the unordered pair -- one of the
-- few genuinely elegant fits between this format and SQL.
CREATE UNIQUE INDEX claim_edge_conflict_pair_ux
  ON claim_edge(deployment_id,
                min(claim_id, to_claim_id),
                max(claim_id, to_claim_id))
  WHERE relation = 'conflicts-with';

-- [ERF-26][ERF-27][ERF-28] the search acts. Immutable once conducted; see the
-- triggers.
CREATE TABLE survey_search (
  deployment_id TEXT NOT NULL,
  survey_id     TEXT NOT NULL,
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  -- [ERF-26] "MUST name its concrete instrument" -- a category does not
  -- satisfy this, and no CHECK can tell the difference. See CANNOT list.
  tool          TEXT NOT NULL CHECK (length(trim(tool)) > 0),
  query         TEXT NOT NULL CHECK (length(trim(query)) > 0),
  scope         TEXT,
  -- [ERF-27] "as the instrument reported it, AS TEXT". Typed TEXT on purpose:
  -- an INTEGER column here would be the schema stating a precision the
  -- instrument did not give.
  hits_reported TEXT NOT NULL,
  -- [ERF-28] "absent one, an act inherits the survey's conducted timestamp".
  timestamp     TEXT CHECK (timestamp IS NULL OR erf_is_timestamp(timestamp)),
  PRIMARY KEY (deployment_id, survey_id, pos),
  FOREIGN KEY (deployment_id, survey_id) REFERENCES survey(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

-- [ERF-27] the curated subset. Mutable, unlike the acts: ERF-28 explicitly
-- permits "a notable_results entry gaining its atoms once a hit is minted".
CREATE TABLE survey_notable_result (
  deployment_id TEXT NOT NULL,
  survey_id     TEXT NOT NULL,
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  what          TEXT NOT NULL CHECK (length(trim(what)) > 0),
  note          TEXT NOT NULL CHECK (length(trim(note)) > 0),
  PRIMARY KEY (deployment_id, survey_id, pos),
  FOREIGN KEY (deployment_id, survey_id) REFERENCES survey(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

CREATE TABLE survey_notable_atom (
  deployment_id TEXT NOT NULL,
  survey_id     TEXT NOT NULL,
  result_pos    INTEGER NOT NULL,
  pos           INTEGER NOT NULL CHECK (pos >= 0),
  atom_id       TEXT NOT NULL,
  PRIMARY KEY (deployment_id, survey_id, result_pos, pos),
  FOREIGN KEY (deployment_id, survey_id, result_pos)
    REFERENCES survey_notable_result(deployment_id, survey_id, pos)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (deployment_id, atom_id) REFERENCES atom(deployment_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) STRICT;
-- NOTE: notable_results.atoms is NOT listed in ERF-35's set of references
-- that must resolve ("atoms_for, atoms_against, edges.to, and surveys").
-- The FK above is therefore stricter than the specification. See Q2.

-- ============================================================================
-- 6. THE OPAQUE SIDECAR  [ERF-55][ERF-57][ERF-72]
--
-- A schema for a format whose consumers MUST be tolerant needs an escape
-- hatch, or it is a non-conforming consumer. Every key on a record, source or
-- declaration that this schema does not have a column for lands here as JSON,
-- with its position, so the writer can put it back.
-- ============================================================================
CREATE TABLE record_extra_field (
  deployment_id TEXT NOT NULL,
  record_id     TEXT NOT NULL,
  pos           INTEGER NOT NULL,       -- key order in the source frontmatter
  key           TEXT NOT NULL,
  value_json    TEXT NOT NULL CHECK (json_valid(value_json)),
  -- [ERF-72] an x_ key is a declared extension and a validator MUST NOT
  -- report it; any other unknown key is an ERF-55 producer violation that a
  -- validator MUST report and a consumer MUST still accept [ERF-57].
  is_extension  INTEGER NOT NULL GENERATED ALWAYS AS (key GLOB 'x_*') VIRTUAL,
  PRIMARY KEY (deployment_id, record_id, key),
  FOREIGN KEY (deployment_id, record_id) REFERENCES record(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;
-- [ERF-66] "A record's frontmatter MUST NOT contain a duplicate key" -- the
-- PRIMARY KEY on (record, key) says so for the sidecar; for known fields the
-- one-column-per-field shape says so structurally; and the loader must say so
-- for the file, because by the time YAML has been parsed the duplicate is
-- already gone. See Q10.

CREATE TABLE source_extra_field (
  deployment_id TEXT NOT NULL,
  corpus_id     TEXT NOT NULL,
  source_id     TEXT NOT NULL,
  pos           INTEGER NOT NULL,
  key           TEXT NOT NULL,
  value_json    TEXT NOT NULL CHECK (json_valid(value_json)),
  is_extension  INTEGER NOT NULL GENERATED ALWAYS AS (key GLOB 'x_*') VIRTUAL,
  PRIMARY KEY (deployment_id, corpus_id, source_id, key),
  FOREIGN KEY (deployment_id, corpus_id, source_id)
    REFERENCES corpus_source(deployment_id, corpus_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

CREATE TABLE corpus_extra_field (
  deployment_id TEXT NOT NULL,
  corpus_id     TEXT NOT NULL,
  pos           INTEGER NOT NULL,
  key           TEXT NOT NULL,
  value_json    TEXT NOT NULL CHECK (json_valid(value_json)),
  is_extension  INTEGER NOT NULL GENERATED ALWAYS AS (key GLOB 'x_*') VIRTUAL,
  PRIMARY KEY (deployment_id, corpus_id, key),
  FOREIGN KEY (deployment_id, corpus_id) REFERENCES corpus(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

-- ============================================================================
-- 7. NARRATIVES  (section 4.6)
--
-- [ERF-34] "A narrative MUST NOT be modelled as a record ... It therefore has
-- no interface in the data model of section 3." It is still part of a corpus,
-- still checkable [ERF-32], and still refers to claims [ERF-31], so it needs
-- tables -- just not record tables. It has no id, no standings, no
-- disposition and no entry in `record`.
-- ============================================================================
CREATE TABLE narrative (
  deployment_id  TEXT NOT NULL,
  corpus_id      TEXT NOT NULL,
  -- INVENTED key: a narrative has no id in the format, so the only thing that
  -- can identify one is where it lives -- which ERF-54 says carries no
  -- meaning for records. See Q11.
  path           TEXT NOT NULL,
  title          TEXT NOT NULL,               -- [ERF-34] frontmatter: title,
  created_timestamp TEXT NOT NULL CHECK (erf_is_timestamp(created_timestamp)),
  created_by     TEXT CHECK (created_by IS NULL OR erf_is_actor(created_by)),
  body           TEXT NOT NULL,
  PRIMARY KEY (deployment_id, corpus_id, path),
  FOREIGN KEY (deployment_id, corpus_id) REFERENCES corpus(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

-- [ERF-31][ERF-32][ERF-33] PROJECTION over narrative.body: the bindings are
-- parsed out of the prose, they are recomputable from it, and the writer
-- never reads this table. [ERF-62].
CREATE TABLE narrative_binding (
  deployment_id TEXT NOT NULL,
  corpus_id     TEXT NOT NULL,
  path          TEXT NOT NULL,
  pos           INTEGER NOT NULL,
  claim_id      TEXT NOT NULL,      -- deliberately NOT a foreign key
  anchor        TEXT NOT NULL CHECK (length(anchor) > 0),   -- [ERF-31] REQUIRED
  bound_at      TEXT CHECK (bound_at IS NULL OR erf_is_date(bound_at)),
  PRIMARY KEY (deployment_id, corpus_id, path, pos, claim_id),
  FOREIGN KEY (deployment_id, corpus_id, path)
    REFERENCES narrative(deployment_id, corpus_id, path)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;
-- THE FOREIGN KEY THAT MUST NOT EXIST. [ERF-33]: "A consumer encountering a
-- narrative binding whose id resolves to no record MUST REPORT IT and MUST
-- NOT drop it silently ... MUST NOT invent a record to satisfy the
-- reference." A FK to claim would make an unresolved binding unstorable, and
-- an unstorable defect is a dropped one -- the exact failure ERF-33 forbids.
-- So the reference is left dangling by design and reported by the view
-- v_erf33_unresolved_binding. See Q1.

-- ============================================================================
-- 8. INTERCHANGE PROVENANCE  (NOT part of the format)
--
-- [ERF-53] a store MAY hold records any way it likes "provided every record
-- round-trips through the interchange form without loss". To write a record
-- back out as a FILE, something must remember which file. ERF-54 says "no
-- meaning lives in a path", so this table holds data the format declares
-- meaningless and the round trip cannot proceed without. See Q12.
-- ============================================================================
CREATE TABLE record_file (
  deployment_id TEXT NOT NULL,
  record_id     TEXT NOT NULL,
  rel_path      TEXT NOT NULL,
  PRIMARY KEY (deployment_id, record_id),
  UNIQUE (deployment_id, rel_path),
  FOREIGN KEY (deployment_id, record_id) REFERENCES record(deployment_id, id)
    ON DELETE CASCADE ON UPDATE CASCADE
) STRICT;

-- What the loader could not represent or had to flag. A validator's output is
-- not part of the format, but ERF-57's "MUST REPORT them" makes it part of a
-- conforming consumer.
CREATE TABLE load_diagnostic (
  deployment_id TEXT,
  rel_path      TEXT,
  requirement   TEXT,          -- e.g. 'ERF-55'
  severity      TEXT NOT NULL CHECK (severity IN ('error','violation','report','advice')),
  message       TEXT NOT NULL
) STRICT;

-- [ERF-13] "never renamed and never REUSED". Reuse is a constraint over the
-- set of ids that have EVER existed, which a table of live rows cannot see.
-- The tombstone makes history visible; the trigger below enforces it.
CREATE TABLE record_id_tombstone (
  deployment_id TEXT NOT NULL,
  id            TEXT NOT NULL,
  retired_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (deployment_id, id)
) STRICT;

-- ============================================================================
-- 9. TRIGGERS -- the transition constraints
--
-- Everything above constrains a STATE. What follows constrains a CHANGE
-- between states, which no CHECK can see. These are exactly the requirements
-- the format spends its append-only language on.
-- ============================================================================

-- ---- [ERF-19][ERF-40] standings are append-only ---------------------------
-- "entries MUST NOT be edited or deleted; a correction is a new entry."
CREATE TRIGGER erf19_standing_no_update
BEFORE UPDATE ON claim_standing
BEGIN
  SELECT RAISE(ABORT, 'ERF-19/ERF-40: standings are append-only; a correction is a new entry');
END;

CREATE TRIGGER erf19_standing_no_delete
BEFORE DELETE ON claim_standing
-- WHEN guard: a cascade from deleting the parent claim is a different act
-- from editing the ledger. The format does not describe deleting a claim at
-- all (Q6), so the trigger fires only when the claim still exists.
WHEN EXISTS (SELECT 1 FROM claim c
              WHERE c.deployment_id = OLD.deployment_id AND c.id = OLD.claim_id)
BEGIN
  SELECT RAISE(ABORT, 'ERF-19/ERF-40: standings are append-only; entries are never deleted');
END;

-- [ERF-20] the evidence stamped on a standing is part of that entry.
CREATE TRIGGER erf20_standing_evidence_no_update
BEFORE UPDATE ON standing_evidence
BEGIN
  SELECT RAISE(ABORT, 'ERF-20: evidence_at_stance records what the ruler faced; it never changes');
END;

CREATE TRIGGER erf20_standing_evidence_no_delete
BEFORE DELETE ON standing_evidence
WHEN EXISTS (SELECT 1 FROM claim_standing s
              WHERE s.deployment_id = OLD.deployment_id
                AND s.claim_id = OLD.claim_id AND s.pos = OLD.standing_pos)
BEGIN
  SELECT RAISE(ABORT, 'ERF-20: evidence_at_stance records what the ruler faced; it never changes');
END;

-- ---- [ERF-40] the audit lists are append-only "in the same sense" ---------
CREATE TRIGGER erf40_finding_audit_no_update
BEFORE UPDATE ON atom_finding_audit
BEGIN
  SELECT RAISE(ABORT, 'ERF-40: finding_audit is append-only');
END;

CREATE TRIGGER erf40_finding_audit_no_delete
BEFORE DELETE ON atom_finding_audit
WHEN EXISTS (SELECT 1 FROM atom a
              WHERE a.deployment_id = OLD.deployment_id AND a.id = OLD.atom_id)
BEGIN
  SELECT RAISE(ABORT, 'ERF-40: finding_audit is append-only');
END;

CREATE TRIGGER erf40_evidence_audit_no_update
BEFORE UPDATE ON claim_evidence_audit
BEGIN
  SELECT RAISE(ABORT, 'ERF-40: evidence_audit is append-only');
END;

CREATE TRIGGER erf40_evidence_audit_no_delete
BEFORE DELETE ON claim_evidence_audit
WHEN EXISTS (SELECT 1 FROM claim c
              WHERE c.deployment_id = OLD.deployment_id AND c.id = OLD.claim_id)
BEGIN
  SELECT RAISE(ABORT, 'ERF-40: evidence_audit is append-only');
END;

-- ---- [ERF-28] a survey's search acts are immutable ------------------------
-- "a search already run cannot have run differently."
CREATE TRIGGER erf28_search_no_update
BEFORE UPDATE ON survey_search
BEGIN
  SELECT RAISE(ABORT, 'ERF-28: what a survey conducted is immutable');
END;

CREATE TRIGGER erf28_search_no_delete
BEFORE DELETE ON survey_search
WHEN EXISTS (SELECT 1 FROM survey s
              WHERE s.deployment_id = OLD.deployment_id AND s.id = OLD.survey_id)
BEGIN
  SELECT RAISE(ABORT, 'ERF-28: what a survey conducted is immutable');
END;

-- ---- [ERF-13][ERF-15] ids are permanent -----------------------------------
-- ERF-13 says an atom's id is "never renamed"; ERF-15 says a claim keeps its
-- id when it moves corpora. GENERALIZED here to every record type: no id may
-- ever be updated. Logged as a guess (friction-log 2026-08-25, ERF-13).
CREATE TRIGGER erf13_record_id_immutable
BEFORE UPDATE OF id ON record
WHEN NEW.id <> OLD.id
BEGIN
  SELECT RAISE(ABORT, 'ERF-13/ERF-15: a record id is permanent; it is never renamed');
END;

-- [ERF-13] "never reused".
CREATE TRIGGER erf13_id_never_reused
BEFORE INSERT ON record
WHEN EXISTS (SELECT 1 FROM record_id_tombstone t
              WHERE t.deployment_id = NEW.deployment_id AND t.id = NEW.id)
BEGIN
  SELECT RAISE(ABORT, 'ERF-13: a record id is never reused');
END;

CREATE TRIGGER erf13_tombstone_on_delete
AFTER DELETE ON record
BEGIN
  INSERT OR IGNORE INTO record_id_tombstone(deployment_id, id)
  VALUES (OLD.deployment_id, OLD.id);
END;

-- ---- [ERF-48] last_modified must advance ---------------------------------
-- "Any change to a record MUST set last_modified to a timestamp later than
-- its created and later than any prior last_modified. At date precision
-- 'later' admits the same day."
--
-- This is the format's purest transition constraint: it compares the new row
-- to the old one, so no CHECK can express it. The three-way precision rule
-- (instant vs instant, date vs date, and the mixed case) is delegated to
-- erf_ts_cmp().
--
-- The ERF-48 EXCEPTION -- "appending to an append-only list MUST NOT advance
-- it" -- needs no code here at all, and that is a finding: in a normalized
-- schema an append is an INSERT into a child table and never touches the
-- parent row, so the exception the prose has to carve out is structurally
-- free. See relational-questions.md Q13.
CREATE TRIGGER erf48_last_modified_advances
BEFORE UPDATE ON record
WHEN NEW.last_modified_timestamp IS NOT NULL
 AND (OLD.last_modified_timestamp IS NULL
      OR NEW.last_modified_timestamp <> OLD.last_modified_timestamp
      OR NEW.type <> OLD.type OR NEW.corpus_id <> OLD.corpus_id)
BEGIN
  SELECT CASE
    WHEN OLD.last_modified_timestamp IS NOT NULL
     AND erf_ts_cmp(NEW.last_modified_timestamp, OLD.last_modified_timestamp) < 0
    THEN RAISE(ABORT, 'ERF-48: last_modified must be later than any prior last_modified')
    WHEN NEW.created_timestamp IS NOT NULL
     AND erf_ts_cmp(NEW.last_modified_timestamp, NEW.created_timestamp) < 0
    THEN RAISE(ABORT, 'ERF-48: last_modified must be later than created')
  END;
END;

-- [ERF-48] a record edited at all must carry a stamp. Fires on any update to
-- a substantive column of `record` that leaves last_modified untouched.
CREATE TRIGGER erf48_edit_must_stamp
BEFORE UPDATE OF type, corpus_id ON record
WHEN NEW.last_modified_timestamp IS NOT DISTINCT FROM OLD.last_modified_timestamp
BEGIN
  SELECT RAISE(ABORT, 'ERF-48: any change to a record must set last_modified');
END;

CREATE TRIGGER erf48_atom_edit_must_stamp
BEFORE UPDATE ON atom
WHEN (NEW.finding, NEW.quote, NEW.source_id, NEW.source_quality,
      NEW.as_of_date, NEW.limitations)
     IS NOT (OLD.finding, OLD.quote, OLD.source_id, OLD.source_quality,
             OLD.as_of_date, OLD.limitations)
 AND NOT EXISTS (SELECT 1 FROM record r
                  WHERE r.deployment_id = NEW.deployment_id AND r.id = NEW.id
                    AND r.last_modified_timestamp IS NOT NULL)
BEGIN
  SELECT RAISE(ABORT, 'ERF-48: editing an atom must stamp last_modified');
END;

CREATE TRIGGER erf48_claim_edit_must_stamp
BEFORE UPDATE ON claim
WHEN (NEW.title, NEW.epistemic_kind, NEW.short_name, NEW.semantic_query, NEW.body)
     IS NOT (OLD.title, OLD.epistemic_kind, OLD.short_name, OLD.semantic_query, OLD.body)
 AND NOT EXISTS (SELECT 1 FROM record r
                  WHERE r.deployment_id = NEW.deployment_id AND r.id = NEW.id
                    AND r.last_modified_timestamp IS NOT NULL)
BEGIN
  SELECT RAISE(ABORT, 'ERF-48: editing a claim must stamp last_modified');
END;

-- ---- [ERF-54] the subtype row must agree with the record's declared type --
CREATE TRIGGER erf54_atom_type_agrees
BEFORE INSERT ON atom
WHEN NOT EXISTS (SELECT 1 FROM record r
                  WHERE r.deployment_id = NEW.deployment_id AND r.id = NEW.id
                    AND r.type = 'atom')
BEGIN
  SELECT RAISE(ABORT, 'ERF-54: an atom row needs a record declaring type: atom');
END;

CREATE TRIGGER erf54_claim_type_agrees
BEFORE INSERT ON claim
WHEN NOT EXISTS (SELECT 1 FROM record r
                  WHERE r.deployment_id = NEW.deployment_id AND r.id = NEW.id
                    AND r.type = 'claim')
BEGIN
  SELECT RAISE(ABORT, 'ERF-54: a claim row needs a record declaring type: claim');
END;

CREATE TRIGGER erf54_survey_type_agrees
BEFORE INSERT ON survey
WHEN NOT EXISTS (SELECT 1 FROM record r
                  WHERE r.deployment_id = NEW.deployment_id AND r.id = NEW.id
                    AND r.type = 'survey')
BEGIN
  SELECT RAISE(ABORT, 'ERF-54: a survey row needs a record declaring type: survey');
END;

-- ---- [ERF-43] acyclicity ---------------------------------------------------
-- "assumes and decomposes-into MUST admit no cycles."
-- Not a state constraint on a row, not a transition constraint on a row: a
-- constraint on the transitive closure of a whole table. A trigger with a
-- recursive CTE is the only way to hold it at write time, and it costs a
-- graph walk per inserted edge.
CREATE TRIGGER erf43_no_cycles
AFTER INSERT ON claim_edge
WHEN NEW.relation IN ('assumes','decomposes-into')
BEGIN
  SELECT CASE WHEN EXISTS (
    WITH RECURSIVE reach(id) AS (
      SELECT NEW.to_claim_id
      UNION
      SELECT e.to_claim_id FROM claim_edge e JOIN reach ON e.claim_id = reach.id
       WHERE e.deployment_id = NEW.deployment_id
         AND e.relation IN ('assumes','decomposes-into')
    )
    SELECT 1 FROM reach WHERE id = NEW.claim_id
  ) THEN RAISE(ABORT, 'ERF-43: assumes/decomposes-into admit no cycles') END;
END;

-- ---- [ERF-2] a received file is immutable ---------------------------------
-- "it MUST be retained as received, and a revision arriving later MUST be a
-- new source, never an overwrite." Enforced for the fields that describe the
-- retrieved artifact. Only half the rule; see the CANNOT note in section 2.
CREATE TRIGGER erf2_source_artifact_immutable
BEFORE UPDATE ON corpus_source
WHEN (NEW.fetched_url, NEW.fetched_digest, NEW.citation_text)
     IS NOT (OLD.fetched_url, OLD.fetched_digest, OLD.citation_text)
BEGIN
  SELECT RAISE(ABORT, 'ERF-2: a revision is a new source, never an overwrite');
END;

-- ============================================================================
-- 10. VALIDATOR VIEWS -- the computed readings
--
-- Everything the format says MUST be computed and never stored lives here.
-- A view is the schema's way of saying "this is not a column".
-- ============================================================================

-- [ERF-41] each person's newest entry is that person's current stance.
CREATE VIEW v_current_stance AS
SELECT deployment_id, claim_id, by, stance, timestamp, pos
FROM (
  SELECT s.*,
         row_number() OVER (
           PARTITION BY s.deployment_id, s.claim_id, s.by
           -- ERF-19 guarantees a full instant here, so ordering is total;
           -- pos breaks a same-instant tie, which the format does not
           -- address (friction-log 2026-08-25, ERF-41).
           ORDER BY erf_ts_key(s.timestamp) DESC, s.pos DESC
         ) AS rn
  FROM claim_standing s
)
WHERE rn = 1;

-- [ERF-41] "Disposition MUST be computed, never stored, from the current
-- stances alone". Every input has exactly one reading; no tie-break.
CREATE VIEW v_claim_disposition AS
SELECT c.deployment_id,
       c.id AS claim_id,
       CASE
         WHEN (SELECT count(*) FROM claim_standing s
                WHERE s.deployment_id = c.deployment_id AND s.claim_id = c.id) = 0
           THEN 'proposal'
         WHEN (SELECT count(*) FROM v_current_stance v
                WHERE v.deployment_id = c.deployment_id AND v.claim_id = c.id
                  AND v.stance <> 'withdrawn') = 0
           THEN 'retired'
         WHEN (SELECT count(*) FROM v_current_stance v
                WHERE v.deployment_id = c.deployment_id AND v.claim_id = c.id
                  AND v.stance = 'against') = 0
           THEN 'active'
         WHEN (SELECT count(*) FROM v_current_stance v
                WHERE v.deployment_id = c.deployment_id AND v.claim_id = c.id
                  AND v.stance = 'for') = 0
           THEN 'rejected'
         ELSE 'contested'
       END AS disposition
FROM claim c;

-- [ERF-49] "A validator MUST FLAG as unbacked an observation someone stands
-- on with empty atoms_for and empty surveys, and such an argument with no
-- premises". A flag, not a violation -- so a view, not a constraint. The
-- difference between MUST-flag and MUST-reject is the difference between a
-- view and a CHECK, and the format draws it deliberately.
CREATE VIEW v_erf49_unbacked AS
SELECT c.deployment_id, c.id AS claim_id, c.epistemic_kind
FROM claim c
WHERE EXISTS (SELECT 1 FROM v_current_stance v
               WHERE v.deployment_id = c.deployment_id AND v.claim_id = c.id
                 AND v.stance <> 'withdrawn')
  AND (
    (c.epistemic_kind = 'observation'
     AND NOT EXISTS (SELECT 1 FROM claim_atom a
                      WHERE a.deployment_id = c.deployment_id AND a.claim_id = c.id
                        AND a.side = 'for')
     AND NOT EXISTS (SELECT 1 FROM claim_survey s
                      WHERE s.deployment_id = c.deployment_id AND s.claim_id = c.id))
    OR
    -- [ERF-24] an argument's premises: its own outgoing `assumes` edges plus
    -- the incoming `supports` edges of other claims.
    (c.epistemic_kind = 'argument'
     AND NOT EXISTS (SELECT 1 FROM claim_edge e
                      WHERE e.deployment_id = c.deployment_id AND e.claim_id = c.id
                        AND e.relation = 'assumes')
     AND NOT EXISTS (SELECT 1 FROM claim_edge e
                      WHERE e.deployment_id = c.deployment_id AND e.to_claim_id = c.id
                        AND e.relation = 'supports'))
  );

-- [ERF-24] "bet and commitment owe no backing ... auditability is computable
-- from the kind."
CREATE VIEW v_claim_auditable AS
SELECT deployment_id, id AS claim_id,
       CASE WHEN epistemic_kind IN ('observation','argument') THEN 1 ELSE 0 END
         AS is_auditable
FROM claim;

-- [ERF-43] premise closure terminating in a retired leaf: "a flag rather than
-- a violation, because a withdrawal elsewhere can create the condition
-- without any edit to the argument".
CREATE VIEW v_erf43_retired_leaf AS
WITH RECURSIVE closure(deployment_id, root, node) AS (
  SELECT c.deployment_id, c.id, c.id FROM claim c WHERE c.epistemic_kind = 'argument'
  UNION
  SELECT cl.deployment_id, cl.root, e.to_claim_id
    FROM closure cl JOIN claim_edge e
      ON e.deployment_id = cl.deployment_id AND e.claim_id = cl.node
   WHERE e.relation = 'assumes'
  UNION
  SELECT cl.deployment_id, cl.root, e.claim_id
    FROM closure cl JOIN claim_edge e
      ON e.deployment_id = cl.deployment_id AND e.to_claim_id = cl.node
   WHERE e.relation = 'supports'
)
SELECT cl.deployment_id, cl.root AS argument_id, cl.node AS leaf_id
FROM closure cl
JOIN claim lc ON lc.deployment_id = cl.deployment_id AND lc.id = cl.node
JOIN v_claim_disposition d ON d.deployment_id = cl.deployment_id AND d.claim_id = cl.node
WHERE cl.root <> cl.node
  AND lc.epistemic_kind <> 'argument'
  AND d.disposition = 'retired';

-- [ERF-47] staleness of a finding audit: older than the last change to what
-- it judged. "Where the two stamps differ in precision and the coarser one
-- cannot order them ... the comparison MUST resolve to stale."
CREATE VIEW v_erf47_stale_finding_audit AS
SELECT fa.deployment_id, fa.atom_id, fa.pos, fa.auditor, fa.timestamp AS audit_ts,
       r.last_modified_timestamp AS changed_ts
FROM atom_finding_audit fa
JOIN record r ON r.deployment_id = fa.deployment_id AND r.id = fa.atom_id
WHERE r.last_modified_timestamp IS NOT NULL
  AND erf_is_stale(fa.timestamp, r.last_modified_timestamp) = 1;

CREATE VIEW v_erf47_stale_evidence_audit AS
SELECT ea.deployment_id, ea.claim_id, ea.pos, ea.auditor, ea.timestamp AS audit_ts,
       max_change.changed_ts
FROM claim_evidence_audit ea
JOIN (
  -- what an evidence audit judged: the claim statement AND its cited atoms
  -- (section 4.4: "an atom added to either list, a cited atom modified, the
  -- statement edited"). Modelled as the newest of those change stamps.
  SELECT c.deployment_id, c.id AS claim_id,
         max(coalesce(rc.last_modified_timestamp, ''),
             coalesce((SELECT max(ra.last_modified_timestamp)
                         FROM claim_atom ca
                         JOIN record ra ON ra.deployment_id = ca.deployment_id
                                       AND ra.id = ca.atom_id
                        WHERE ca.deployment_id = c.deployment_id
                          AND ca.claim_id = c.id), '')) AS changed_ts
    FROM claim c
    JOIN record rc ON rc.deployment_id = c.deployment_id AND rc.id = c.id
) max_change
  ON max_change.deployment_id = ea.deployment_id AND max_change.claim_id = ea.claim_id
WHERE max_change.changed_ts <> ''
  AND erf_is_stale(ea.timestamp, max_change.changed_ts) = 1;

-- [ERF-32] a narrative binding is stale when the claim it names carries a
-- last_modified later than its bound-at; without bound-at, staleness is
-- `indeterminate` and MUST NOT be reported as current.
CREATE VIEW v_erf32_binding_staleness AS
SELECT nb.deployment_id, nb.corpus_id, nb.path, nb.pos, nb.claim_id,
       CASE
         WHEN nb.bound_at IS NULL THEN 'indeterminate'
         WHEN NOT EXISTS (SELECT 1 FROM record r
                           WHERE r.deployment_id = nb.deployment_id AND r.id = nb.claim_id)
           THEN 'unresolved'
         WHEN (SELECT r.last_modified_timestamp FROM record r
                WHERE r.deployment_id = nb.deployment_id AND r.id = nb.claim_id) IS NULL
           THEN 'current'
         WHEN erf_is_stale(nb.bound_at,
                           (SELECT r.last_modified_timestamp FROM record r
                             WHERE r.deployment_id = nb.deployment_id AND r.id = nb.claim_id)) = 1
           THEN 'stale'
         ELSE 'current'
       END AS staleness
FROM narrative_binding nb;

-- [ERF-33] the report that replaces the foreign key.
CREATE VIEW v_erf33_unresolved_binding AS
SELECT nb.deployment_id, nb.corpus_id, nb.path, nb.pos, nb.claim_id, nb.anchor
FROM narrative_binding nb
WHERE NOT EXISTS (SELECT 1 FROM record r
                   WHERE r.deployment_id = nb.deployment_id AND r.id = nb.claim_id);

-- [ERF-31] the anchor MUST be a verbatim substring of the passage. Checkable
-- only against the prose, which the database holds -- so checkable here.
CREATE VIEW v_erf31_anchor_missing AS
SELECT nb.deployment_id, nb.corpus_id, nb.path, nb.pos, nb.anchor
FROM narrative_binding nb
JOIN narrative n ON n.deployment_id = nb.deployment_id
                AND n.corpus_id = nb.corpus_id AND n.path = nb.path
WHERE instr(n.body, nb.anchor) = 0;

-- [ERF-55][ERF-72] unknown keys a validator must report, minus the extension
-- namespace it must not.
CREATE VIEW v_erf55_unknown_field AS
SELECT deployment_id, record_id, key, 'record' AS scope FROM record_extra_field
 WHERE is_extension = 0
UNION ALL
SELECT deployment_id, source_id, key, 'source' FROM source_extra_field
 WHERE is_extension = 0
UNION ALL
SELECT deployment_id, corpus_id, key, 'declaration' FROM corpus_extra_field
 WHERE is_extension = 0;

-- [ERF-57] what a consumer must report as opaque: unknown record types.
CREATE VIEW v_erf57_unknown_type AS
SELECT deployment_id, id, type FROM record WHERE is_known = 0;

-- [ERF-18] advisory only: does the body open by restating the title?
CREATE VIEW v_erf18_restatement_advisory AS
SELECT deployment_id, id AS claim_id
FROM claim
WHERE body <> '' AND instr(body, title) = 0;

-- [ERF-25] a claim reading as a universal negative SHOULD cite surveys.
-- Advisory and heuristic: the format gives no machine test for "of the form
-- 'no shipped tool does X'".
CREATE VIEW v_erf25_universal_negative_advisory AS
SELECT c.deployment_id, c.id AS claim_id, c.title
FROM claim c
WHERE (lower(c.title) GLOB 'no *' OR lower(c.title) GLOB '*none of *'
       OR lower(c.title) GLOB '* no * does *')
  AND NOT EXISTS (SELECT 1 FROM claim_survey s
                   WHERE s.deployment_id = c.deployment_id AND s.claim_id = c.id);

-- [ERF-42] rejected and retired MUST NOT be conflated -- a consumer rule, so
-- the schema can only keep them distinguishable, which v_claim_disposition
-- does by returning five values and never four.

-- ============================================================================
-- 11. WHAT THIS SCHEMA CANNOT EXPRESS
--
-- Recorded here so the omissions are legible rather than invisible.
-- Detail and reasoning in relational-questions.md, section "CANNOT".
--
--  ERF-1   a capture MUST exist before any check runs      (temporal, external)
--  ERF-6   the quote is verbatim from the capture          (needs capture text)
--  ERF-8   citation_text MUST be rendered from citation    (needs a CSL engine)
--  ERF-9   what source_quality grades                      (a judgment)
--  ERF-10  reported speech does not raise the grade        (a judgment)
--  ERF-11  the mechanical result MUST NOT be stored        (absence of a column)
--  ERF-12  a failed audit MUST NOT be written as a verdict (indistinguishable)
--  ERF-18  the body SHOULD restate the title               (a reading; advisory view)
--  ERF-24  does the evidence carry the claim               (a judgment)
--  ERF-26  a category is not a concrete instrument         (a judgment)
--  ERF-27  MUST NOT state precision the instrument did not give
--  ERF-31  a passage that asserts SHOULD end with a binding (needs prose analysis)
--  ERF-37  a producer MUST verify an id is unused          (a producer duty; the
--          PK enforces the outcome, never the check)
--  ERF-50/51 the mechanical quote check                    (needs capture text;
--          implemented in erf_check.py, not in SQL)
--  ERF-60/61 version negotiation                           (a consumer act)
--  ERF-62  exactly one authoritative home                  (this database is a
--          projection of that home and cannot know it)
--  ERF-63  an edit history sufficient to verify ERF-40     (this schema forbids
--          the edit instead of recording it -- a stronger, different thing)
--  ERF-65/66/67 the parse rules                            (pre-database)
-- ============================================================================
