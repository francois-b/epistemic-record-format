---
title: "The Epistemic Record Format"
subtitle: "Specification: the record types, the data model, and the invariants, stated so an implementer can build to them or diff an existing system against them."
spec_version: 1.0-draft-3
status: draft
last_updated: 2026-08-22
generated: 2026-08-22
model: claude-fable-5
---

# The Epistemic Record Format

Specification, v1.0-draft-3. The abstract and status are in `README.md`;
the change history is in `CHANGELOG.md`; how the format got this way, and
what the surrounding field holds, is the companion document
`DESIGN-HISTORY.md`. The normative data model is the TypeScript file
`types/erf.ts`, mirrored inline in section 3.

## 1. Scope and conformance

This format records five things: what a source *said* (atoms over captured
sources), what an author *claims* (claims), what is *open* (questions),
what was *searched* and what it yielded (surveys), and where people
*stand* (standings). What was *done* about any of it
(decisions, actions, outcomes) is out of scope: a neighboring system may
consume these records, and an activated bet plus its standing entries covers
the common case.

A conforming implementation stores, serializes, and validates the record
types of section 3 under the invariants of section 6. The specification is
written to be handed to an implementer (human or LLM) to build from, or
diffed against an existing system requirement by requirement.

Requirements are numbered (`ERF-4.7`) and use RFC 2119 keywords: MUST
(violation means non-conformance), SHOULD (default with legitimate
exceptions; a departing system should know and say so), MAY (declared
option; differing here is flavor, not divergence). Passages set as notes
are non-normative: they explain choices and bind nothing.

### Conformance classes

Conformance is claimed per class, not against the whole document:

- Record: a single atom, claim, or question. Binds the data model
  (section 3) and its record type's requirements (section 4).
- Corpus: a collection of records under one registry entry. Binds the
  invariants (section 6) and `ERF-8.1` and `ERF-8.3`.
- Producer: a tool or process that writes records. Binds the serialization
  rules (section 7) and the producer SHOULDs of section 4 (for example
  `ERF-4.14a`). Producers are strict: they write only defined fields,
  legal values, and self-describing files.
- Consumer: a tool that reads records. Consumers are tolerant: a consumer
  MUST NOT reject a corpus over unknown fields, unknown types, or records
  it cannot interpret. It reads what it understands and preserves the rest
  (the same stance the Open Knowledge Format takes).
- Validator: a tool that checks. Binds section 6 in full.

Strict producers, tolerant consumers: divergence is caught by validators
and surfaced, never by consumers refusing to read.

## 2. Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in BCP 14
(RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as
shown here.

- *record*: one atom, claim, question, or survey. Structured fields plus
  one body text.
- *corpus*: a body of work owning records; a research program, an
  engagement, a venture, or the personal corpus. The unit of
  confidentiality, and the unit the governing policies attach to (audit
  intensity, verification bars, ship gates).
- *canonical store*: the one authoritative home of a corpus's records.
  Everything else (indexes, databases, embeddings) is a *projection*:
  derived, recomputable, never authoritative.
- *capture*: the copy of a source saved when first read. Checks run
  against the capture, never the live web.
- *actor*: `human:<id>` for a person, `<producer>/<version>` for a model
  or agent, `process:<id>` for automation. Writing and confirming are
  separate acts recorded in separate fields: who wrote a record need not be
  who checked it.
- *owner*: the corpus's responsible person, per the corpus registry.
- *disposition*: the computed reading of a claim's standings (`ERF-6.5`).
  Never a stored field.

## 3. Data model (normative)

The normative data model is the file `types/erf.ts`. The TypeScript below
is an inline mirror of that file, kept in sync by hand; it omits the
file's header comments and its identifier alias definitions (`AtomId`,
`ClaimId`, `QuestionId`, `CorpusId`, `FamilyName`, `CSL`); where the two
differ, the file governs. YAML examples elsewhere are informative.
Object-shape unions are deliberately absent; the only unions are
string-literal value sets.

```ts
type EpistemicKind  = "observation" | "argument" | "bet" | "commitment";
type Stance         = "for" | "against" | "withdrawn";
type QuestionStatus = "open" | "answered" | "parked";
type Relation       = "supports" | "assumes" | "decomposes-into" | "conflicts-with";
type SourceQuality  = "high" | "medium" | "low";
type StanceCause    = "superseded-by" | "disconfirmed" | "scope-too-broad"
                    | "absorbed-into" | "no-longer-relevant" | "source-unreliable";
type Actor  = `human:${string}` | `${string}/${string}` | `process:${string}`;

interface ActorStamp   { timestamp: string; by: Actor }      // RFC 3339
interface StandingEntry { timestamp: string; stance: Stance;
                       by: `human:${string}`; why: string;   // humans only
                       cause?: StanceCause;                  // negative moves only (ERF-4.14c)
                       evidence_at_stance?: {                // what the ruler faced (ERF-4.14a)
                         atoms_for: AtomId[]; atoms_against: AtomId[] } }
interface AuditEntry { auditor: string;
                       verdict: "SUPPORTED" | "PARTIAL" | "UNSUPPORTED";
                       timestamp: string; protocol: string; accepted?: true }

interface Atom {
  id: AtomId;                  // registry prefix + number, e.g. kwg-117
  finding: string;             // one sentence: what the quote shows
  quote: string;               // verbatim from the capture; [...] marks elision
  citation_text: string;       // human-readable citation; never contains a URL
  citation?: CSL;              // canonical when present; citation_text renders from it
  fetched_url?: string;        // the locator actually retrieved; absent for received files
  source_quality: SourceQuality;
  as_of?: string;              // the date the FACT is true of
  limitations?: string;        // recorded caveat about the evidence
  created: ActorStamp;
  modified?: ActorStamp;
  finding_audit: AuditEntry[]; // judgment verdicts, recorded per auditor
}

interface Claim {
  id: ClaimId;                 // globally unique across ALL corpora
  type: "claim";
  corpus: CorpusId;            // confidentiality and policy; mutable
  title: string;               // THE claim statement (normative)
  epistemic_kind: EpistemicKind;
  created: ActorStamp;
  modified?: ActorStamp;
  handle?: string;             // compact spoken name
  families: FamilyName[];      // recorded membership for exact pulls
  atoms_for: AtomId[];
  atoms_against: AtomId[];
  surveys?: SurveyId[];        // absence/coverage backing (section 4.6)
  edges: { to: ClaimId; relation: Relation }[];
  standings: StandingEntry[];  // append-only; per-person; humans only
  backing_audit: AuditEntry[]; // does the backing carry the claim (section 4.4)
  semantic_query?: string;     // pre-authored evidence-search key; see 3.1
  body: string;                // SHOULD open by restating title; then working notes
}

interface Question {
  id: QuestionId;              // same global namespace as claims
  type: "question";
  corpus: CorpusId;
  title: string;
  status: QuestionStatus;
  created: ActorStamp;
  modified?: ActorStamp;
  families: FamilyName[];
  sub_questions: QuestionId[]; // the only structure a question carries
  answered_by: ClaimId[];      // written when status becomes answered
  body: string;
}

interface SearchAct {
  tool: string;                // the concrete instrument, named
  query: string;               // in the tool's own terms
  scope?: string;              // restriction, when one applied
  hits: string;                // yield as the instrument reported it
  timestamp?: string;          // when acts span sittings
}

interface Survey {
  id: SurveyId;                // globally unique; slug SHOULD end with the date
  type: "survey";
  corpus: CorpusId;
  title: string;               // what the survey sought
  conducted: ActorStamp;       // machine actors legal; judgment stays on claims
  searches: SearchAct[];
  notable_results: { what: string; note: string; atoms?: AtomId[] }[];
  limitations?: string;        // SHOULD when cited for absence (ERF-4.30)
  prior?: SurveyId;            // re-run linkage
  body: string;
}
```

Lists are total in the type and MAY be empty; empty lists are omitted in
serialization (section 7). Optional fields (`?`) assert existence when
present: a `citation` means structure exists, a `fetched_url` means a fetch
happened, a `modified` means an edit happened.

### 3.1 Field reference

One entry per field, grouped by record type. Each label carries the field
name, then its metadata as (type; writer; when), then the requirement ids
that constrain it. "Tool" means a producer acting under the machine role;
"either" means a tool usually drafts and a human may author or repair.

#### Atom

**`id`** (AtomId; tool; at mint)
:   Permanent identity: registry prefix plus sequence (`kwg-117`). Never
    renamed, never reused.

**`finding`** (string; tool drafts, human repairs; at mint and during fix-and-re-audit) [ERF-4.6, ERF-4.9]
:   One sentence stating what the quote shows, carrying the context
    (author, year, kind of document) that makes the atom usable away from
    its source. Audited against the quote.

**`quote`** (string; tool; at mint) [ERF-4.5]
:   Verbatim text from the capture; `[...]` marks editorial elision. The
    only content the mechanical check verifies.

**`citation_text`** (string; tool; at mint, regenerated whenever `citation` exists) [ERF-4.7, ERF-4.8]
:   Human-readable citation identifying the work; never a URL; rendered
    from `citation` when present, Chicago by default.

**`citation`** (CSL, optional; tool; at mint or at the ship-time upgrade) [ERF-4.8]
:   Structured bibliographic identity; canonical when present, carrying
    everything the rendered string shows.

**`fetched_url`** (string, optional; tool; at capture) [ERF-4.7]
:   The locator actually retrieved; absent for received files. A
    web-native work's own identity belongs in `citation.URL`, not here.

**`source_quality`** (SourceQuality; either; at mint) [ERF-4.8a]
:   The source situation only, assessed by three questions at minting:
    who wrote it and what is their interest (first-party or regulator
    material versus a vendor describing its product); how far from
    primary (direct capture, one-hop secondary, or a relay of a relay);
    and was the primary captured (an unpulled chain is `low` regardless
    of how good it sounds). Not audit state, not capture fidelity. The
    value vocabulary (high, medium, low) is under review pending
    source-typology research.

**`as_of`** (date, optional; either; at mint)
:   The date the fact is true of, distinct from when it was recorded.
    Dated statistics carry it; timeless statements omit it.

**`limitations`** (string, optional; either; at mint or when a caveat emerges)
:   The recorded caveat about the evidence: chain quality, capture blocks,
    scope warnings, accepted-PARTIAL notes.

**`created`** (ActorStamp; tool; at creation)
:   When, and which actor, created the record.

**`modified`** (ActorStamp, optional; tool; at any later substantive edit) [ERF-6.10]
:   Last edit and its actor; staleness comparisons derive from it.

**`finding_audit`** (AuditEntry list; tool; after each audit run) [ERF-4.9]
:   The recorded judgments that the quote supports the finding, one entry
    per auditor per run.

#### Claim

**`id`** (ClaimId; either; at mint) [ERF-4.11]
:   Globally unique slug; encodes no location; survives corpus moves
    unchanged.

**`type`** (the literal `claim`; tool; at mint) [ERF-7.2]
:   Self-description.

**`corpus`** (CorpusId; tool writes, a human directs changes; at mint and on promotion or transfer) [ERF-4.12]
:   The registered body of work holding the claim: the unit of
    confidentiality, and the unit its governing policies attach to.

**`title`** (string; human-owned, machine may draft; at mint, revised wherever the author reviews rendered documents) [ERF-4.13]
:   The claim statement, normative: one complete assertion readable as
    true or false on its own.

**`epistemic_kind`** (Kind; either; at mint, refined when the claim enters a cut) [ERF-4.19, ERF-6.11]
:   What would check the claim (section 5); sets the backing contract the
    validator and the backing audit apply.

**`created`**, **`modified`** (ActorStamp; tool; as on the atom)
:   As on the atom.

**`handle`** (string, optional; human; at cut entry)
:   Compact spoken name: the title states the claim, the handle names it.

**`families`** (FamilyName list; tool proposes, human rules; at mint and at reconciliation)
:   Recorded topic-family membership: what makes "pull the demand claims"
    an exact, repeatable set. Search proposes members; the family records
    the decision.

**`atoms_for`**, **`atoms_against`** (AtomId lists; tool proposes, human admits; as evidence lands) [ERF-4.17]
:   Evidence in both directions on this one claim.

**`surveys`** (SurveyId list, optional; tool proposes, human admits; as coverage lands) [ERF-4.21, ERF-4.30]
:   The survey records an absence or coverage reading rests on; one
    list, no against side (section 4.6).

**`edges`** (list of `{to, rel}`; tool proposes, human rules; during composition and challenge) [ERF-6.6]
:   The claim's typed relations (section 5); an argument's structure lives
    here, not in its body.

**`standings`** (Standing list; tool writes entries, only humans appear in `by`; at each stance) [ERF-4.14, ERF-4.15]
:   The append-only doxastic ledger.

**`backing_audit`** (AuditEntry list; tool; change-triggered) [ERF-4.19, ERF-4.20]
:   Recorded judgments that the backing, taken together, carries the
    statement.

**`semantic_query`** (string, optional; tool drafts, freely regenerated; at mint or at need)
:   A pre-authored search key, written in the source domain's vocabulary
    rather than the claim's own compressed prose, used to query indexed
    material for evidence that could back or cut against the claim. Exists
    because measured retrieval over claim prose fails: the definitive
    source for one claim ranked 16th under the claim's own wording and 1st
    under a domain-vocabulary query. Exempt from the prose standard by
    construction; read by machines only.

**`body`** (string; human, the one operator-authored text; freely) [ERF-4.13]
:   The statement restated, then working notes. In a database, one more
    field.

#### Question

Shares `id`, `type`, `corpus`, `title`, `created`, `modified`, and
`families` with the claim; plus:

**`status`** (Status; a human directs, a tool writes; at lifecycle moves) [ERF-4.23]
:   The whole lifecycle: `open`, `answered`, `parked`; questions carry no
    ledger.

**`sub_questions`** (QuestionId list; either; during decomposition) [ERF-4.22]
:   The only structure a question carries.

**`answered_by`** (ClaimId list, optional; tool; when status becomes answered) [ERF-4.23]
:   The claims that settled it.

**`body`** (string; human; freely)
:   The question elaborated.

#### Survey

**`id`** (SurveyId; tool; at mint) [ERF-4.29]
:   Globally unique slug; SHOULD end with the conducted date, since a
    re-run of the same sought is a new record.

**`type`** (the literal `survey`; tool; at mint) [ERF-7.2]
:   Self-description.

**`corpus`** (CorpusId; tool writes, a human directs changes; at mint and on transfer)
:   As on the claim: confidentiality and governing policy, never namespace
    or meaning.

**`title`** (string; either; at mint)
:   What the survey sought, stated as one phrase or question.

**`conducted`** (ActorStamp; tool; at the search) [ERF-4.29]
:   When, and which actor, conducted the search. Machine actors are legal
    here: searching is machine work, and judgment stays on the citing
    claim.

**`searches`** (SearchAct list; tool; at the search) [ERF-4.27, ERF-4.28]
:   The acts, one or more, each self-contained: instrument, query,
    restriction, yield.

**`notable_results`** (list of `{what, note, atoms?}`; either; at the search and as atoms mint) [ERF-4.28]
:   The curated subset worth recording; entries mint atoms when a hit
    deserves quoting.

**`limitations`** (string, optional; either; at the search) [ERF-4.30]
:   What the acts did not cover and how deeply hits were inspected;
    absent for a complete search of a closed corpus.

**`prior`** (SurveyId, optional; tool; at a re-run) [ERF-4.29]
:   The predecessor record when the same sought is searched again; the
    chain staleness computations walk.

**`body`** (string; either; freely)
:   The search narrated: method, yield, and reading.

#### Search act

**`tool`** (string; tool; at the act) [ERF-4.27]
:   The concrete instrument, named: which search engine, which database,
    which index, which script. Never a category.

**`query`** (string; tool; at the act) [ERF-4.27]
:   The query in the instrument's own terms; for a manual review, the
    universe inspected.

**`scope`** (string, optional; tool; at the act)
:   The restriction where one applied: site filter, date range, corpus
    slice, inspection depth.

**`hits`** (string; tool; at the act) [ERF-4.28]
:   The yield as the instrument reported it; text, because reported
    precision varies by instrument.

**`timestamp`** (RFC 3339, optional; tool; at the act)
:   When this act ran, for a survey spanning sittings; defaults to the
    survey's `conducted` timestamp.

#### Standing entry

**`timestamp`** (RFC 3339 with time of day; tool; at the stance) [ERF-4.14]
:   Same-day entries must order.

**`stance`** (Stance; a human decides, a tool writes; at the stance)
:   `for`, `against`, or `withdrawn` (section 5).

**`by`** (`human:<id>`; tool-written, names the person; at the stance) [ERF-4.15]
:   Only people take stances.

**`why`** (string, required; human; at the stance) [ERF-4.14]
:   The reason. An entry without one is a toggle, not a judgment.

**`cause`** (StanceCause, optional; human; on `against` and `withdrawn` only) [ERF-4.14c]
:   The queryable classification of a negative move; `why` remains the
    sentence.

**`evidence_at_stance`** (id sets; tool, a SHOULD; at the stance) [ERF-4.14a]
:   The evidence attached at ruling time, by id.

#### Audit entry

**`auditor`** (string; tool; at the run)
:   The model that rendered the verdict: a hosted identity whose weights
    drift under a stable name; read together with `protocol`.

**`verdict`** (enum; the auditor's output; at the run)
:   `SUPPORTED`, `PARTIAL`, or `UNSUPPORTED`.

**`timestamp`** (RFC 3339; tool; at the run)
:   When the verdict was rendered.

**`protocol`** (string; tool; at the run)
:   The versioned procedure that produced the verdict; verdicts under
    different protocols are not comparable.

**`accepted`** (the literal `true`, optional; human; at the ruling)
:   The operator's ruling that a PARTIAL stands as recorded (the
    disagreement is placement of a caveat, not substance).

How records are found: atoms are retrieved by embedding `finding` and
`quote`. The finding is written to be checkable away from its source,
which makes it the intended embedding target (this retrieval path is what
replaced atom tags). Claims are retrieved by `semantic_query`. The
mint-time evidence sweep runs a claim's `semantic_query` against the atom
index and the source and library indexes, in both directions: candidates
for `atoms_for` and `atoms_against` alike.

### 3.2 Naming conventions

Five rules govern every name in this model, present and future:

1. Field names are `snake_case` in YAML and in the TypeScript interfaces
   alike. This is a stated deviation from TypeScript idiom: serialization
   fidelity outranks style, and every example stays copy-pasteable
   between the spec and a file.
2. Type aliases are PascalCase and self-sufficient out of context:
   `EpistemicKind`, not `Kind`; `QuestionStatus`, not `Status`.
   SCREAMING_SNAKE is not used; in TypeScript it denotes constant values.
3. Types that populate an in-record list are suffixed `-Entry`
   (`StandingEntry`, `AuditEntry`) or name the event one line records
   (`SearchAct`): either way the name separates a record from a line
   within one.
4. The compound-reading test: every `field: TypeName` pair must read as
   spoken English (`created: ActorStamp` passes; `modified: Provenance`
   failed it and was renamed).
5. One meaning per word, checked against the glossary at naming time. The
   registered failure: the atom field once named `source` collided with
   the glossary's source (the captured document) and became
   `citation_text`.

## 4. Record types

### 4.1 The source

- **ERF-4.1** A capture MUST exist before any check runs against a source;
  checks MUST run against the capture, never the live web. A dead link
  weakens provenance; it never breaks a check.
- **ERF-4.2** A source SHOULD be captured when first read. Legacy material
  is captured the next time it is read or used, and its atoms minted then;
  a corpus MUST NOT be retrofitted wholesale.
- **ERF-4.3** A received file (report, transcript) is immutable: it MUST be
  retained as received, and a revision arriving later MUST be a new source,
  never an overwrite. A web page is mutable: its capture MUST be dated.
- **ERF-4.4** The capture's location MUST be recorded in a per-corpus
  mapping (atom id to capture), not on the atom. The fetch date lives with
  the capture.

### 4.2 The atom

One piece of evidence: a verbatim quote, a finding, and the trail.

```yaml
- id: kwg-117
  finding: "Pacioli's 1494 treatise states the double-entry rule
    explicitly: every ledger entry is made twice, once as a debit
    and once as a credit."
  quote: "All entries made in the ledger have to be double entries --
    that is, if you make one creditor, you must make some one debtor."
  citation_text: "Luca Pacioli, Particularis de Computis et Scripturis
    (Venice, 1494), ch. 36, trans. Geijsbeek 1914"
  citation:
    type: book
    author: [{family: Pacioli, given: Luca}]
    title: "Particularis de Computis et Scripturis"
    issued: 1494
    translator: [{family: Geijsbeek, given: John B.}]
  fetched_url: "https://archive.org/details/ancientdoubleent00geij"
  source_quality: high
  created: {timestamp: 2026-07-19, by: "agent/claude-fable-5"}
  finding_audit:
    - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: 2026-07-19,
       protocol: finding-audit-v2}
    - {auditor: gemini-3.5-flash, verdict: SUPPORTED, timestamp: 2026-07-19,
       protocol: finding-audit-v2}
```

- **ERF-4.5** The `quote` MUST be verbatim from the capture. Editorial
  elision MUST be written `[...]`; bare `...` is reserved for dots the
  source itself contains.
- **ERF-4.6** The `finding` MUST be one sentence stating what the quote
  shows. It is not the quote restated: it may name the author, the year,
  the kind of document, and name what the quote exhibits. That context is
  what makes an atom usable away from its source, and why the finding is
  audited against the quote rather than assumed correct.
- **ERF-4.7** `citation_text` MUST NOT contain a URL. A citation identifies a
  work; a locator retrieves one copy. The retrieved locator is
  `fetched_url`; a web-native work's own identity MAY appear as
  `citation.URL`.
- **ERF-4.8** When `citation` is present it is canonical: it MUST carry
  everything the rendered `citation_text` string shows (chapter, translator,
  edition included), and `citation_text` MUST be rendered from it. Default
  rendering style is Chicago (via CSL); a deliverable MAY override. A
  `locator` (page, section, timestamp) MAY pin the evidence inside a long
  source. Hand-written `citation_text` strings SHOULD follow "Author, Title
  (venue, year), locator when it matters"; the upgrade path to exactness
  is the citation block.
- **ERF-4.8a** `source_quality` MUST grade one axis only, the source
  situation: `high`, a captured primary or first-party material; `medium`,
  secondary, vendor self-report, or one-hop relay; `low`, a relay chain
  not yet pulled to primary. It MUST NOT encode audit state (that is
  `finding_audit`'s record) or capture fidelity (that is the mechanical
  check's derived result); a consumer wanting a combined trust signal
  computes it from the three at read time.
- **ERF-4.9** The mechanical check (the normalized quote occurs in the
  capture) is recomputable by anyone holding the corpus and its captures,
  so its result MUST NOT be stored. The judgment (does the quote, in
  context, support the finding?) is not recomputable: it MUST be recorded
  per auditor in `finding_audit`, with the protocol version that produced
  it. What a verdict clears (which auditors, whether an LLM's verdict
  counts) is policy the corpus owner sets, not a rule of the format.
- **ERF-4.10** An atom MUST NOT carry a topic field.

> *Note (non-normative):* on `ERF-4.8a`: earlier operational anchors baked
> dual-auditor confirmation into the tiers; that conflation is
> retired. Each axis is recorded in its own home and composed at read
> time, never pre-mixed.

> *Note (non-normative):* on `ERF-4.10`: an atom-tag field rotted
> measurably (201 distinct values on 146 atoms) and was dropped; retrieval
> over finding, quote, and citation covers the pulls. The caveat field is
> named `limitations`, not "warrant": in Toulmin's vocabulary a warrant is
> the license from evidence to claim, the opposite role, and the borrowed
> name guaranteed misreading by trained readers.

> *Note (non-normative):* writing the records well. The schema checks
> structure; it cannot check craft. A good finding is one complete
> assertion a stranger could check: it names the actor and the time scope,
> and it hedges exactly as hard as the source does ("states," not
> "proves"). A good claim statement reads as true-or-false standing alone:
> if a reader cannot disagree with the sentence, it is not a claim yet.
> Compression is a defect in both; the redundancy that makes a statement
> checkable away from its context is the point, not padding.

### 4.3 The claim

A statement that can be true or false, one a person could stand behind or
dispute. One record per claim. The record carries the proposition; who
actually stands where is recorded in `standings` (a claim with no stances is
a proposal, and a claim may be tracked without anyone standing behind it);
what the evidence says is recorded in `atoms_for` and `atoms_against`.
Evidence against a claim weakens its position, never its identity: it is the
same statement, standing in a worse light.

```yaml
---
id: citators-disagree-on-negative-treatment
type: claim
corpus: knowledge-work-governance
title: "The major legal citators disagree substantially on identifying
  negative treatment, and the leading vendor defense is that no
  objectively correct interpretation exists"
epistemic_kind: observation
created: {timestamp: 2026-08-22, by: "agent/claude-fable-5"}
families: [prior-art]
atoms_for: [kwg-014, kwg-015, kwg-016]
---
The major legal citators disagree substantially on identifying negative
treatment, and the leading vendor defense is that no objectively correct
interpretation exists.

## Working notes
...
```

The example ships as a proposal: no one has stood behind it, so its
`standings` ledger is empty and therefore omitted from the file (ERF-7.4),
and its computed disposition is *proposal*. When someone does stand, the
first entry appends under `standings` with a full timestamp, a stance
(`for`, `against`, or `withdrawn`), a `human:` actor, and a written `why`;
the requirements below govern that ledger. The spec invents no standing
entries in its examples: a stance is a real person's recorded judgment,
and there is none to show yet.

- **ERF-4.11** `id` MUST be unique across all corpora (one global
  namespace). References are bare ids and MUST NOT encode location: a
  claim moved between corpora keeps its id and no reference changes.
- **ERF-4.12** `corpus` MUST be written on every claim and MUST name a
  registered corpus. Changing it is a promotion or transfer; the change
  SHOULD be accompanied by a standing entry recording why.
- **ERF-4.13** `title` MUST state the claim; it is the normative
  statement. The body SHOULD open by restating it; the validator compares
  the two (`ERF-6.9`).
- **ERF-4.14** `standings` is append-only: entries MUST NOT be edited or
  deleted; a correction is a new entry. Each entry MUST carry a full
  timestamp (same-day entries must order), a stance, and a non-empty
  `why`: an entry without a reason is a toggle, not a judgment.
- **ERF-4.14a** Producer tools SHOULD stamp each standing entry with the
  evidence sets attached at ruling time, by id
  (`evidence_at_stance: {atoms_for: [ids], atoms_against: [ids]}`). This
  is the one non-recomputable fact about the ruling's context: attachment
  events are recorded nowhere, so which evidence the ruler faced cannot be
  derived later, while content drift (an atom modified after the stance)
  and audit drift (verdicts newer than the stance) are derivable from
  existing timestamps and MUST NOT be stored here. Counts are not an
  acceptable digest: swapping one atom for another leaves a count
  unchanged and hides exactly the staleness this field exists to expose.
- **ERF-4.14c** A standing entry whose stance is `against` or
  `withdrawn` MAY carry a typed `cause` from a closed list:
  `superseded-by`, `disconfirmed`, `scope-too-broad`, `absorbed-into`,
  `no-longer-relevant`, `source-unreliable`. `why` remains required
  regardless: `cause` is the queryable classification, `why` the human
  sentence.
- **ERF-4.15** A standing's `by` MUST be a `human:` actor. An LLM may
  propose a claim; only a person takes a stance. A stance speaks for one
  person only; endorsement by one person or by five is the same act,
  recorded the same way.
- **ERF-4.16** A claim MUST NOT store a state field: the disposition is
  computed (`ERF-6.5`). Minting is not a standing: a claim is born with
  none, and a claim nobody has taken a stance on is a proposal. The origin
  story belongs in working notes; origin that carries evidential weight is
  a source: capture it and cite atoms.
- **ERF-4.17** Evidence MUST live on the claim, in both directions:
  `atoms_for` and `atoms_against`. Evidence against a claim MUST NOT be
  modeled as a rival claim.
- **ERF-4.18** For a bet, the `for` entry that backs it SHOULD record
  the decision it licenses in its `why`, and the `withdrawn` entry that
  ends it SHOULD state the outcome in its `why`.

> *Note (non-normative):* on `ERF-4.14a`: the normalized alternative,
> attachment timestamps on evidence entries, supersedes this field if the
> deferred per-attachment evidence shape ever lands; the two share one
> migration.

> *Note (non-normative):* practice around `ERF-4.14`: dispositive stances
> (anything that activates or contests) go through the show-both-sides
> flow individually; the cold-reader audit applies to standings too (does
> the recorded why survive the evidence on record?). A batch-size stamp
> was considered and rejected: "batch" has no enforceable boundary, and
> ruling mechanics do not belong in a record format.

> *Note (non-normative):* on `ERF-4.14c`, provisional; vocabulary under
> review. Modeled on Wikidata's P2241, where typed reasons exist only for
> the negative move: the reason you stand is the claim's own backing. The
> list grows only under subtraction pressure. `ERF-4.14b` was retired
> before this id was assigned; per change control, retired ids are not
> reused.

> *Note (non-normative):* on `ERF-4.18`: a structured settlement
> vocabulary is deferred; zero settled bets exist, and typing one forces
> an object-shape union.

### 4.4 The backing audit

The atom's checks stop at the finding. Whether a claim's atoms, taken
together, actually support its statement is a further judgment, recorded in
`backing_audit` with the same entry shape as `finding_audit`.

- **ERF-4.19** The backing audit MUST ask the question the epistemic kind
  sets, because the kind is the backing contract. For an `observation`: do
  the `atoms_for`, each already checked at the atom level, jointly entail
  the statement, and do the `atoms_against` undermine it? For an
  `argument`: granting the claims its edges name, does the conclusion
  follow? `bet` and `commitment` owe no backing, so they have nothing to
  audit; auditability is computable from the kind.
- **ERF-4.20** The backing audit MUST be triggered by change, not run as a
  standing process: an atom added to either list, a cited atom modified,
  the statement edited. Staleness is computed (`ERF-6.10`); between
  changes there is nothing to re-run.
- **ERF-4.21** A verdict on a multi-atom claim SHOULD name the atoms that
  carried the weight: joint entailment is a weaker judgment than the
  atom's one-quote-one-sentence check. No set of atoms proves a universal
  negative: on a claim of the form "no shipped tool does X," the atoms
  evidence the coverage of a survey, not the absence itself; the audit
  checks the statement is scoped to what its evidence can carry, and
  SUPPORTED on such a claim means supported as scoped, never proof. Such
  a claim SHOULD cite the survey records whose coverage it rests on
  (`surveys`, section 4.6) rather than atoms alone: atoms can only quote
  what exists.

> *Note (non-normative):* on the word "jury". A cross-vendor model jury
> diversifies judgment; it does not make verdicts independent in the
> statistical sense. Models trained on overlapping corpora share failure
> modes, and two SUPPORTED verdicts can be one correlated error wearing
> two names. The jury exists to reduce single-model idiosyncrasy, and its
> verdicts are recorded hypotheses, not proof; that is why the format
> keeps human review at the point of consequence, and why an auditor's
> identity (a hosted model id whose weights drift under a stable name) is
> recorded together with a protocol version rather than trusted alone.

> *Note (non-normative):* where the bar lives. Verification intensity is
> corpus policy, not format. The record carries verdicts whatever the
> policy; each corpus declares its audit policy (which auditors, what
> clears) in the corpus registry, and may raise or lower it as models
> change without any record changing shape. The format's own line is the
> ship gate (`ERF-6.13`): consequence, not minting, is where verification
> concentrates.

### 4.5 The question

A question asserts nothing; it is a sibling record, not a claim.

```yaml
---
id: demand-engine-open
type: question
corpus: venture-design
title: "What is the demand engine underneath the ramp?"
status: open
created: {timestamp: 2026-08-05, by: "agent/claude-fable-5"}
families: [demand]
---
Which mechanisms convert positioning into a steady flow of engagements?
```

- **ERF-4.22** A question MUST NOT carry an epistemic kind, standings,
  evidence fields, or edges. Its lifecycle is `status`; its only structure
  is `sub_questions`.
- **ERF-4.23** When `status` becomes `answered`, `answered_by` MUST name
  the answering claim(s). Questions carry no ledger; their history lives
  with the substrate (section 8).

### 4.6 The survey

A record of search acts and their yield: what was sought, where, with what
queries, and what came back. A survey is neutral as to polarity: the same
record backs an absence reading (zero yield across the acts), a sparseness
reading, or a density reading (the ground is well covered), and the citing
claim decides the use. The asymmetry with atoms is the design: absence and
coverage are evidenced by surveys; presence is evidenced by atoms. A survey
cannot disconfirm a gap claim, because what disconfirms it is a found
source, and a found source is atom-shaped; that is why a claim carries one
`surveys` list and no against side.

```yaml
---
id: granted-flag-uses-2026-08-22
type: survey
corpus: knowledge-work-governance
title: "Current uses of the granted field across the seven registered
  corpora"
conducted: {timestamp: 2026-08-22, by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rnE (BSD grep, macOS)"
    query: "^granted:|^  granted:"
    scope: "all *.md under the seven registered corpus [private claims dir]/ homes;
      305 claim and question files"
    hits: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "granted (word-level, --include=*.md)"
    scope: "same seven [private claims dir]/ homes"
    hits: "4 lines in 3 files; none a field use"
notable_results:
  - what: "The claims-tree doc-class granted dimension"
    note: "A render-layer field of one document class, documented in an
      internal corpus; the word's nearest live relative, not a record
      field."
---
```

- **ERF-4.27** Each search act MUST name its concrete instrument in
  `tool` and its `query` in that instrument's own terms: a search string,
  a database query, a semantic prompt, or, for a manual review, the
  universe inspected. A category ("web search") without the instrument
  does not satisfy this; yields are comparable only where instruments are
  named.
- **ERF-4.28** `hits` MUST record each act's yield as the instrument
  reported it, as text ("0", "3", "~120 reported, two pages inspected"); a
  record MUST NOT state precision the instrument did not give.
  `notable_results` is the curated subset worth keeping (near-misses with
  why they fall short, exemplars with why they matter); entries mint atoms
  when a hit deserves quoting, and the full yield stays in the acts.
- **ERF-4.29** A survey MUST be an immutable record of a conducted
  search: a re-run of the same sought is a new record, SHOULD name its
  predecessor in `prior`, and its id SHOULD end with the conducted date.
  Staleness of a claim's survey backing is computed from `conducted`
  timestamps, never stored; how often a fruitful survey re-runs is
  pipeline policy, not format.
- **ERF-4.30** A survey cited by a claim asserting absence or sparseness
  SHOULD carry `limitations`: what the acts did not cover and how deeply
  hits were inspected. A complete search of a closed corpus correctly
  carries none.

> *Note (non-normative):* the weight of an empty search is the relation
> between the universe searched and the universe the claim is about. A
> world-claim over the world's indexes (web, preprint servers, patent
> databases): absence is real, defeasible, decaying evidence. A
> world-claim over a private sample (a curated thousand-volume library):
> absence is nearly no evidence; the sample says something about its
> curation, nothing about the world; record such an act as color, in
> `limitations`. A closed-corpus claim with a complete search of that
> corpus: absence is conclusive, and there are no limitations to state.
> The same relation, read from the other side, is why `conducted` admits
> machine actors: searching is machine work, and the judgment that the
> coverage carries the claim stays where judgment lives, in the citing
> claim's standings and its backing audit.

> *Note (non-normative):* references are global ids, so a claim MAY cite
> a survey in another corpus; the classification wall (`ERF-6.8`) applies
> to surveys exactly as to atoms.

### 4.7 The narrative and its bindings

A narrative is a document written for people: an essay, a brief, a memo.
Prose alone has a problem: assertions live inside sentences, so nothing
marks what a passage commits to; the writer re-derives old reasoning;
readers argue with impressions; and when the thinking underneath changes,
the prose keeps saying what it said.

- **ERF-4.24** A narrative in this format MUST comprise two documents,
  tied together: the *narrative document* (the prose, authored by a
  person, never generated) and the *claims-tree document* (the same
  argument as a structured list of the claims it rests on, compiled from
  the claim records). The prose persuades; the claims-tree is what a
  collaborator disputes line by line and what the checks run against.
- **ERF-4.25** A passage that asserts something SHOULD end with a binding:
  a marker naming the claims it rests on plus a few exact words from the
  passage, so software can find the spot after edits. In the reference
  implementation the marker is an HTML comment, invisible in every render:

```markdown
<!-- claims: no-continuous-claim-check "no test that runs on claims" -->
```

- **ERF-4.26** Bindings MUST be checkable: a validator flags a passage
  whose claims changed since the binding was made, and a reader can walk
  from a sentence to the claims, atoms, quotes, and sources beneath it.

### 4.8 The personal corpus

One corpus belongs to the author: the doxastic register. Claims there on
which the owner currently stands are the author's standing positions.
"Conviction" and "insight" are readings, not record types: an insight leans
`observation` or `argument` (world-facing, distilled from experience,
overturnable by evidence); a conviction spans the kinds (a seasoned
argument, an enforced commitment, a standing bet). How settled a position
is stays readable rather than stored: tenure, the standings it survived,
the evidence accumulated. The intake pipeline has three stations: a field
note (pre-claim material, deliberately schema-free), a proposed claim
distilled from it, and the author's first `for` entry. Promotion from a
working corpus into the personal corpus is a corpus change with a standing
entry recording why.

## 5. Vocabularies

Closed sets. A value outside them is a validation failure, not a dialect.
The kinds, stances, statuses, relations, and confidence tiers are listed in
section 3; their meanings:

Epistemic kinds answer one question: what would check this claim?

- `observation`: data or research settles it; owes atoms.
- `argument`: reasoning settles it; owes edges to the claims it follows
  from. Its structure is the graph: premises are claims of any kind;
  chains terminate per `ERF-6.6`.
- `bet`: relied on, not established; the world will settle it.
- `commitment`: chosen conduct, will be enforced; the author's decision
  is the backing.

> *Note (non-normative):* kinds vary the validation contract, never the
> record shape; a kind demanding its own shape is a record type announcing
> itself (that is how questions left the enum). Two candidates were
> retired by the same test: "inference" named how a claim was produced,
> not what would check it; "preference" logged zero uses in 279 typed
> claims, and every taste decomposes (enforced taste is a commitment;
> self-reported taste is an observation about oneself).

Stances: `for`, `against`, `withdrawn` (exit, dated, never a
deletion).

Question status: `open`, `answered`, `parked`.

Relations, each stated subject-first, the subject being the claim that
carries the edge:

- `supports`: this claim argues for the target.
- `assumes`: this claim depends on the target being true.
- `decomposes-into`: the target is one part of this claim.
- `conflicts-with`: mutual tension; both stand; stored once, the
  reciprocal derived.

> *Note (non-normative):* the ceiling of four was reached by subtraction:
> `implies` was `assumes` written backwards; `refutes` had zero uses
> because counter-evidence lives on the claim; `answers` died with an
> earlier modeling of questions. Prior art goes the other way (CiTO
> defines forty citation relations); the working experience is that small
> vocabularies get used and large ones get skipped.

Confidence (the atom's source situation; one axis, `ERF-4.8a`): `high`, a
captured primary or first-party source; `medium`, fetch-time extraction,
vendor self-report, or one-hop secondary; `low`, a relay not yet
primary-pulled. Audit state and capture fidelity are recorded elsewhere
and never folded in. Operational meaning: read the lows and mediums
harder.

Dispositions are not a stored vocabulary; see `ERF-6.5`.

## 6. Invariants (the validator)

All machine-checkable. Types express what types can express; the validator
checks the relations no type can see.

- **ERF-6.1** Every reference MUST resolve: atoms in their registries,
  claims, questions, and surveys in the global namespace; `atoms_for`,
  `atoms_against`, `edges.to`, `sub_questions`, `answered_by`, and
  `surveys` name existing records.
- **ERF-6.2** Claim and question ids MUST be unique across all corpora.
- **ERF-6.3** Every standing entry MUST have a `human:` actor and a
  non-empty `why`.
- **ERF-6.4** Standings MUST be append-only; an edit or deletion of an
  existing entry is a violation, verified against the substrate's history.
- **ERF-6.5** Disposition MUST be computed, never stored: no standings
  means proposal; current stances (each person's newest) on both sides
  means contested; otherwise the owner's newest stance governs (`for`:
  active; `withdrawn`: retired). Which standings a *use* requires (a ship
  gate, a team policy) is corpus or doc-class policy, not format.
- **ERF-6.6** An argument's transitive `assumes` and `supports` closure
  MUST terminate in non-argument leaves, none of them withdrawn by their
  owner. Self-edges MUST NOT exist; `assumes` and `decomposes-into` MUST
  admit no cycles.
- **ERF-6.7** `conflicts-with` MUST be stored once per pair.
- **ERF-6.8** A claim in a public corpus MUST NOT reference records
  (edges or evidence) in a confidential corpus. Confidential may cite
  public; never the reverse. Classification per the corpus registry.
- **ERF-6.9** `title` and the body's opening statement MUST agree.
- **ERF-6.10** Staleness MUST be computed, never stored: a
  `finding_audit`, `backing_audit`, or binding older than the last change
  to what it judged is flagged stale.
- **ERF-6.11** A validator MUST flag as unbacked an `observation` someone
  stands on with empty `atoms_for` and empty `surveys`, and such an
  `argument` with no edges (the computed warning a render shows).
- **ERF-6.12** The mechanical quote check (the normalized quote occurs in
  the capture) MUST be re-runnable by anyone holding the corpus and its
  captures; it MUST run as a gate at minting and after any transform that
  moves atoms between homes.
- **ERF-6.13** A deliverable MUST NOT rest on atoms that are unaudited or
  audit-doubted under the corpus's declared audit policy. Verification
  state is recorded on records, the bar is policy, and this ship gate is
  where the two meet.
> *Note (non-normative):* on default lenses: tools are advised to return
> claims whose disposition is active unless a wider lens (proposals,
> contested, retired) is explicitly requested, so consumers of one corpus
> share a worldview (modeled on Wikidata's best-rank default). This was
> requirement `ERF-6.14` until 2026-08-22, retired as consumer mechanics
> rather than record format; the id is not reused.

## 7. Serialization

- **ERF-7.1** The canonical interchange form MUST be the textual record:
  YAML frontmatter plus markdown body for claims and questions; YAML
  entries in a registry document for atoms. A conforming store MUST
  round-trip records through this form without loss.
- **ERF-7.2** Files MUST self-describe: `type` and `corpus` are always
  written on claim, question, and survey records, and no meaning lives
  in a path.
- **ERF-7.3** A collection document (an atom registry) MUST declare its
  registry id and entry type in its own header; entries inherit both, and
  the same atom serialized standalone materializes `type: atom`.
- **ERF-7.4** Empty lists MUST be omitted: a field's absence means none.
  Unknown keys are errors, not passengers.
- **ERF-7.5** The event-time key MUST be `timestamp`, everywhere.
- **ERF-7.6** Actor ids MUST follow the attribution convention of
  section 2; writing and confirming are separate acts in separate fields.
- **ERF-7.7** A corpus manifest MUST carry the `spec_version` its records
  conform to; migrations between versions are explicit.

> *Note (non-normative):* on `ERF-7.5`: `on` is a YAML 1.1 boolean; the
> key round-tripped as `True` through standard parsers and was renamed
> after the landmine fired.

## 8. Substrate conformance

- **ERF-8.1** A corpus MUST have exactly one canonical store. Every
  index, database, or embedding built over it is a projection:
  recomputable, never consulted as truth.
- **ERF-8.2** A substrate MAY be anything that preserves records, ids,
  attribution, and an edit history sufficient to verify `ERF-6.4`. Files
  in git are the reference implementation (history and diffing for free);
  a record's body is one more field in a database.
- **ERF-8.3** A deployment MUST keep a corpus registry: corpus id, home,
  classification, purpose. A corpus travels as a directory or archive of
  its records and captures; a sensitive corpus MAY publish a redacted cut
  through the same machinery.

## 9. Deliverables

A format without these stays an essay:

- a validator implementing section 6, one installable tool;
- worked examples: a small set of real records from a working corpus, one
  per record type, not invented;
- a compatibility appendix mapping these fields onto the Open Knowledge
  Format, where a claim's standings and a document's lifecycle status
  remain two separate things.

## Versioning and change control

- The `schema_version` on a corpus manifest governs the semantics of that
  corpus's records; migrations between schema versions are explicit,
  never inferred from field absence.
- The specification amends itself by its own discipline: a field is
  admitted only on a forcing instance (a real corpus demanding it), a
  vocabulary value only when it carries a distinct contract, and every
  retirement is recorded with the measurement that decided it.
- Requirement ids are stable once published: insertions use letter
  suffixes (`ERF-4.8a`), retired ids are never reused, and every change
  lands in `CHANGELOG.md` with a date.

## Related formats (non-normative)

The full survey and the format's design history (what was tried, measured,
and retired) are in the companion document `DESIGN-HISTORY.md`. The
summary:

- Carneades (argumentation theory): pro/con evidence on one statement
  under graded proof standards, the nearest formal precedent to
  `atoms_for` and `atoms_against` with confidence tiers; no capture
  discipline, no ledger, no practitioner serialization.
- Nanopublications: the assertion/provenance/pubinfo split is this
  format's separation of statement, evidence, and record metadata; Trusty
  URIs solve immutability cryptographically. RDF at institutional scale;
  no standing concept.
- SEPIO (ClinGen): evidence explicitly for and against one assertion,
  with evidence lines as arguments, the closest claim model; OWL-locked,
  no doxastic layer.
- Discourse Graphs: Question/Claim/Evidence nodes with supports and
  opposes relations, the nearest overall shape; one flat claim kind, no
  capture checking, no standings, tool-native rather than git-native.
- Wikidata: statement ranks with query-engine semantics and a controlled
  vocabulary of deprecation reasons (P2241), the deployed precedent for
  typed standing-change reasons; a single anonymous consensus value, not
  a per-person ledger.
- Guru: dated, reasoned, expiring card verification that gates AI
  retrieval, the closest shipped standing analog; card granularity, no
  claim typing, no both-sides evidence.
- ADR/MADR: one markdown record per decision in git with non-destructive
  supersession, the substrate sibling; no evidentiary or standing
  machinery.

Full citations for every system named above are in the informative
references; the survey itself is in the design-history companion (its
captured sources remain in the author's corpus; captures do not travel,
per the security considerations below).

Two elements of this format appear in none of the surveyed systems: the
standings ledger (append-only, per-person, reasoned, human-only, with
dispositions computed), and the evidence primitive of a verbatim quote
checked against an immutable captured copy. One imported caution: CiTO's
forty typed citation relations failed of manual-annotation burden; this
format's four relations rely on machine proposal with human ruling to stay
below that threshold.

## Security and privacy considerations

- Classification is edge-checked. Each corpus carries a classification in
  the registry, and the reference direction is constrained: a record in a
  public corpus MUST NOT reference a record in a confidential corpus (the
  reverse is permitted). A compiled public document leaning on
  confidential material is a leak at build time; the validator's wall
  check (section 6) exists for this.
- Captures do not travel. Captured copies of sources are, in general,
  copyrighted third-party works. They MUST NOT be redistributed with a
  shared or published corpus. The honest scope of re-checkability is
  therefore per-holder, not per-corpus: anyone holding the corpus *and
  its captures* can re-run the mechanical check; a recipient of the
  records alone holds citations and fetch locators, not proof.
- Standings are personal data. The ledger is, by design, a dated record
  of named people's positions with their reasons. Taking a stance is
  consenting to that record within the corpus; *publishing* a corpus is a
  separate act and SHOULD pass a redaction review of its standings and
  their whys before any cut leaves the owner's control.
- Process provenance is the leak-prone layer. Working notes and origin
  stories carry internal context by design. Public cuts exclude working
  notes by default; the record's epistemic fields are what travel.

## References

### Normative

- Open Knowledge Format v0.2: github.com/GoogleCloudPlatform/knowledge-catalog, `okf/SPEC.md`
- Citation Style Language (CSL) and CSL-JSON: citationstyles.org
- RFC 3339, *Date and Time on the Internet: Timestamps*
- YAML 1.2: yaml.org/spec/1.2.2
- RFC 2119 and RFC 8174 (BCP 14), requirement key words

### Informative

- *ERF: Design History and Prior Art*: `DESIGN-HISTORY.md`, this repository
- Gordon and Walton, *The Carneades Argumentation Framework* (CMNA 2006)
- Nanopublication Guidelines: nanopub.net; Kuhn and Dumontier, *Trusty URIs*
- SEPIO: github.com/monarch-initiative/SEPIO-ontology
- Discourse Graphs: discoursegraphs.com (Chan et al.)
- Wikidata data model, Help:Ranking, and property P2241: wikidata.org
- Guru card verification: getguru.com/product/verification
- Nygard, *Documenting Architecture Decisions* (2011); MADR: adr.github.io
- CiTO, the Citation Typing Ontology: purl.org/spar/cito
- scite Smart Citations: scite.ai
