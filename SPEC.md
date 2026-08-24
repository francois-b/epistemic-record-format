---
title: "The Epistemic Record Format"
subtitle: "Specification: the record types, the data model, and the invariants, stated so an implementer can build to them or diff an existing system against them."
spec_version: 1.0
status: draft
last_updated: 2026-08-23
generated: 2026-08-22
model: claude-fable-5
---

# The Epistemic Record Format

Specification, v1.0 (draft). The abstract and status are in `README.md`;
the change history is in `CHANGELOG.md`; how the format got this way, and
what the surrounding field holds, is the companion document
`DESIGN-HISTORY.md`. The normative data model is the TypeScript file
`types/erf.ts`, mirrored inline in section 3.

## 1. Scope and conformance

This format records four things: what a source *said* (atoms over captured
sources), what an author *claims* (claims), what was *searched* and what it
yielded (surveys), and where people *stand* (standings). What was *done* about any of it
(decisions, actions, outcomes) is out of scope: a neighboring system may
consume these records, and an activated bet plus its standing entries covers
the common case.

A conforming implementation stores, serializes, and validates the record
types of section 3 under the invariants of section 6. The specification is
written to be handed to an implementer (human or LLM) to build from, or
diffed against an existing system requirement by requirement.

Requirements are numbered (`ERF-7`) and use RFC 2119 keywords: MUST
(violation means non-conformance), SHOULD (default with legitimate
exceptions; a departing system should know and say so), MAY (declared
option; differing here is flavor, not divergence). Passages set as notes
are non-normative: they explain choices and bind nothing.

### Conformance classes

Conformance is claimed per class, not against the whole document:

- Record: a single atom, claim, or survey. Binds the data model
  (section 3) and its record type's requirements (section 4).
- Corpus: a collection of records under one corpus-registry entry. Binds the
  invariants (section 6) and `ERF-62` and `ERF-64`.
- Producer: a tool or process that writes records. Binds the serialization
  rules (section 7) and the producer SHOULDs of section 4 (for example
  `ERF-20`). Producers are strict: they write only defined fields,
  legal values, and self-describing files.
- Consumer: a tool that reads records. Consumers are tolerant: a consumer
  MUST NOT reject a corpus over unknown fields, unknown types, or records
  it cannot interpret. It reads what it understands and preserves the rest
  as opaque data, reporting what it did not recognize (the same stance the
  Open Knowledge Format takes).
- Validator: a tool that checks. Binds section 6 in full.

Strict producers, tolerant consumers: divergence is caught by validators
and surfaced, never by consumers refusing to read.

**What a consumer rule may say.** This format constrains a consumer's
fidelity to the record and never its use of the corpus. A rule that says do
not misrepresent what a record says, or do not lose data in transit, is in
scope: `ERF-42` (do not render `rejected` and `retired` identically
without saying which), `ERF-33` (report a narrative binding whose id resolves to
nothing rather than inventing a record), `ERF-57` (preserve and report
what you do not recognize), `ERF-60` (refuse an unsupported major version
openly rather than guessing). A rule that says do not ship this, or this
counts as enough evidence, is out of scope and belongs to whoever runs the
corpus. That line is why this version specifies no gates and no policies:
the format states what a record means and how records refer to each other,
and every decision about what to do with them is deliberately left to the
reader.

## 2. Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in BCP 14
(RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as
shown here.

- *record*: one atom, claim, or survey. Structured fields plus
  one body text.
- *corpus*: a body of work owning records; a research program, an
  engagement, a venture, or the personal corpus. The unit of
  confidentiality, which is what the classification wall (`ERF-45`) is
  drawn between.
- *capture*: the copy of a source saved when first read. Checks run
  against the capture, never the live web.
- *attester*: whoever is speaking in a captured text: the person or body
  whose word a quote carries, as distinct from the document carrying it.
  A vendor's page attests the vendor; a forum post attests its poster.
- *substrate*: the system holding a corpus's records, whether a git
  repository, a wiki, or a database (section 8).
- *actor*: `human:<id>` for a person, `<producer>/<version>` for a model
  or agent, `process:<id>` for automation. Every actor id MUST follow this
  convention. Writing and confirming are separate acts recorded in separate
  fields: who wrote a record need not be who checked it.
- *owner*: the corpus's responsible person, per the corpus registry.
- *corpus registry*: the deployment's list of registered corpora, each with
  an id, a home, a classification, and a purpose (`ERF-64`). It registers
  corpora, not sources; a map from atom ids to captured copies is a separate
  file and a separate concern.
- *realm*: the set of corpora one corpus registry lists. Record ids are
  unique within a realm (`ERF-36`). Two parties keeping separate
  registries are two realms, and a bare id means nothing between them.
- *disposition*: the computed reading of a claim's standings, one of
  `proposal`, `active`, `contested`, `rejected`, `retired` (`ERF-41`).
  Never a stored field.
- *narrative binding*: an HTML comment closing a passage of prose, naming
  the claims that passage rests on and quoting a verbatim anchor from it,
  so software can find the passage again after the prose moves
  (`ERF-31`). Always written in full: "binding" alone reads as a
  programming term.

## 3. Data model (normative)

The normative data model is the file `types/erf.ts`. The TypeScript below
is an inline mirror of that file, kept in sync by hand; it omits the
file's header comments and its identifier alias definitions (`AtomId`,
`ClaimId`, `SurveyId`, `CorpusId`, `FamilyName`, `CSL`); where the two
differ, the file governs. YAML examples elsewhere are informative.
Object-shape unions are deliberately absent; the only unions are
string-literal value sets.

```ts
type EpistemicKind  = "observation" | "argument" | "bet" | "commitment";
type Stance         = "for" | "against" | "withdrawn";
type Relation       = "supports" | "assumes" | "decomposes-into"
                    | "conflicts-with";
type SourceQuality  = "high" | "medium" | "low";
type Actor  = `human:${string}` | `${string}/${string}` | `process:${string}`;

interface ActorStamp   { timestamp: string; by: Actor }      // RFC 3339
interface StandingEntry { timestamp: string; stance: Stance;
                       by: `human:${string}`; why: string;   // humans only
                       evidence_at_stance?: {                // what the ruler faced (ERF-20)
                         atoms_for: AtomId[]; atoms_against: AtomId[] } }
interface AuditEntry { auditor: string;
                       verdict: "SUPPORTED" | "PARTIAL" | "UNSUPPORTED";
                       timestamp: string; protocol: string }

interface Atom {
  id: AtomId;                  // corpus prefix + number, e.g. kwg-117
  type: "atom";
  corpus: CorpusId;            // confidentiality tier
  finding: string;             // one sentence: what the quote shows
  quote: string;               // verbatim from the capture; [...] marks an omission
  citation_text: string;       // human-readable citation; never contains a URL
  citation?: CSL;              // canonical when present; citation_text renders from it
  fetched_url?: string;        // the locator actually retrieved; absent for received files
  source_quality: SourceQuality;
  as_of_date?: string;         // the date the FACT is true of
  limitations?: string;        // recorded caveat about the evidence
  created: ActorStamp;
  last_modified?: ActorStamp;
  finding_audit: AuditEntry[]; // judgment verdicts, recorded per auditor
}

interface Claim {
  id: ClaimId;                 // unique across the realm's corpora
  type: "claim";
  corpus: CorpusId;            // confidentiality tier; mutable
  title: string;               // THE claim statement (normative)
  epistemic_kind: EpistemicKind;
  created: ActorStamp;
  last_modified?: ActorStamp;
  short_name?: string;         // compact spoken name
  families: FamilyName[];      // recorded membership for exact pulls
  atoms_for: AtomId[];
  atoms_against: AtomId[];
  surveys?: SurveyId[];        // absence/coverage backing (section 4.5)
  edges: { to: ClaimId; relation: Relation }[];   // claim-to-claim only
  standings: StandingEntry[];  // append-only; per-person; humans only
  evidence_audit: AuditEntry[]; // does the evidence carry the claim (section 4.4)
  semantic_query?: string;     // pre-authored evidence-search key; see 3.1
  body: string;                // SHOULD open by restating title; then working notes
}

interface SearchAct {
  tool: string;                // the concrete instrument, named
  query: string;               // in the tool's own terms
  scope?: string;              // restriction, when one applied
  hits_reported: string;       // yield as the instrument reported it
  timestamp?: string;          // when acts span sittings
}

interface Survey {
  id: SurveyId;                // same namespace; slug SHOULD end with date
  type: "survey";
  corpus: CorpusId;
  title: string;               // what the survey sought
  conducted: ActorStamp;       // machine actors legal; judgment stays on claims
  searches: SearchAct[];
  notable_results: { what: string; note: string; atoms?: AtomId[] }[];
  limitations?: string;        // SHOULD when cited for absence (ERF-29)
  prior_survey?: SurveyId;     // re-run linkage
  body: string;
}
```

Lists are total in the type and MAY be empty; empty lists are omitted in
serialization (section 7). Optional fields (`?`) assert existence when
present: a `citation` means structure exists, a `fetched_url` means a fetch
happened, a `last_modified` means an edit happened.

### 3.1 Field reference

One row per field, grouped by record type: the field name, its type, who
writes it, when it is written, and the requirement ids that constrain it.
Definitions live with the requirements; this table is the index into them.
"Tool" means a producer acting under the machine role; "either" means a
tool usually drafts and a human may author or repair.

#### Atom

::: {.cols widths="20 18 22 22 18"}

| Field | Type | Writer | When | Requirements |
|:-------------------|:-----------------|:---------------------|:---------------------|:-----------------|
| `id` | AtomId | tool | at mint | `ERF-13` |
| `type` | the literal `atom` | tool | at mint | `ERF-54` |
| `corpus` | CorpusId | tool | at mint, on transfer | `ERF-54` |
| `finding` | string | tool drafts, human repairs | at mint, at re-audit | `ERF-11`, guidance in 4.2 |
| `quote` | string | tool | at mint | `ERF-6` |
| `citation_text` | string | tool | at mint, regenerated from `citation` | `ERF-7`, `ERF-8` |
| `citation` | CSL, optional | tool | at mint or ship-time upgrade | `ERF-8` |
| `fetched_url` | string, optional | tool | at capture | `ERF-7` |
| `source_quality` | SourceQuality | either | at mint | `ERF-9`, `ERF-10` |
| `as_of_date` | date, optional | either | at mint | `ERF-14` |
| `limitations` | string, optional | either | at mint, when a caveat emerges | `ERF-14` |
| `created` | ActorStamp | tool | at creation | `ERF-58` |
| `last_modified` | ActorStamp, optional | tool | at a later substantive edit | `ERF-47` |
| `finding_audit` | AuditEntry list | tool | after each audit run | `ERF-11` |

:::

#### Claim

::: {.cols widths="20 18 22 22 18"}

| Field | Type | Writer | When | Requirements |
|:-------------------|:-----------------|:---------------------|:---------------------|:-----------------|
| `id` | ClaimId | either | at mint | `ERF-36` |
| `type` | the literal `claim` | tool | at mint | `ERF-54` |
| `corpus` | CorpusId | tool writes, human directs | at mint, on promotion or transfer | `ERF-17` |
| `title` | string | human owns, machine may draft | at mint, when reviewing renders | `ERF-18`, `ERF-46` |
| `epistemic_kind` | EpistemicKind | either | at mint, refined at cut entry | `ERF-24`, `ERF-49` |
| `created` | ActorStamp | tool | at creation | `ERF-58` |
| `last_modified` | ActorStamp, optional | tool | at a later substantive edit | `ERF-47` |
| `short_name` | string, optional | human | at cut entry | guidance in 4.3 |
| `families` | FamilyName list | tool proposes, human rules | at mint, at reconciliation | guidance in 4.3 |
| `atoms_for` | AtomId list | tool proposes, human admits | as evidence lands | `ERF-23` |
| `atoms_against` | AtomId list | tool proposes, human admits | as evidence lands | `ERF-23` |
| `surveys` | SurveyId list, optional | tool proposes, human admits | as coverage lands | `ERF-25`, `ERF-29` |
| `edges` | Edge list, claim-to-claim | tool proposes, human rules | at composition and challenge | `ERF-43`, `ERF-44` |
| `standings` | StandingEntry list | tool writes, humans in `by` | at each stance | `ERF-19`, `ERF-21` |
| `evidence_audit` | AuditEntry list | tool | change-triggered | `ERF-24`, guidance in 4.4 |
| `semantic_query` | string, optional | tool drafts | at mint or at need | guidance in 4.3 |
| `body` | string | human | freely | `ERF-18`, `ERF-46` |

:::

#### Survey

::: {.cols widths="20 18 22 22 18"}

| Field | Type | Writer | When | Requirements |
|:-------------------|:-----------------|:---------------------|:---------------------|:-----------------|
| `id` | SurveyId | tool | at mint | `ERF-28`, `ERF-36` |
| `type` | the literal `survey` | tool | at mint | `ERF-54` |
| `corpus` | CorpusId | tool writes, human directs | at mint, on transfer | `ERF-17` |
| `title` | string | either | at mint | `ERF-28` |
| `conducted` | ActorStamp | tool | at the search | `ERF-28` |
| `searches` | SearchAct list | tool | at the search | `ERF-26`, `ERF-27` |
| `notable_results` | list of `{what, note, atoms?}` | either | at the search, as atoms mint | `ERF-27` |
| `limitations` | string, optional | either | at the search | `ERF-29` |
| `prior_survey` | SurveyId, optional | tool | at a re-run | `ERF-28` |
| `body` | string | either | freely | `ERF-28` |

:::

#### Search act

::: {.cols widths="20 18 22 22 18"}

| Field | Type | Writer | When | Requirements |
|:-------------------|:-----------------|:---------------------|:---------------------|:-----------------|
| `tool` | string | tool | at the act | `ERF-26` |
| `query` | string | tool | at the act | `ERF-26` |
| `scope` | string, optional | tool | at the act | `ERF-26` |
| `hits_reported` | string | tool | at the act | `ERF-27` |
| `timestamp` | RFC 3339, optional | tool | at the act | `ERF-28` |

:::

#### Standing entry

::: {.cols widths="20 18 22 22 18"}

| Field | Type | Writer | When | Requirements |
|:-------------------|:-----------------|:---------------------|:---------------------|:-----------------|
| `timestamp` | RFC 3339 with time | tool | at the stance | `ERF-19`, `ERF-58` |
| `stance` | Stance | human decides, tool writes | at the stance | `ERF-19` |
| `by` | `human:<id>` | tool writes, names the person | at the stance | `ERF-21`, `ERF-39` |
| `why` | string | human | at the stance | `ERF-19`, `ERF-39` |
| `evidence_at_stance` | id sets, optional | tool, a SHOULD | at the stance | `ERF-20` |

:::

#### Audit entry

::: {.cols widths="20 18 22 22 18"}

| Field | Type | Writer | When | Requirements |
|:-------------------|:-----------------|:---------------------|:---------------------|:-----------------|
| `auditor` | string | tool | at the run | `ERF-11` |
| `verdict` | SUPPORTED, PARTIAL, or UNSUPPORTED | the auditor | at the run | `ERF-11` |
| `timestamp` | RFC 3339 | tool | at the run | `ERF-58` |
| `protocol` | string | tool | at the run | `ERF-11` |

:::

How records are found: atoms are retrieved by embedding `finding` and
`quote`. The finding is written to be checkable away from its source,
which makes it the intended embedding target (this retrieval path is what
replaced atom tags). Claims are retrieved by `semantic_query`. The
mint-time evidence sweep runs a claim's `semantic_query` against the atom
index and the source and library indexes, in both directions: candidates
for `atoms_for` and `atoms_against` alike.

### 3.2 Naming

Field names are `snake_case` in YAML and in the TypeScript interfaces
alike: serialization fidelity outranks TypeScript idiom, so every example
stays copy-pasteable between this document and a file. Type aliases are
PascalCase and self-sufficient out of context (`EpistemicKind`, not
`Kind`). The conventions that govern how future names are chosen are in
`DESIGN-HISTORY.md`; they bind whoever edits this specification, not an
implementer reading it.

## 4. Record types

Each record type is stated the same way: what it is for, then how to write
one well, then the numbered promises the format makes about it. The
guidance is advice and binds nothing; the numbered requirements are what
conformance means.

### 4.1 The source

A source is whatever a quote came from: a web page, a received report, a
transcript, a book. The format never reads a source. It reads the *capture*,
the copy saved when the source was first read, which is what makes a check
re-runnable years later and what turns a dead link into weakened provenance
rather than a broken check.

Capture when you first read something. Legacy material is captured the next
time it is read or used, and its atoms are minted then; a corpus is not
retrofitted wholesale, because a capture made long after the reading is
evidence about today's page rather than about what was read.

- **ERF-1** A capture MUST exist before any check runs against a source,
  and checks MUST run against the capture, never the live web.
- **ERF-2** A received file (report, transcript) is immutable: it MUST be
  retained as received, and a revision arriving later MUST be a new source,
  never an overwrite. A web page is mutable: its capture MUST be dated.
- **ERF-3** The capture's location MUST be recorded in a per-corpus
  mapping from atom id to capture, not on the atom. The fetch date lives
  with the capture.
- **ERF-4** Every atom MUST have an entry in that mapping. An entry
  either gives the capture's path or records that no capture is held and
  why. Absence MUST be explicit: a mapping is checkable only when it is
  complete, because a validator can tell a recorded absence from an
  omission and cannot tell an omission from an oversight.
- **ERF-5** An entry recording an absence MUST carry a reason from a
  closed set and a human-readable note. The set in use is
  `not-redistributable` (a licence permits reading but not republication)
  and `licence-unverified` (redistribution rights could not be established,
  and unverified is not permission). The vocabulary is provisional and grows
  by a demonstrated instance rather than by anticipation.

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

**Writing one well.** The schema checks structure; it cannot check craft.
A good finding is one sentence a stranger could check: it states what the
quote shows rather than restating the quote, it names the actor and the
time scope, and it hedges exactly as hard as the source does ("states", not
"proves"). Compression is a defect. Redundancy that makes a finding
checkable away from its context is doing work, not padding.

Where an atom has no `citation` block, write `citation_text` as "Author,
Title (venue, year), locator when it matters"; the upgrade path to
exactness is the citation block. Where `source_quality` is `medium` or
`low`, put the reason in `limitations`, so a reader learns what is thin
rather than only that something is.

The caveat field is named `limitations` rather than "warrant" deliberately:
in Toulmin's vocabulary a warrant is the licence from evidence to claim,
the opposite role, and the borrowed name guaranteed misreading by trained
readers.

- **ERF-6** The `quote` MUST be verbatim from the capture. An omission
  inside a quote MUST be written `[...]`; bare `...` is reserved for dots
  the source itself contains.
- **ERF-7** `citation_text` MUST NOT contain a URL. A citation identifies
  a work; a locator retrieves one copy. The retrieved locator is
  `fetched_url`; a web-native work's own identity MAY appear as
  `citation.URL`. A received file has no retrieval locator, so its atoms
  carry no `fetched_url`.
- **ERF-8** When `citation` is present it is canonical: it MUST carry
  everything the rendered `citation_text` string shows, chapter,
  translator, and edition included, and `citation_text` MUST be rendered
  from it. The default rendering style is Chicago, via CSL; a deliverable
  MAY override it.
- **ERF-9** `source_quality` MUST grade one axis: how much weight the
  attester's word carries for the fact the finding conveys. Two inputs are
  assessed and the weaker governs. Provenance distance is how many hops
  separate the captured text from the fact. Attester accountability is
  whether the source is identifiable, answerable, and positioned to know,
  or anonymous, self-interested, or of unknown competence. It MUST NOT
  encode audit state, which is `finding_audit`'s record, or capture
  fidelity, which is the mechanical check's derived result; a consumer
  wanting one combined trust signal computes it from the three at read
  time.

::: {.cols widths="14,86"}

| Value | The attester and the chain |
|:---------|:-------------------------------------------------------------|
| `high` | Direct and accountable: a regulator or court filing, an organization's disclosure about itself, a named study reporting its own data, a captured primary. |
| `medium` | An identifiable intermediary reporting someone else's fact, or a first party with an interest in the answer: trade press, an analyst note, a vendor's claim about its own product, a one-hop relay. |
| `low` | An unaccountable or unidentifiable attester, or a chain not yet pulled to primary: a forum comment, an aggregator citing an unnamed original. |

:::

- **ERF-10** The grade MUST be assessed against the substance the finding
  conveys, not against the bare fact that someone uttered it. Reported
  speech does not raise it: "a commenter reported X", sourced to an
  anonymous forum, stays `low`, because the reader's question is whether X
  holds, not whether someone said it. A finding whose subject *is* discourse
  itself, what a population says, believes, or claims, MUST say so in its
  own words; the utterance is then the substance, a captured identified
  utterance is direct and accountable, and the grade can be checked against
  what the atom attests.
- **ERF-11** The mechanical check (the normalized quote occurs in the
  capture) is recomputable by anyone holding the corpus and its captures,
  so its result MUST NOT be stored. The judgment (does the quote, in
  context, support the finding?) is not recomputable: it MUST be recorded
  per auditor in `finding_audit`, with the protocol version that produced
  it. Verdicts rendered under different protocol versions MUST NOT be read
  as like for like, which is why the protocol travels with the verdict and
  why an auditor's identity, a hosted model id whose weights drift under a
  stable name, is recorded beside it.
- **ERF-12** A verdict MUST be exactly one of `SUPPORTED`, `PARTIAL`, or
  `UNSUPPORTED`. A failed, unparseable, or abandoned audit MUST NOT be
  written as a verdict: an audit that produced nothing is an audit that did
  not happen, the atom is unaudited, and the remedy is to run it again.
  Recording a tool failure in the field that holds a judgment makes the two
  indistinguishable to everything downstream. A PARTIAL stays a PARTIAL:
  disagreeing with an auditor is a judgment about the claim, recorded as a
  standing with its reason, at the grain a person actually works at rather
  than as a flag on a machine's output.
- **ERF-13** An atom's `id` MUST be permanent: a mint-time prefix plus a
  sequence number (`kwg-117`), never renamed and never reused.
- **ERF-14** `as_of_date`, where present, MUST record the date the fact
  is true of, which is distinct from the date the atom recorded it: dated
  statistics carry it and timeless statements omit it. `limitations`
  records the caveat about the evidence, whether that is chain quality, a
  capture block, a scope warning, or a note on a PARTIAL verdict.

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
`standings` ledger is empty and therefore omitted from the file
(`ERF-55`), and its computed disposition is *proposal*. The spec invents no
standing entries in its examples: a stance is a real person's recorded
judgment, and there is none to show yet.

**Writing one well.** A good claim statement reads as true-or-false standing
alone: if a reader cannot disagree with the sentence, it is not a claim yet.
Scope belongs in the title, which is why a claim needs no caveat field of
its own.

Three optional fields earn their place by use rather than by rule. A
`short_name` is a compact spoken name for conversation and cut documents:
the title states the claim, the short name calls it. `families` records
topic-family membership as a decision rather than a guess, which is what
makes a pull such as "the demand claims" an exact, repeatable set; search
proposes members, the recorded family is the ruling. A `semantic_query` is a
pre-authored search key written in the source domain's vocabulary rather
than the claim's own compressed prose, used to find evidence that could back
the claim or cut against it; it is read by machines only, is exempt from the
prose standard by construction, and may be regenerated freely.

For a bet, record the decision it licenses in the `why` of the `for` entry
that backs it, and the outcome in the `why` of the `withdrawn` entry that
ends it. A stance that decides something, meaning one that activates or
contests a claim, is worth taking through a show-both-sides review
individually. The cold-reader test applies to standings as much as to
prose: does the recorded why survive the evidence on record?

- **ERF-15** References MUST be bare ids and MUST NOT encode location.
  A claim moved between corpora keeps its id, and no reference changes.
- **ERF-16** A shared surface MUST resolve a reference against the realm
  it came from. Across realms, identity is the pair of realm and id, and
  bare ids are not promised to be unique between two parties' realms.
- **ERF-17** `corpus` MUST be written on every claim and MUST name a
  registered corpus. Changing it is a promotion or transfer; the change
  SHOULD be accompanied by a standing entry recording why.
- **ERF-18** `title` MUST state the claim; it is the normative statement.
  The body SHOULD open by restating it; the validator compares the two
  (`ERF-46`). Beyond that restatement the body is the one
  operator-authored text on the record, and carries the working notes.
- **ERF-19** `standings` is append-only: entries MUST NOT be edited or
  deleted; a correction is a new entry. Each entry MUST carry a full
  timestamp (same-day entries MUST order), a stance, and a non-empty
  `why`: an entry without a reason is a toggle, not a judgment.
- **ERF-20** Producer tools SHOULD stamp each standing entry with the
  evidence sets attached at ruling time, by id
  (`evidence_at_stance: {atoms_for: [ids], atoms_against: [ids]}`). Which
  evidence the ruler faced is the one fact about a ruling's context that
  cannot be recovered later, because attachment events are recorded
  nowhere. Drift MUST NOT be stored there: content drift, an atom modified
  after the stance, and audit drift, verdicts newer than the stance, are
  both derivable from existing timestamps. Counts are not an acceptable
  digest either, because swapping one atom for another leaves the count
  unchanged and hides the staleness the field exists to expose.
- **ERF-21** A standing's `by` MUST be a `human:` actor. An LLM can
  propose a claim; only a person takes a stance. A stance speaks for one
  person only; endorsement by one person or by five is the same act,
  recorded the same way.
- **ERF-22** A claim MUST NOT store a state field: the disposition is
  computed (`ERF-41`). Minting is not a standing: a claim is born with
  none, and a claim nobody has taken a stance on is a proposal. The origin
  story belongs in working notes; origin that carries evidential weight is
  a source: capture it and cite atoms.
- **ERF-23** Evidence MUST live on the claim, in both directions:
  `atoms_for` and `atoms_against`. Evidence against a claim MUST NOT be
  modeled as a rival claim.

### 4.4 The backing audit

The atom's checks stop at the finding. Whether a claim's atoms, taken
together, actually support its statement is a further judgment, recorded in
`evidence_audit` with the same entry shape as `finding_audit`.

Run it on change rather than on a schedule: an atom added to either list, a
cited atom modified, the statement edited. Staleness is computed
(`ERF-47`), and between changes there is nothing to re-run.

- **ERF-24** The backing audit MUST ask the question the epistemic kind
  sets, because the kind is the backing contract. For an `observation`: do
  the `atoms_for`, each already checked at the atom level, jointly entail
  the statement, and do the `atoms_against` undermine it? For an
  `argument`: granting the claims its edges name, does the conclusion
  follow? `bet` and `commitment` owe no backing, so they have nothing to
  audit; auditability is computable from the kind.
- **ERF-25** A universal negative, a claim of the form "no shipped tool
  does X", MUST be audited as scoped rather than as proved. No set of atoms
  proves such a claim: the atoms evidence the coverage of a survey, not the
  absence itself, and SUPPORTED means supported as scoped. Such a claim
  SHOULD cite the survey records whose coverage it rests on (`surveys`,
  section 4.5) rather than atoms alone, because atoms can only quote what
  exists.

> *Note (non-normative):* on the word "jury". A cross-vendor model jury
> diversifies judgment; it does not make verdicts independent in the
> statistical sense. Models trained on overlapping corpora share failure
> modes, and two SUPPORTED verdicts can be one correlated error wearing two
> names. Its verdicts are recorded hypotheses rather than proof, which is
> why the format keeps human review at the point of consequence and records
> an auditor's identity with a protocol version rather than trusting it
> alone.

### 4.5 The survey

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
    hits_reported: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "granted (word-level, --include=*.md)"
    scope: "same seven [private claims dir]/ homes"
    hits_reported: "4 lines in 3 files; none a field use"
notable_results:
  - what: "The claims-tree doc-class granted dimension"
    note: "A render-layer field of one document class, documented in an
      internal corpus; the word's nearest live relative, not a record
      field."
---
```

**Writing one well.** How often a fruitful survey is re-run is a question
for whoever runs the practice, not for the format. Describe the search in
the body: what you were after, what surprised you, what you would search
differently next time. Keep `limitations` for the coverage bounds
themselves, because that is the field a reader or a validator looks in when
weighing an absence claim, and bounds buried in narrative prose cannot be
found by anything.

- **ERF-26** Each search act MUST name its concrete instrument in `tool`
  and its `query` in that instrument's own terms: a search string, a
  database query, a semantic prompt, or, for a manual review, the universe
  inspected. A category ("web search") without the instrument does not
  satisfy this; yields are comparable only where instruments are named. An
  act MAY carry a `scope` naming the restriction that applied: a site
  filter, a date range, a corpus slice, or the depth inspected.
- **ERF-27** `hits_reported` MUST record each act's yield as the
  instrument reported it, as text ("0", "3", "~120 reported, two pages
  inspected"); a record MUST NOT state precision the instrument did not
  give. `notable_results` is the curated subset worth keeping, near-misses
  with why they fall short and exemplars with why they matter; entries mint
  atoms when a hit deserves quoting, and the full yield stays in the acts.
- **ERF-28** A survey MUST be an immutable record of a conducted search:
  a re-run of the same sought is a new record, SHOULD name its predecessor
  in `prior_survey`, and its id SHOULD end with the conducted date. The
  `title` MUST state what was sought. An individual act MAY carry its own
  `timestamp` where a survey spans sittings; absent one, an act inherits
  the survey's `conducted` timestamp. Staleness of a claim's survey backing
  is computed from `conducted` timestamps, never stored.
- **ERF-29** A survey cited by a claim asserting absence or sparseness
  SHOULD carry `limitations`: what the acts did not cover and how deeply
  hits were inspected. A complete search of a closed corpus correctly
  carries none.

> *Note (non-normative):* the weight of an empty search is the relation
> between the universe searched and the universe the claim is about. A
> world-claim over the world's indexes (web, preprint servers, patent
> databases): absence is real, defeasible, decaying evidence. A world-claim
> over a private sample (a curated thousand-volume library): absence is
> nearly no evidence; the sample says something about its curation, nothing
> about the world; record such an act as color, in `limitations`. A
> closed-corpus claim with a complete search of that corpus: absence is
> conclusive, and there are no limitations to state. The same relation, read
> from the other side, is why `conducted` admits machine actors: searching
> is machine work, and the judgment that the coverage carries the claim
> stays where judgment lives, in the citing claim's standings and its
> backing audit.

### 4.6 The narrative and its narrative bindings

A narrative is a document written for people: an essay, a brief, a memo.
Prose alone has a problem: assertions live inside sentences, so nothing
marks what a passage commits to; the writer re-derives old reasoning;
readers argue with impressions; and when the thinking underneath changes,
the prose keeps saying what it said.

- **ERF-30** A narrative in this format MUST comprise two documents,
  tied together: the *narrative document* (the prose, authored by a
  person, never generated) and the *claims-tree document* (the same
  argument as a structured list of the claims it rests on, compiled from
  the claim records). The prose persuades; the claims-tree is what a
  collaborator disputes line by line and what the checks run against.
- **ERF-31** A passage that asserts something SHOULD end with a narrative
  binding: a marker naming the claims it rests on plus a few exact words
  from the passage, so software can find the spot after edits. The marker
  MUST be an HTML comment, so that it is invisible in every render and
  survives any markdown pipeline:

```markdown
<!-- claims: no-continuous-claim-check "no test that runs on claims" bound-at=2026-08-23 -->
```

  The grammar, which is the smallest one that covers real usage:

```
narrative-binding ::= "<!--" ws* "claims:" ws+ ids ws+ anchor
                      [ws+ "bound-at=" date] ws* "-->"
date     ::= YYYY "-" MM "-" DD
ids      ::= id (ws+ id)*
id       ::= a record id, matching the corpus's id grammar
anchor   ::= '"' text '"'
```

  Ids are separated by whitespace, never by commas, because a comma inside
  an unquoted list invites a parser to guess. The anchor is REQUIRED and is
  a verbatim substring of the passage: it is how software finds the spot
  after the prose moves, and a narrative binding without one can only point
  at a line number, which edits destroy.

- **ERF-32** A narrative binding MUST record `bound-at`, the date it was
  made, in the marker itself, and MUST be checkable: it is stale when the
  claim it names carries a `last_modified` later than that date, a complete
  mechanical test using only fields the format already defines. A narrative
  binding without `bound-at` MUST be reported as staleness `indeterminate`,
  never as current: a validator that cannot tell must say so rather than
  reassure.
- **ERF-33** A consumer encountering a narrative binding whose id
  resolves to no record MUST report it and MUST NOT drop it silently. A
  narrative claiming support from a record that does not exist is a defect
  in the narrative, and hiding it turns a broken citation into a confident
  sentence. A consumer MUST NOT invent a record to satisfy the reference.
- **ERF-34** A narrative MUST NOT be modelled as a record: it is a
  document. It carries frontmatter with `title`, `corpus`, and `created`,
  and its narrative bindings are the only structured content in it. It has
  no evidence, no standings, and no disposition, which is precisely why it
  is not a record: nothing about it is adjudicated, and a person disputes
  the claims it binds to rather than the prose. It therefore has no
  interface in the data model of section 3.

> *Note (non-normative):* staleness detects that the claim moved, not what
> moved, so a typo fix in a body flags its narrative bindings. That is the
> same over-stamping accepted in `ERF-48`, and it errs toward telling a
> reader to look.

## 5. Vocabularies

Closed sets. A value outside them is a validation failure, not a dialect.
The sets themselves are listed in the data model (section 3); what they
mean:

Epistemic kinds answer one question: what would check this claim?

- `observation`: data or research settles it; owes atoms.
- `argument`: reasoning settles it; owes edges to the claims it follows
  from. Its structure is the graph: premises are claims of any kind;
  chains terminate per `ERF-43`.
- `bet`: relied on, not established; the world will settle it.
- `commitment`: chosen conduct, will be enforced; the author's decision
  is the backing.

> *Note (non-normative):* kinds vary the validation contract, never the
> record shape. A kind that demands its own shape is a record type
> announcing itself, which is the test that keeps this vocabulary at four.

Stances: `for`, `against`, `withdrawn` (exit, dated, never a
deletion).

Relations, each stated subject-first, the subject being the claim that
carries the edge:

- `supports`: this claim argues for the target.
- `assumes`: this claim depends on the target being true.
- `decomposes-into`: the target is one part of this claim.
- `conflicts-with`: mutual tension; both stand; stored once, the
  reciprocal derived.

> *Note (non-normative):* `edges` means claim-to-claim and carries no
> other record type, which is what keeps the vocabulary honest: a relation
> that would need a different kind of target is a different field, not a
> fifth relation. Prior art goes the other way (CiTO defines forty citation
> relations); the working experience is that small vocabularies get used and
> large ones get skipped.

The atom's `source_quality` tiers (`high`, `medium`, `low`) are defined
with the rule for assessing them in `ERF-9` and `ERF-10`, their one
home. Operational meaning: read the lows and mediums harder. Dispositions
are not a stored vocabulary; see `ERF-41`.

## 6. Invariants (the validator)

All machine-checkable. Types express what types can express; the validator
checks the relations no type can see.

- **ERF-35** Every reference MUST resolve: atoms in their corpora, claims
  and surveys in the realm namespace; `atoms_for`, `atoms_against`,
  `edges.to`, and `surveys` name existing records.
- **ERF-36** Every record id MUST be unique across every corpus in the
  realm, regardless of record type: one atom, claim, or survey may hold a
  given id, and no second record of any type may repeat it.
- **ERF-37** A producer MUST verify that an id is unused in the realm
  before writing a record. The means are the substrate's: a directory that
  cannot hold two files of one name, a unique index, a lookup against the
  registry. The format states the invariant and declines to specify the
  mechanism, because the mechanism is exactly what varies between
  substrates (section 8).
- **ERF-38** A validator MUST reject a realm containing duplicate record
  ids, regardless of record type.
- **ERF-39** Every standing entry MUST have a `human:` actor and a
  non-empty `why`.
- **ERF-40** Standings MUST be append-only; an edit or deletion of an
  existing entry is a violation, verified against the substrate's history.
- **ERF-41** Disposition MUST be computed, never stored, from the current
  stances alone, meaning each person's newest entry. With no standings at
  all the disposition is `proposal`. Otherwise discard every current stance
  of `withdrawn`, because withdrawal is exit rather than opposition, and
  read what remains: nothing remaining means `retired`; all `for` means
  `active`; all `against` means `rejected`; both `for` and `against`
  remaining means `contested`. Every input has exactly one reading. No
  stance outranks another and the format supplies no tie-break: `contested`
  is the terminal reading of a disagreement, not a state resolved by
  arithmetic. What any particular use requires of a
  disposition is not specified here: the format computes the reading and a
  consumer decides what to do with it.
- **ERF-42** `rejected` and `retired` MUST NOT be conflated. A rejected
  claim is one every current holder judges false; a retired claim is one
  every current holder has left. Both are terminal readings and neither is
  a deletion; a consumer presenting them identically MUST say which it
  means.
- **ERF-43** An argument's transitive `assumes` and `supports` closure
  MUST terminate in non-argument leaves, none of them retired. Self-edges MUST NOT exist; `assumes` and `decomposes-into` MUST
  admit no cycles.
- **ERF-44** `conflicts-with` MUST be stored once per pair.
- **ERF-45** A record MUST NOT reference a record whose classification is
  narrower than its own, in edges or in evidence. A narrower corpus MAY
  cite a more open one; never the reverse. The comparison MUST be evaluated
  against the ordered classification levels the realm's corpus registry
  declares (`ERF-64`): without a declared order the wall is not
  machine-checkable, because nothing tells a validator that one label is
  narrower than another, and two deployments may use different vocabularies
  with neither wrong. References are bare ids, so a record MAY cite one in
  another corpus; the wall is what governs which direction that may run.
- **ERF-46** `title` and the body's opening statement MUST agree.
- **ERF-47** Staleness MUST be computed, never stored: a
  `finding_audit`, `evidence_audit`, or narrative binding older than the last change
  to what it judged is flagged stale.
- **ERF-48** Any change to a record MUST set `last_modified` to a
  timestamp later than its `created` and later than any prior
  `last_modified`. The one exception: appending to an append-only list
  (`standings`, `finding_audit`, `evidence_audit`) MUST NOT advance it, or
  every audit and every stance would invalidate itself at the moment it was
  recorded. A record never edited since minting correctly carries no
  `last_modified` at all.

> *Note (non-normative):* the rule is deliberately blunt rather than
> enumerating which fields are substantive. An enumerated list is one more
> thing that must move in lockstep with the schema. Over-stamping costs an
> unnecessary re-audit; under-stamping shows a current verdict on a finding
> that has since moved, which is the failure that matters.

- **ERF-49** A validator MUST flag as unbacked an `observation` someone
  stands on with empty `atoms_for` and empty `surveys`, and such an
  `argument` with no edges (the computed warning a render shows).
- **ERF-50** The mechanical quote check (the normalized quote occurs in
  the capture) MUST be re-runnable by anyone holding the corpus and its
  captures; it MUST run as a gate at minting and after any transform that
  moves atoms between homes.
- **ERF-51** Normalization MUST be this ordered sequence, applied
  identically to the quote and to the capture, so that two conforming tools
  reach the same verdict on the same pair:

  1. Unicode NFKC.
  2. Remove soft hyphens (`U+00AD`).
  3. Fold typographic single quotes (`U+2018`, `U+2019`, `U+201B`) to `'`.
  4. Fold typographic double quotes (`U+201C`, `U+201D`, `U+201F`) to `"`.
  5. Fold dash variants (`U+2010` through `U+2015`, `U+2212`) to `-`.
  6. Join words broken across lines: remove a hyphen followed by a newline
     and any leading whitespace on the next line.
  7. Collapse runs of two or more hyphens to one.
  8. Remove the emphasis and code markers `*`, `_`, and `` ` ``.
  9. Unify dash spacing: whitespace either side of a hyphen is removed.
  10. Collapse whitespace runs to a single space, then trim.

  Case MUST NOT be folded. Case is part of a verbatim quote, and folding it
  lets a mis-cased quote pass a check whose whole job is fidelity.

  Steps 1 through 10 above run AFTER the markup-unwrapping steps below,
  which are equally mandatory. Unwrapping was optional until 2026-08-23 and
  is not any longer: measured over one corpus, running the sequence without
  it moved the failure rate from 9% to 19%, so an optional step decided the
  verdict on roughly one atom in ten and two conforming tools could disagree
  about the same quote. The unwrapping steps, in order, before step 1:

  - a. Markdown link syntax reduces to its link text.
  - b. Attribute blobs in braces are removed.
  - c. Parenthesized link targets are removed: absolute, protocol-relative,
       root-relative, and fragment-only.
  - d. Blockquote markers at the start of a line are removed, with one
       following space if present.
  - e. Square brackets, straight double quotes, and the symbols `®`, `™`,
       `©`, `^`, and `\` are removed.
  - f. A space before `,` `.` `;` `:` `!` `?` is removed, an artifact of
       document export.

  These assume a text or markdown capture, which is what every capture in
  the reference practice is. A capture in another format (a PDF, an HTML
  file, a spreadsheet) has no defined conversion to comparison text, and
  specifying one per media type is the successor design, deferred until the
  first capture that is not text. A validator facing a capture whose format
  it cannot convert MUST report the check as unavailable rather than pass or
  fail it.
- **ERF-52** Only the exact marker `[...]` MUST be treated as an
  omission, and it is the only wildcard. A bare `...` and a bare `…` are literal source
  characters and MUST be matched literally (`ERF-6`). The quote MUST be
  split on `[...]` BEFORE normalization, because normalization may fold or
  strip brackets and would otherwise destroy the marker; each span is then
  normalized independently. Every non-empty span MUST occur in the
  normalized capture, in order and without overlap. A quote whose spans are
  all empty MUST fail rather than trivially pass. The text between two
  spans is unbounded by design: an elision marker is the author's assertion
  that they removed material, and whether the removal misleads is a
  judgment for the audit, not a distance a validator can measure.
> *Note (non-normative):* on enforcing uniqueness. Detection is mechanical
> and belongs to the validator; prevention at mint belongs to the producer;
> concurrent minting is addressed by neither. Two writers, or two git
> branches, can each mint the same next sequence number and merge without
> conflict, because the additions touch different lines of different files.
> This cannot bite a single sequential writer, which is the reference
> practice, and it becomes real with a second person minting into a shared
> corpus, the same trigger that holds the multi-operator mechanics. The
> structural answer, when it stops being hypothetical, is content-addressed
> identity in the nanopublication Trusty URI shape, already deferred behind
> corpus sharing: an id derived from a record's content cannot collide by
> construction, which dissolves the problem rather than detecting it
> afterwards.

> *Note (non-normative):* a `retired` disposition MUST NOT be read as
> "shown false". Withdrawals on record split three ways. Some absorb a
> claim into another or split it in two, so the content survives
> elsewhere. Some record that a claim should never have stood, unbacked
> when minted or contradicted by a claim its owner kept. At least one is
> not about truth at all: a claim was withdrawn because asserting it in a
> document its subject would read was the wrong move, not because the
> evidence turned. The `why` is required so a reader can tell these
> apart, and reading it is the only way to.

> *Note (non-normative):* on default lenses. Tools are advised to return
> claims whose disposition is `active` unless a wider lens (proposals,
> contested, rejected, retired) is explicitly requested, so that consumers
> of one corpus share a worldview. This is advice rather than a rule:
> which lens a reader wants is the consumer's business.

## 7. Serialization

- **ERF-53** The canonical interchange form MUST be the textual record:
  YAML frontmatter plus markdown body for every record type. Records of one
  type MAY be grouped in one file or written one per file; both round-trip,
  and the grouping carries no meaning, because each record states its own
  `type` and `corpus` (`ERF-54`). A conforming store MUST round-trip
  records through this form without loss.
- **ERF-54** Records MUST self-describe: `type` and `corpus` are written
  on every record of every type, and no meaning lives in a path.
- **ERF-55** Empty lists MUST be omitted: a field's absence means none.
  A producer MUST NOT originate a field the declared `spec_version` does
  not define. An unknown key is a producer validation error, caught by a
  validator, and never a consumer's licence to refuse (`ERF-57`).
- **ERF-56** A reader MUST materialize an omitted list-typed field as an
  empty list. An omitted list means none, never unknown, so a record that
  omits one is complete rather than partial. This applies to
  `finding_audit`: an atom nobody has audited yet carries no audit key and
  is a complete record with an empty audit list, not a malformed one. The
  data model types these fields as required because they are always present
  in a loaded record; the serialization omits them because a file should
  not spend a line saying nothing.
- **ERF-57** A consumer MUST preserve unknown fields and unknown record
  types as opaque data, MUST report them, and MUST NOT reject a corpus
  solely because it contains them. Strictness belongs to the producer and
  detection to the validator; a consumer that refuses what it does not
  recognize breaks forward compatibility for everything downstream of it.
- **ERF-58** The event-time key MUST be `timestamp`, everywhere.
- **ERF-59** A corpus MUST carry a manifest. It MUST declare `id` (the
  corpus id), `title` (for a person), `spec_version` (the version its
  records conform to), and `classification` (the confidentiality tier the
  corpus registry records). It MAY name an `owner`, the actor
  responsible for the corpus. It declares no bars or gates: v1 specifies
  what records mean and how references resolve, and leaves use to the
  consumer.
- **ERF-60** A consumer MAY refuse a corpus whose MAJOR `spec_version` it
  does not support, and MUST say so when it does. For an unsupported MINOR
  version it MUST either preserve unrecognized content losslessly or refuse
  with an explicit diagnostic; silently dropping what it does not
  understand is forbidden. Reading a corpus under the wrong major version
  is worse than refusing it, because the failure is silent: fields shift
  meaning and nothing in the file announces the mismatch. Migrations
  between majors are explicit.
- **ERF-61** A MAJOR increment MUST mean a change that makes a
  conforming corpus of the previous major unreadable, rather than merely
  under-interpreted. A MINOR increment adds or refines what an older
  consumer can safely ignore. The distinction is what `ERF-60` hangs on:
  without it, "unsupported version" has no agreed consequence.

## 8. Storage

- **ERF-62** A corpus MUST have exactly one authoritative home. Every
  index, database, or embedding built over it is a *projection*:
  recomputable, derived, never consulted as truth.
- **ERF-63** A substrate MAY be anything that preserves records, ids,
  attribution, and an edit history sufficient to verify `ERF-40`. Files
  in git are the reference implementation (history and diffing for free);
  a record's body is one more field in a database.
- **ERF-64** A deployment MUST keep a corpus registry: corpus id, home,
  classification, purpose. The registry MUST declare the realm's
  classification levels as an ordered list, most open first, and every
  corpus's `classification` MUST be a member of it. A corpus travels as a directory or archive of
  its records and captures; a sensitive corpus MAY publish a redacted cut
  through the same machinery.

## Versioning and change control

- The `spec_version` on a corpus manifest (`ERF-59`) governs the semantics
  of that corpus's records; migrations between versions are explicit, never
  inferred from field absence.
- The specification amends itself by its own discipline: a field is
  admitted only on a forcing instance (a real corpus demanding it), a
  vocabulary value only when it carries a distinct contract, and every
  retirement is recorded with the measurement that decided it.
- Requirement ids are a flat sequence and carry no meaning beyond identity:
  a number does not say which section a requirement lives in, so moving a
  section can never make an id wrong. Ids are stable once published.
  Insertions append; retired ids are never reused and are never refilled.
- A decision that closes a proposal, whether declining it or deferring it
  behind a trigger, is recorded in the design history's register in the
  same commit that implements it. A register nobody updates reads as
  complete, and is worse than none.
- Every change lands in `CHANGELOG.md` with a date.
## Related formats (non-normative)

A five-territory survey of adjacent formats, with what each does and what
it lacks, is in the companion document `DESIGN-HISTORY.md`; the systems it
covers are listed in the informative references below. Two elements of this format appear in none of the surveyed systems: the
standings ledger (append-only, per-person, reasoned, human-only, with
dispositions computed), and the evidence primitive of a verbatim quote
checked against an immutable captured copy. One imported caution: CiTO's
forty typed citation relations failed of manual-annotation burden; this
format's four relations rely on machine proposal with human ruling to stay
below that threshold.

## Security and privacy considerations

- Classification is edge-checked. Each corpus carries a classification in
  the corpus registry, and the reference direction is constrained: a record in a
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
