---
title: "The Epistemic Record Format"
subtitle: "Specification: the record types, the data model, and the invariants, stated so an implementer can build to them or diff an existing system against them."
spec_version: "0.9.0"
status: draft
last_updated: 2026-08-24
generated: 2026-08-22
model: claude-fable-5
---

# The Epistemic Record Format

Specification, v0.9 (draft). The abstract and status are in `README.md`;
the change history is in `CHANGELOG.md`; how the format got this way is
`docs/history.md`, the fields it draws on are `docs/influences.md`, what it
deliberately does not do is `docs/purpose.md`, what was ruled out is
`docs/non-goals.md`, and what it does not do yet is `docs/backlog/`.

**What is normative.** Three things, and nothing else: this document; the
data model, [`erf.schema.json`](erf.schema.json) (section 3); and a
binding document, for any corpus exchanged in that binding
([`bindings/yaml-markdown.md`](bindings/yaml-markdown.md) today). Where a
rule leans on a standard, CommonMark, Unicode, RFC 3339, CSL, SemVer,
SPDX, the standard is cited and governs its own ground. Everything else in
this repository, the reference implementation, the conformance suite and
its case files, the type rendering, the trials and the history, is an
instrument or a record and binds nothing.

## 1. Scope and conformance

This format records four things: what a source *said* (atoms over its normalized text), what an author *claims* (claims), what was *searched* and what it
yielded (surveys), and where people *stand* (standings). What was *done* about any of it
(decisions, actions, outcomes) is out of scope: a neighboring system may
consume these records, and an activated bet plus its standing entries covers
the common case.

A conforming implementation stores, serializes, and validates the record
types of section 3 under the invariants of section 6. The specification is
written to be handed to an implementer (human or LLM) to build from, or
diffed against an existing system requirement by requirement.

Requirements are numbered (`ERF-n`) and use RFC 2119 keywords: MUST
(violation means non-conformance), SHOULD (default with legitimate
exceptions; a departing system should know and say so), MAY (declared
option; differing here is flavor, not divergence). Passages set as notes
are non-normative: they explain choices and bind nothing.

### Conformance classes

Conformance is claimed per class, not against the whole document:

- Record: a single atom, claim, or survey. Binds the data model
  (section 3) and its record type's requirements (section 4).
- Corpus: a collection of records under one declaration. Binds the
  invariants (section 6), the declaration (the schema (`CorpusDeclaration`)), the authoritative
  home (`ERF-62`), and the source list (the schema (`SourceList`), `ERF-4`, the status vocabulary (section 5)).
- Producer: a tool or process that writes records. Binds the serialization
  rules (section 7) and the producer SHOULDs of section 4 (for example
  `ERF-20`). Producers are strict: they write only defined fields,
  legal values, and self-describing files.
- Consumer: a tool that reads records. Consumers are tolerant: a consumer
  MUST NOT reject a corpus over unknown fields, unknown types, or records
  it cannot interpret. It reads what it understands and preserves the rest
  as opaque data, reporting what it did not recognize (the same stance the
  Open Knowledge Format takes).
- Validator: a tool that checks. Binds every machine-checkable MUST that
  applies to the input it accepts, including section 6 in full, the
  record-type requirements of section 4 (the quote check, the verdict and
  stance vocabularies, ids, dates, search acts, narrative bindings), the
  serialization rules of section 7, and the declaration and source list
  named under the Corpus class. A MUST is machine-checkable when its truth
  is decidable from the corpus and the files it holds alone, without a
  network, a judgment, or a second party. The list illustrates the duty
  and does not bound it: a tool that never opens a normalized text or
  parses a narrative binding is not a validator. A validator MUST name the
  requirements it does not check, and a deployment-wide check (`ERF-36`)
  run over a single corpus MUST be named as partial.

Strict producers, tolerant consumers: divergence is caught by validators
and surfaced, never by consumers refusing to read.

**A flag is not a violation.** A validator reports two kinds of thing, and
they answer different questions. A violation says the corpus does not
conform. A flag says something here is worth a person's attention, and a
corpus carrying flags and no violations conforms. Flags exist because
several conditions this format cares about can arise without anyone editing
the record that carries them: an atom withdrawn elsewhere strands the
standing that faced it (`ERF-35`), a claim edited elsewhere ages the
narrative bound to it (`ERF-32`), a premise retired elsewhere hollows the
argument above it (`ERF-43`). Making any of those a violation would let one
person's permitted act make another person's untouched corpus
non-conforming, so the format flags instead. A consumer MUST NOT present a
flag as conformance failure, and MUST NOT hide one either: the whole point
is that someone looks.

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
  one body text, which for an atom is empty (section 4.2).
- *corpus*: a body of work owning records; a research program, an
  engagement, a venture, or the personal corpus. Also the natural unit of
  confidentiality: which corpora may travel together, and which may cite
  which, are deployment policies this version records nothing about.
- *source*: the work a quote came from, listed once per corpus with its
  citation, locator, and normalized text (section 4.1). Not a record: nobody
  asserts a source.
- *normalized text*: what a source's raw file becomes after extraction,
  excerpting and normalization; the only thing checks run against, never
  the live web. *raw file*: the source as it arrived, before any of that.
- *attester*: whoever is speaking in a source's text: the person or body
  whose word a quote carries, as distinct from the document carrying it.
  A vendor's page attests the vendor; a forum post attests its poster.
- *substrate*: the system holding a corpus's records, whether a git
  repository, a wiki, or a database (section 8).
- *actor*: `human:<id>` for a person, `<producer>/<version>` for a model
  or agent, `process:<id>` for automation. Every actor id MUST follow this
  convention. Writing and confirming are separate acts recorded in separate
  fields: who wrote a record need not be who checked it.
- *owner*: the corpus's responsible person, per its declaration.
- *deployment*: the set of corpora read and cited together, under one
  operator or organization. Record ids are unique within a deployment
  (`ERF-36`); between two deployments a bare id promises nothing.
- *unbacked*: a reading of a claim's fields, never a field. A claim is
  unbacked when it carries no `atoms_for`, no `surveys` and, for an
  argument, no premises (`ERF-24`). It is a state and not a fault: a claim
  written before its evidence is sought is unbacked and conforms, and a
  corpus built from its narrative down is mostly unbacked for most of its
  life. The rules of this format describe a corpus's state, whatever
  order it was built in. Read the same way: no atoms and no survey means
  unsearched; a survey and no atoms means searched and nothing found,
  which is what a survey records (section 4.5). A consumer that shows
  unbacked claims says whether anyone stands on each.
- *disposition*: the computed reading of a claim's standings, one of
  `proposal`, `active`, `contested`, `rejected`, `retired` (`ERF-41`).
  Never a stored field.
- *narrative binding*: a marker closing a passage of prose, naming
  the claims that passage rests on and quoting a verbatim anchor from it,
  so software can find the passage again after the prose moves
  (`ERF-31`). Always written in full: "binding" alone reads as a
  programming term.

## 3. Data model (normative)

The data model is [`erf.schema.json`](erf.schema.json), a JSON Schema
2020-12 document at the root of this repository, and it is normative: a
file conforms to the model when it validates against the schema, with its
markdown body attached as `body` where the model has one (a claim, a
survey, a narrative). The schema describes the JSON data model, not any
wire; every binding (section 7) maps onto it. It carries the shape rules
this document once stated in prose: which fields exist and which are
required, the closed vocabularies, the three actor forms and their
disjointness, the precisions a date may take, and the conditional that a
source which ships names its normalized text while one which does not
names its reason. Where a requirement below is marked *Shape*, the schema
holds the enforceable form and the requirement holds the reason.

What a schema cannot say lives in sections 4 to 7: anything about more
than one record (references resolving, ids unique, the premise relation
acyclic), anything computed rather than stored (disposition, staleness,
the quote check), and every obligation on an act (verbatim, as the
instrument reported it, only a person takes a stance). Those are the
format's argument, and they are prose because no notation checks them.

The six kinds of file, discriminated by `type`: `atom`, `claim` and
`survey` are records; `corpus` is the declaration, `sources` the source
list, `narrative` a document. Lists are total in the model and MAY be
omitted on the wire when empty; a reader materializes them (`ERF-73`,
`ERF-56`). A field the schema does not require asserts existence when
present: a `citation` means structure exists, a `received` means a fetch
happened, a `last_modified` means an edit happened. `types/erf.ts` is a
TypeScript rendering of the schema for the reference implementation, held
to it by a gate, and is not normative.

- **ERF-73** Every document a corpus holds MUST validate against
  `erf.schema.json`, with its body attached as `body` where the model has
  one. A document is the declaration, the source list, a record, or a
  narrative; a held raw or normalized file is an artifact, not a document,
  and carries no `type`. This is the whole of the format's shape, and the
  reason each definition takes the shape it does is written on the
  definition: a source's `citation_text` refuses a URL because a citation
  names a work and a locator names a copy; a standing's `by` is a person
  because only a person takes a stance; a claim has no state field because
  its disposition is computed; a narrative has no evidence, standings or
  disposition because nothing about it is adjudicated. Until 2026-08-26
  each of those was a numbered requirement beside the schema that forced
  it, and four independent readers found the same thing: a rule the
  schema already enforces is a rule with no content. They retired, listed
  under change control, and the schema is the requirement.

### 3.1 Field reference

An index from field to the requirements that constrain it, by record
type. Definitions live with the requirements; a field marked *guidance*
is bound by the data model alone, with advice in the section named.

| Atom field | Constrained by |
|:--|:--|
| `id` | `ERF-13` |
| `type`, `corpus` | `ERF-54` |
| `finding`, `finding_audit` (each entry's `auditor`, `verdict`, `timestamp`, `protocol`) | `ERF-11`, `ERF-11`; guidance in 4.2 |
| `quote` | `ERF-6`, `ERF-52` |
| `source` | `ERF-4` |
| `source_quality` | `ERF-9`, `ERF-10` |
| `as_of_date`, `limitations` | `ERF-14` |
| `created`, `last_modified` | `ERF-47`, `ERF-48`, the schema (`ActorStamp`) |

| Claim field | Constrained by |
|:--|:--|
| `id` | `ERF-36` |
| `type` | `ERF-54` |
| `corpus` | `ERF-17` |
| `title`, `body` | `ERF-18` |
| `epistemic_kind` | `ERF-24` |
| `atoms_for`, `atoms_against` | `ERF-23` |
| `surveys` | `ERF-25` |
| `edges` | `ERF-43`, `ERF-44` |
| `standings` | the schema (`StandingEntry`), `ERF-20`, the schema (`HumanActor`), the schema (`StandingEntry`), `ERF-40` |
| `evidence_audit` | `ERF-24`; guidance in 4.4 |
| `created`, `last_modified` | `ERF-47`, `ERF-48`, the schema (`ActorStamp`) |
| `short_name`, `families`, `semantic_query` | guidance in 4.3 |

| Survey field | Constrained by |
|:--|:--|
| `id`, `title`, `conducted`, `prior_survey`, `body` | `ERF-28` |
| `type` | `ERF-54` |
| `corpus` | `ERF-17` |
| `searches` (each act's `tool`, `query`, `scope`, `hits_reported`, `timestamp`) | `ERF-26`, `ERF-27`, `ERF-28` |
| `notable_results` | `ERF-27` |
| `last_modified` | `ERF-28`, `ERF-48` |

| Source field (not a record) | Constrained by |
|:--|:--|
| `id`, `title`, `spec_version`, `owner`, `classification` (declaration) | schema `CorpusDeclaration`; `ERF-54`, `ERF-60`, `ERF-61` |
| `citation_text`, `citation` | the schema (`Source.citation_text`), `ERF-8` |
| `received.url`, `received.path`, `received.digest`, `received.timestamp` | `ERF-2`, the schema (`Received`), `ERF-71` |
| `status`, `normalized`, `normalized_digest`, `reason` | `ERF-1`, `ERF-4`, the status vocabulary (section 5), `ERF-71` |
| `licence`, `licence_name` | `ERF-68` |
| `excerpt.by`, `excerpt.timestamp` | `ERF-69` |
| `extraction`, `normalization` | `ERF-70` |

How records are found: atoms are retrieved by embedding `finding` and
`quote`. The finding is written to be checkable away from its source,
which makes it the intended embedding target (this retrieval path is what
replaced atom tags). Claims are retrieved by `semantic_query`. The
mint-time evidence sweep runs a claim's `semantic_query` against the
deployment's atom and source indexes in both directions: candidates for
`atoms_for` and `atoms_against` alike.

### 3.2 Naming

Field names are `snake_case`
alike: serialization fidelity outranks TypeScript idiom, so every example
stays copy-pasteable between this document and a file. Type aliases are
PascalCase and self-sufficient out of context (`EpistemicKind`, not
`Kind`). The conventions that govern how future names are chosen are in
`docs/history.md`; they bind whoever edits this specification, not an
implementer reading it.

## 4. Record types

Each record type is stated the same way: what it is for, then how to write
one well, then the numbered promises the format makes about it. The
guidance is advice and binds nothing; the numbered requirements are what
conformance means.

### 4.1 The source

A source is whatever a quote came from: a web page, a received report, a
transcript, a book. A source is not a record: it carries no created stamp,
no standings, and no disposition, because nobody asserts a source. Each is
listed once in the corpus's source list and shared by every atom that
quotes it, which is what keeps one work's citation, locator, licence, and
normalized text stated in one place rather than repeated on each atom and
free to drift apart. The format never reads a raw file at check time. It
reads the source's *normalized text*, which is what makes a check
re-runnable years later and what turns a dead link into weakened provenance
rather than a broken check. A worked source entry is in the binding
document (section 7).

Where a source has no `citation` block, write `citation_text` as "Author,
Title (venue, year), locator when it matters"; the upgrade path to
exactness is the citation block.

Take the raw file when you first read something. Legacy material is taken
the next time it is read or used, and its atoms are minted then; a corpus
is not retrofitted wholesale, because a file taken long after the reading
is evidence about today's page rather than about what was read.

- **ERF-1** Every check MUST run against a source's *normalized text*,
  never the live web, so a source without one has no verdict. It
  is the output of the corpus's text pipeline: the raw file as received,
  then extraction to CommonMark, then a passage selected from it, then
  normalization. Normalized text is CommonMark (`ERF-67`), which is what
  the fold of `ERF-51` renders. Where a source arrives already as clean
  CommonMark the pipeline is empty and the normalized text is the file
  itself.
- **ERF-2** A raw file is immutable: a revision arriving later MUST be a
  new source, never an overwrite. A corpus that holds the raw file records
  where, in `received.path`; a corpus that does not holds `received.url` and
  `received.digest` instead, which is what lets a reader obtain the same
  bytes. A source whose raw file is mutable at its location, a web page
  above all, MUST record `received.timestamp`, the date it arrived, because
  otherwise nothing says which version was read.
- **ERF-4** Every atom MUST name a source that exists in the corpus's
  source list. Whether the source ships its normalized text or records
  why none is held is the schema's conditional on `status`; that absence
  is explicit rather than silent is what makes a source list checkable,
  because a validator can tell a recorded absence from an omission and
  cannot tell an omission from an oversight.
- **ERF-68** A source whose normalized text ships SHOULD name the licence
  that permits it as an SPDX identifier where one exists, with the plain
  name alongside, and a text shipping under no licence as a short
  quotation MUST carry `status: shipped-as-quotation`. *Shape:
  `Source.licence`, `Source.status`.* An identifier matches or it does
  not; prose matches by eye. SPDX names a licence and never the
  redistribution judgment, which stays the status vocabulary (section 5)'s. An absent licence
  otherwise reads as an oversight rather than a different basis.
- **ERF-69** A source's normalized text MAY be an excerpt of the work
  rather than a whole copy, and MUST then record who selected the passage
  and when (`excerpt`). It MUST contain the quoted passage together with
  enough adjacent text for the passage's place in the work to be legible: a
  text holding the quote alone proves nothing, because it is a copy of the
  thing it is meant to check. The excerpt route exists because the format
  needs verifiability and not republication, and because a short quotation
  with attribution is available where republication of the work is not.

  Selecting a passage is the one step of the pipeline no tool can be named
  for, so it is attributed instead. An LLM may select; `excerpt.by` records
  which, on the same footing as any other actor, and a selection that
  misleads by omission is a judgment failure attributable to it.

  Fidelity, unlike selection, is checkable and MUST be checked by anyone
  holding the raw file: the normalized text MUST occur, under the folding
  of `ERF-51`, in the normalization of the whole extracted source. This is
  the quote check one level up, and it is what keeps a fallible selector
  from silently altering what it selected. A reader without the raw file
  performs it by obtaining the file at `received.url`, confirming
  `received.digest`, and re-running the tools of `ERF-70`.

- **ERF-70** Where normalized text was produced from a raw file in another
  format,
  the source MUST name the extracting tool and its exact version
  (`extraction`), and that tool MUST be deterministic: the same tool at the
  same version, given the same source bytes, produces the same text. A
  non-deterministic tool MUST NOT be used to produce normalized text. Where the
  extracted text was then normalized, by reflowing wrapped lines, repairing
  hyphenation, or dropping export artifacts, the source MUST name the
  normalizing tool and its version too (`normalization`). Both fields are
  absent when the step did not happen: a source that arrived as text needs
  no extraction, and text nobody normalized needs no normalization.

  The extraction's own output is not retained. Both tools are named and
  deterministic, so anyone holding the raw file reproduces it exactly, and
  a stored copy would prove nothing the two names do not.

  Naming the instrument rather than specifying the transformation is the
  same choice `ERF-26` makes for a search act, and for the same reason: no
  standard defines a faithful text projection of a PDF or a web page, and a
  named instrument is reproducible where an unnamed transformation is not.
  The format therefore never says what good cleanup is, which it cannot know
  for a table, a code block, or a line of verse where the line structure is
  the content. It requires only that whatever was done is named and can be
  run again.

> *Note (non-normative):* an optical character recognition layer already
> embedded in a source artifact is not a source of nondeterminism: the
> recognition ran once, before the artifact existed, and the digest of
> `ERF-71` pins its result, so reading that layer is as reproducible as
> reading any other text. Running recognition oneself is the
> non-deterministic act, and this requirement forbids it as a pipeline
> step. An author who needs one runs it, reads the result, and authors the
> normalized text from what they read, which is what it already is.
- **ERF-71** A source whose normalized text is an excerpt or a conversion SHOULD
  carry `received.digest`, the cryptographic digest of the retrieved
  artifact with the algorithm named ("sha256:<hex>"). The locator and the
  digest together close the step the format cannot otherwise check: a
  reader who retrieves the artifact at `received.url` confirms from the
  digest that it is the one the author held, and re-runs the conversion
  under `ERF-70` to confirm the excerpt occurs in it. Where the corpus
  holds the artifact, a recorded `received.digest` MUST match it, and a
  recorded `normalized_digest` MUST match the normalized text; a digest
  is a statement about bytes the validator can read. A digest is worth
  recording only where the location serves stable bytes; a page that
  differs on every fetch cannot be pinned, and its source simply carries
  no digest, which itself tells a reader what kind of source it was.

### 4.2 The atom

One piece of evidence: a verbatim quote, a finding, and the trail. A
worked atom is in the binding document.

**Writing one well.** The schema checks structure; it cannot check craft.
A good finding is one sentence a stranger could check: it states what the
quote shows rather than restating the quote, it names the actor and the
time scope, and it hedges exactly as hard as the source does ("states", not
"proves"). Compression is a defect. Redundancy that makes a finding
checkable away from its context is doing work, not padding.

The atom names its source and keeps its own `source_quality`, and the
split is deliberate: identity, locator, licence, and normalized text describe the
work and live once on the source (section 4.1), while the grade is a
judgment about how much weight the attester's word carries *for this
finding* (`ERF-9`, `ERF-10`), so two atoms may legitimately grade one
source differently: the same document can carry a first-hand fact and a
relayed one. Where `source_quality` is `medium` or `low`, put the reason
in `limitations`, so a reader learns what is thin rather than only that
something is.

The caveat field is named `limitations` rather than "warrant" deliberately:
in Toulmin's vocabulary a warrant is the licence from evidence to claim,
the opposite role, and the borrowed name guaranteed misreading by trained
readers.

Only the atom has this field, and the asymmetry is the rule rather than an
oversight: **a record with a body carries its caveats there.** Claims and
surveys have bodies and use them. The atom has none, so `limitations` is
not a caveat slot bolted onto prose that already exists, it is the atom's
only prose.

- **ERF-6** The `quote` MUST be verbatim from the source's normalized text. An omission
  inside a quote MUST be written `[...]`; bare `...` is reserved for dots
  the source itself contains. A producer MUST take a quote
  from the normalized text by copying, a substring operation performed by
  a tool, and MUST NOT regenerate it: an author that retypes, an LLM
  above all, tidies what it retypes, and a tidied quote is the author
  guessing at their own evidence. The check exists to say so.
- **ERF-8** When `citation` is present it is canonical: it MUST carry
  everything the rendered `citation_text` string shows, chapter,
  translator, and edition included, and `citation_text` MUST be rendered
  from it. The default rendering style is Chicago, via CSL; a deliverable
  MAY override it.
- **ERF-9** `source_quality` MUST grade one axis, how much weight the
  attester's word carries for the fact the finding conveys, the weaker of
  two inputs governing: provenance distance, the hops between the source's
  text and the fact, and attester accountability, whether the source is
  identifiable, answerable and positioned to know. *Shape:
  `SourceQuality`.* It MUST NOT encode audit state, which is
  `finding_audit`'s, or excerpt fidelity, which is the check's; a consumer
  wanting one trust signal computes it from the three.

| Value | The attester and the chain |
|:---------|:-------------------------------------------------------------|
| `high` | Direct and accountable: a regulator or court filing, an organization's disclosure made under legal or regulatory accountability, a named study reporting its own data, a primary read directly. |
| `medium` | An identifiable intermediary reporting someone else's fact, or a first party with an interest in the answer: trade press, an analyst note, a vendor's claim about its own product, a one-hop relay. The same organization can attest at both grades: its audited filing is accountable, its marketing page is interested. |
| `low` | An unaccountable or unidentifiable attester, or a chain not yet pulled to primary: a forum comment, an aggregator citing an unnamed original. |

- **ERF-10** The grade MUST be assessed against the substance the finding
  conveys, not against the bare fact that someone uttered it. Reported
  speech does not raise it: "a commenter reported X", sourced to an
  anonymous forum, stays `low`, because the reader's question is whether X
  holds, not whether someone said it. A finding whose subject *is* discourse
  itself, what a population says, believes, or claims, MUST say so in its
  own words; the utterance is then the substance, a recorded identified
  utterance is direct and accountable, and the grade can be checked against
  what the atom attests.
- **ERF-11** The judgment (does the quote, in context, support the
  finding?) is not recomputable and MUST be recorded per auditor in
  `finding_audit`, with the protocol version that produced it; the
  mechanical check (the normalized quote occurs in the normalized text) is
  recomputable by anyone holding the corpus and its texts, so no field
  holds its result, and a result written under the `x_` namespace carries
  no meaning and is never read as the check. Verdicts rendered under different protocol versions MUST NOT be read
  as like for like, which is why the protocol travels with the verdict and
  why an auditor's identity, a hosted model id whose weights drift under a
  stable name, is recorded beside it. The `auditor` is a bare model or tool
  identifier (`deepseek-v4-pro`), deliberately not an `Actor`: an audit
  entry names the instrument that rendered a verdict, not a role in the
  practice, and it is read together with its `protocol`. A failed, unparseable or
  abandoned audit MUST NOT be written as a verdict: an audit that produced
  nothing did not happen, the atom stays unaudited and the remedy is to
  run it again, because a tool failure in the field that holds a judgment
  is a judgment to everything downstream. Disagreeing with a verdict is a
  standing on the claim, never an edit to the verdict.
- **ERF-13** An atom's `id` MUST be permanent: never renamed and never
  reused. Its shape, a mint-time prefix and a sequence number, is the
  schema's (`AtomId`).
- **ERF-14** `as_of_date`, where present, MUST record the date the fact
  is true of, at the precision the source gave and no finer: a year, a
  year and month, or a full date. *Shape: `AsOfDate`.* A figure true of a
  period carries the period's end; a statement about the future carries
  the date it was made, since what is true of that date is that someone
  expected it. `limitations` records the caveat about the evidence,
  whatever its kind.

### 4.3 The claim

A statement that can be true or false, one a person could stand behind or
dispute. One record per claim. The record carries the proposition; who
actually stands where is recorded in `standings` (a claim with no stances is
a proposal, and a claim may be tracked without anyone standing behind it);
what the evidence says is recorded in `atoms_for` and `atoms_against`.
Evidence against a claim weakens its position, never its identity: it is the
same statement, standing in a worse light. A worked claim is in the
binding document.

The example ships as a proposal: no one has stood behind it, so its
`standings` ledger is empty and therefore omitted from the file
(`ERF-73`), and its computed disposition is *proposal*. The spec invents no
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
- **ERF-17** A record's `corpus` MUST name the corpus the deployment
  declares. Changing it is a promotion or transfer that stamps
  `last_modified` (`ERF-48`) and is explained in working notes; it MUST NOT
  be written as a standing, because a bookkeeping note in the ledger moves
  the disposition (`ERF-41`).
- **ERF-18** `title` MUST state the claim; it is the normative statement.
  The body SHOULD open by restating it, and keeping the restatement
  verbatim is what makes later drift visible to a reader; whether an
  opening in other words still states the same claim is a reading, so no
  rule numbers it. Beyond that restatement the body is the one
  operator-authored text on the record, and carries the working notes.
- **ERF-20** Producer tools SHOULD stamp each standing entry with the
  evidence sets attached at ruling time, by id
  (`evidence_at_stance: {atoms_for: [ids], atoms_against: [ids]}`). Which
  evidence the ruler faced is the one fact about a ruling's context that
  cannot be recovered later, because attachment events are recorded
  nowhere. The field holds ids and nothing else: drift, an atom modified
  after the stance or a verdict newer than it, is derivable from
  timestamps, and a count would hide the swap of one atom for another,
  which is the staleness the field exists to expose.
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
  the statement, and do the `atoms_against` undermine it? Where the
  observation's backing includes `surveys`, the audit judges the reading
  as scoped (`ERF-25`): does the recorded coverage carry what the claim
  takes from it? For an `argument`: granting its premises, does the
  conclusion follow? An argument's premises are the targets of its own
  outgoing `assumes` edges together with the claims that carry `supports`
  edges pointing at it; `conflicts-with` and `decomposes-into` name
  tension and structure, never premises. `bet` and `commitment` owe no
  backing, so they have nothing to audit; auditability is computable from
  the kind.
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
`surveys` list and no against side. A worked survey is in the binding
document.

**Writing one well.** How often a fruitful survey is re-run is a question
for whoever runs the practice, not for the format. Describe the search in
the body: what you were after, what surprised you, what you would search
differently next time. A survey cited for an absence or a sparseness
reading should close by stating its coverage bounds, what the acts did not
cover and how deeply hits were inspected, because that is what a reader
weighs when an absence is doing work. A complete search of a closed corpus
correctly has nothing to state.

- **ERF-26** Each search act MUST name its concrete instrument in `tool`
  and its `query` in that instrument's own terms, and MAY name the `scope`
  that applied. *Shape: `SearchAct`.* A category ("web search") is not an
  instrument, and yields are comparable only where instruments are named.
  For a manual review the query is the universe inspected.
- **ERF-27** `hits_reported` MUST record each act's yield as the
  instrument reported it, as text, and MUST NOT state precision the
  instrument did not give. *Shape: `SearchAct.hits_reported`.*
  `notable_results` is the curated subset: near-misses with why they fall
  short, exemplars with why they matter, minting atoms where a hit
  deserves quoting.
- **ERF-28** What a survey conducted is immutable: `searches` and each
  act's reported yield MUST NOT change after the fact, because a search
  already run cannot have run differently. A re-run of the same sought is
  a new record, SHOULD name its predecessor in `prior_survey`, and its id
  SHOULD end with the conducted date. Record-keeping around the acts may
  still move (a corpus transfer, a body note added, a `notable_results`
  entry gaining its `atoms` once a hit is minted), and any such edit
  stamps `last_modified` (`ERF-48`). The `title` MUST state what was
  sought. An individual act MAY carry its own `timestamp` where a survey
  spans sittings; absent one, an act inherits the survey's `conducted`
  timestamp. Staleness of a claim's survey backing is computed from
  `conducted` timestamps, never stored.
> *Note (non-normative):* the weight of an empty search is the relation
> between the universe searched and the universe the claim is about. A
> world-claim over the world's indexes (web, preprint servers, patent
> databases): absence is real, defeasible, decaying evidence. A world-claim
> over a private sample (a curated thousand-volume library): absence is
> nearly no evidence; the sample says something about its curation, nothing
> about the world; say so in the body when recording such an act. A
> closed-corpus claim with a complete search of that corpus: absence is
> conclusive, and there are no limitations to state. The same relation, read
> from the other side, is why `conducted` admits machine actors: searching
> is machine work, and the judgment that the coverage carries the claim
> stays where judgment lives, in the citing claim's standings and its
> backing audit.

### 4.6 The narrative and its narrative bindings

A narrative is a document written for people: an essay, a brief, a memo.
It is prose, authored by a person and never generated. Prose alone has a
problem: assertions live inside sentences, so nothing marks what a passage
commits to; the writer re-derives old reasoning; readers argue with
impressions; and when the thinking underneath changes, the prose keeps
saying what it said. Narrative bindings are the fix, and they are all this
format asks of a narrative. Whether a second document is also compiled from
the bound claims, as a structured list a collaborator can dispute line by
line, is a matter for whoever writes the narrative.

- **ERF-31** A passage that asserts something SHOULD end with a narrative
  binding: a marker naming the claims the passage rests on, an anchor of a
  few exact words from it, and `bound-at`, the date the binding was made.
  Every part is required; every id MUST resolve to a claim; and the anchor
  is checked against its passage under the test a quote meets (`ERF-52`),
  the fold and whole words. A binding's passage is the text from the end of
  the previous binding's marker, or the start of the body where there is
  none, to the start of its own marker. A candidate that fails the
  binding's grammar is not a binding, closes no passage, and MUST be
  reported rather than skipped: a binding dropped in silence makes the
  claims it named vanish from the narrative. An anchor that does not occur
  in its passage is a flag and never a violation, on section 2's
  principle: anchors break for the ordinary reason that someone edited
  the prose, and a validator MUST flag it. *Spelling: in the default binding the marker is
  an HTML comment, `YAMLB-1`.*

  The anchor is how software finds the spot after the prose moves; a
  binding without one could only point at a line number, which edits
  destroy. The passage is defined narrowly because the whole body as the
  haystack makes the check nearly vacuous, an anchor lifted from anywhere
  in a long document matching, and a paragraph false-flags a sentence
  split across a break.

- **ERF-32** A narrative binding MUST be checkable: it is stale when the
  claim it names carries a `last_modified` later than the binding's
  `bound-at`, a complete mechanical test using only fields the format
  already defines, and its mixed-precision case resolves as `ERF-47` says,
  to stale. Where the comparison cannot be run at all, because the binding
  failed the grammar and was reported under `ERF-31`, a consumer MUST show
  the binding as staleness `indeterminate` and MUST NOT show it as current:
  a check that cannot tell says look, never rest. A binding reported broken
  under `ERF-31` is the ordinary case of this, and the two go together, one
  saying the record is wrong and the other saying what the reader sees
  meanwhile.
- **ERF-33** A consumer encountering a narrative binding whose id
  resolves to no record MUST report it and MUST NOT drop it silently. A
  narrative claiming support from a record that does not exist is a defect
  in the narrative, and hiding it turns a broken citation into a confident
  sentence. A consumer MUST NOT invent a record to satisfy the reference.
> *Note (non-normative):* staleness detects that the claim moved, not what
> moved, so a typo fix in a body flags its narrative bindings. That is the
> same over-stamping accepted in `ERF-48`, and it errs toward telling a
> reader to look.

## 5. Vocabularies

A source's `status` (schema `Source.status`): `shipped`, the normalized
text ships under a licence that permits it; `shipped-as-quotation`, it
ships as a short quotation under no licence (`ERF-68`, `ERF-69`);
`not-redistributable`, copyright permits reading and not republication,
and the quotation route stays open; `access-restricted`, a term of access
forbids extraction, and a short passage does not answer a contract, so
that route is closed; `licence-unverified`, rights could not be
established, and unverified is not permission. The set grows by
demonstrated instance.

Closed sets. A value outside them is a validation failure, not a dialect.
The sets themselves are listed in the data model (section 3); what they
mean:

Epistemic kinds answer one question: what would check this claim?

- `observation`: data or research settles it; owes atoms.
- `argument`: reasoning settles it; owes premises, which arrive on the
  graph from both sides: the targets of its own `assumes` edges, and the
  claims carrying `supports` edges that point at it (`ERF-24`). Premises
  are claims of any kind; chains terminate per `ERF-43`.
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

- **ERF-35** A reference asserting a *current* relationship MUST resolve
  within the deployment, the corpora read and cited together: `atoms_for`,
  `atoms_against`, `edges.to`, `surveys`, `prior_survey` and each
  `notable_results` entry's `atoms` name existing records **of the type
  the field's name says**: an atom list names atoms, `surveys` and
  `prior_survey` name surveys, `edges.to` names claims. Ids are
  deployment-unique (`ERF-36`), so one lookup finds the record and its
  type says whether the reference is well formed. A
  reference recording a *past state* MUST NOT be a violation when it fails
  to resolve, and a validator MUST flag it instead: `evidence_at_stance`
  names what a ruler faced at the moment of ruling, and a corpus changing
  afterwards is a permitted act that cannot make it non-conforming. The
  test for any later id-bearing field is whether it asserts something now
  or records something then.

- **ERF-36** Every record id MUST be unique across every corpus in the
  deployment, regardless of record type: one atom, claim, or survey may
  hold a given id, and no second record of any type may repeat it.
- **ERF-40** Standings MUST be append-only; an edit or deletion of an
  existing entry is a violation, verified against the substrate's history.
  The audit lists (`finding_audit`, `evidence_audit`) are append-only in
  the same sense, which is why `ERF-48` can exempt appends to all three
  from re-stamping.
- **ERF-41** Disposition MUST be computed, never stored, from the current
  stances alone, each person's newest admissible entry. No standings:
  `proposal`. Otherwise discard every current `withdrawn`, withdrawal
  being exit and not opposition, and read the rest: none remaining,
  `retired`; all `for`, `active`; all `against`, `rejected`; both,
  `contested`. Every entry the schema admits is a stance: `StandingEntry`
  fixes `stance` to the vocabulary, `timestamp` to an instant and `by` to
  a `human:` author (`ERF-73`), so the computation reads them all. Where one person's newest entries
  share an instant, the later in the ledger is current and a validator
  MUST flag the collision: `standings` is an ordered list in the model
  (`ERF-40`), so its order is a fact about the corpus and not about bytes.
  Every input then has exactly one reading. No stance outranks another
  and there is no tie-break: `contested` is the terminal reading of a
  disagreement, and what a use requires of a disposition is the
  consumer's to decide.
- **ERF-42** `rejected` and `retired` MUST NOT be conflated. A rejected
  claim is one every current holder judges false; a retired claim is one
  every current holder has left. Both are terminal readings and neither is
  a deletion; a consumer presenting them identically MUST say which it
  means.
- **ERF-43** An argument's premise closure, followed transitively through
  its outgoing `assumes` edges and the incoming `supports` edges of other
  claims (`ERF-24`), MUST terminate in non-argument leaves. The closure is
  what the edges reach and excludes the argument itself, so a premise-less
  argument has an empty closure and satisfies this vacuously; it is
  unbacked (section 2), which a consumer may show. Vacuity holds for the
  root alone: an argument reached inside another argument's closure that
  has no premises of its own is an argument leaf, and the root violates.
  Self-edges MUST NOT exist in any
  relation. The premise relation over all claims MUST admit no cycles, `X
  assumes Y` and `Y supports X` both making `Y` a premise of `X`, whether
  or not any closure reaches the cycle; a premise id that resolves to
  nothing is `ERF-35`'s violation and is absent from the relation;
  `decomposes-into` MUST admit no cycles likewise. The closure is followed
  over distinct claims, a claim reached twice visited once, so that a
  validator terminates on any input. A validator MUST flag a closure
  containing a claim whose disposition is `retired`, leaf or not: a
  retired premise hollows every argument above it, and it is a flag
  because a withdrawal elsewhere creates the condition with no edit to the
  argument.
- **ERF-44** `conflicts-with` MUST be stored once per pair.
- **ERF-47** Staleness MUST be computed, never stored: a
  `finding_audit`, `evidence_audit`, or narrative binding older than the last change
  to what it judged is flagged stale. What each judged: a `finding_audit`,
  its atom; an `evidence_audit`, the claim and the atoms attached to it,
  so an atom edited or attached after the audit makes it stale; a
  narrative binding, the claims it names. Where the two stamps differ in
  precision and the coarser one cannot order them (a bare date against a
  full instant on the same day), the comparison MUST resolve to stale: a
  check that cannot tell says look, never rest. Two bare dates that are
  equal read as current, because the re-audit that follows an edit lands
  on the same day.
- **ERF-48** Any change to a record MUST set `last_modified`, and it MUST
  NOT precede `created`; that is the whole of what a validator decides
  here, since a corpus holds no prior value to compare against. A
  producer SHOULD advance it with every edit, and one stamping a second
  edit on the same day SHOULD write a full instant, because a bare date
  cannot order within one. The one exception: appending to an
  append-only list
  (`standings`, `finding_audit`, `evidence_audit`) MUST NOT advance it, or
  every audit and every stance would invalidate itself at the moment it was
  recorded. A record never edited since minting correctly carries no
  `last_modified` at all.

> *Note (non-normative):* the rule is deliberately blunt rather than
> enumerating which fields are substantive. An enumerated list is one more
> thing that must move in lockstep with the schema. Over-stamping costs an
> unnecessary re-audit; under-stamping shows a current verdict on a finding
> that has since moved, which is the failure that matters.

- **ERF-50** The mechanical quote check (the normalized quote occurs in
  the source's normalized text) MUST be re-runnable by anyone holding the
  corpus and its normalized texts. When it runs is nobody's business but
  the producer's; that it can run, at any time, by anyone, is the format's.
- **ERF-51** Normalization MUST be this sequence, applied identically to
  the quote and to the normalized text, so that two conforming tools reach
  the same verdict on the same pair:

  1. Render the text as CommonMark (`ERF-1`, `ERF-67`) to its plain text:
     the literal content of every text and code node, a link's text, an
     image's description, nothing for raw HTML, a soft or hard line break
     as one space; each leaf block (a paragraph, a heading, a list item's
     content, a code block) separated from the next by U+2029 PARAGRAPH
     SEPARATOR.
  2. Unicode NFC (UAX #15), then remove every code point carrying the
     Unicode property `Default_Ignorable_Code_Point`: the soft hyphen, the
     zero-width space, the joiners, the byte-order mark.
  3. Collapse each run of Unicode `White_Space` to a single space, and
     trim. U+2029 is exempt: it carries `White_Space`, and a run that
     touches a paragraph separator collapses to the separator alone, so
     the boundaries step 1 drew survive this step.

  Case MUST NOT be folded: case is part of a verbatim quote, and folding
  it lets a mis-cased quote pass a check whose whole job is fidelity.

  Each step is a standard's, not this format's, and that is the point.
  Rendering is what the reader saw, and CommonMark decides what is markup
  exactly, where every approximation in prose failed an honest quote.
  Ignorable code points are invisible and untypeable, an extractor's
  artifact that a PDF's hyphenation leaves by the thousand. NFC makes a
  composed and a decomposed accent one character. The block separator
  stops a quote splicing the end of one paragraph, or a heading, to the
  prose after it as if the source had said them in one breath. The
  conformance suite carries case files for this sequence; they test an
  implementation and bind nothing, since the standards named here do.
> *Note (non-normative):* an earlier sequence had seventeen steps, folding
> quotation marks and dashes, joining broken words, removing spaces before
> punctuation. The folds were unfinishable across scripts and forgave the
> wrong thing: the normalized text is what the check runs against, so an
> author who retypes rather than copies is guessing at their own evidence,
> and a failure telling them to copy is the correct answer. Layout repair
> moved to a named tool in the pipeline (`ERF-70`). The 2026-08-25 trials
> then showed the three steps were necessary and not sufficient, which is
> where the format characters, the marker rule and the paragraph boundary
> came from; `CHANGELOG.md` has the measurements.

  These assume text or markdown, which is what normalized text always is:
  it is authored, not converted at check time. Where the source was a
  PDF, a web page, or an EPUB, the conversion happened once, in the hands of
  the person who ran the pipeline, under `ERF-70`; the format receives its
  result.

  A validator therefore never converts. Facing a normalized text that is not text or
  markdown it MUST report the check as unavailable rather than pass or fail
  it, exactly as it does for a text it does not hold. The prose above
  names each transformation and the standards it cites fix each one; the
  conformance suite's case files test an implementation and bind nothing.
- **ERF-52** Only the exact marker `[...]` MUST be treated as an
  omission, and it is the only wildcard; a bare `...` or `…` is a literal
  source character (`ERF-6`). The quote MUST be split on `[...]` BEFORE
  normalization, because normalization would otherwise fold the marker,
  and each span normalized independently. Every non-empty span MUST occur
  in the normalized text, in order, without overlap, and as whole words:
  each span's start and end MUST fall on a word boundary of the normalized
  text under UAX #29's default rules, with one departure this format
  states: a hyphen (`-`, U+2010, U+2011) between two letters or digits
  does not break a word, so `binding, and management did not recommend`
  does not occur in `the plan was non-binding, and management did not
  recommend`. UAX #29 already reads `12.5`, `1,000` and `board's` as single
  words, so `Revenue fell 12` does not occur in `Revenue fell 12.5
  percent`. The elision marker is not a boundary: the test reads the
  normalized text on either side of the span, whatever sat beside it in
  the quote. Each span is taken at its earliest whole-word occurrence
  after the previous span's end; the earliest leaves the most text for the
  spans that follow, so a quote that can occur does under this rule. No
  span crosses a paragraph separator (`ERF-51`) unless the
  quote holds the same break. A quote whose spans are all empty MUST fail
  rather than trivially pass. The text
  between two spans is unbounded by design: an elision marker is the
  author's assertion that they removed material, and whether the removal
  misleads is a judgment for the audit, not a distance a validator can
  measure.
> *Note (non-normative):* on enforcing uniqueness. Detection belongs to the
> validator, prevention at mint to the producer, and concurrent minting to
> neither: two writers, or two git branches, can mint the same next number
> and merge without conflict. That cannot bite a single sequential writer,
> which is the reference practice; the structural answer when a second
> writer arrives, content-addressed identity in the Trusty URI shape, is
> deferred behind that trigger in `docs/backlog/`.

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

## 7. Serialization and bindings

A corpus is exchanged in a **binding**: a named, versioned document that
says how the model of section 3 maps to bytes. Conformance to the model
is a property of a corpus as loaded into it, and is the same in every
binding; conformance to a binding is a property of the bytes, checked by
that binding's own rules (in the default binding, encoding, parsing and
key structure). A validator for a binding checks both and says which it
is reporting.
Every binding MUST round-trip a corpus through the model without changing
any record, any field, or any verdict (`ERF-53`); a binding that cannot is
not one. The YAML/Markdown binding, version 1
([`bindings/yaml-markdown.md`](bindings/yaml-markdown.md), normative), is
the interchange default: a producer that does not know its recipient's
binding ships that one. Storage is unconstrained (section 8); interchange
is not. A corpus held in a SQL store conforms if it loads to a conforming
model instance, and its export to the default binding is guaranteed to
give every verdict the store did.

The rules below are the model's own. Presence, extension and versioning
hold in every binding. Rules that hold only for the default binding's
files live in its document: `ERF-65`, `ERF-66`, `ERF-67` and the file half
of `ERF-53` moved there on 2026-08-25 keeping their ids, and the
narrative binding's spelling as an HTML comment is the binding's own
`YAMLB-1`. Requirements that speak of a *file* mean a held byte sequence,
raw or normalized, and are the model's.

- **ERF-53** A corpus MUST have a canonical interchange form, given by
  a binding (this section's opening). A store MAY hold a corpus any other
  way it likes, body as one more field, many records in one collection
  document, rows in a database, provided everything the corpus holds
  round-trips without loss: a document through the model, an artifact
  byte for byte. Loss in a document is any difference, after loading, in
  anything it carried: a value the model types, an opaque value the model
  preserves (`citation`'s CSL fields, extension and unknown fields,
  `ERF-57`), the order of any list, a narrative's metadata and text. Loss
  in an artifact is any changed byte, because that is where every
  quote-check verdict lives. Two forms are equivalent when they load to
  the same documents and the same bytes, and a store that returns
  `chapter-number: 36.0` for `36` has lost, whatever its own types say.
  The source list is not a record and is covered all the same: it carries
  the digests, the licence judgments and the normalized-text paths, the
  whole verifiability chain. How records are grouped in a store carries no
  meaning, because each record states its own `type` and `corpus`
  (`ERF-54`).
- **ERF-54** Every document a corpus holds MUST self-describe with
  `type`, no meaning MAY live in a path, exactly one document MUST carry
  `type: corpus`, and every record MUST also carry `corpus`. A held raw or
  normalized file is an artifact and carries no `type`; a source names it
  by path. A consumer discovers a corpus by reading: it walks what it was
  given and dispatches on `type`; a file without one is an artifact or
  not part of the corpus, and a consumer MUST report which it took it for
  (`ERF-57`); a validator MUST reject two declarations. This is what keeps
  the format out of a store's business: what travels is a set of
  self-describing documents and the artifacts they name, and where they
  sit carries nothing.
- **ERF-56** A reader MUST materialize an omitted list-typed field as an
  empty list, because presence means what it says: an omitted list means none,
  never unknown, so a record that omits one is complete rather than
  partial, and an atom nobody has audited yet carries no audit key and is
  a complete record with an empty audit list. An optional mapping that is
  present and empty asserts existence and MUST be preserved:
  `evidence_at_stance` absent says the ruler stamped nothing, `{}` says the
  ruler stamped and faced nothing, which `ERF-20` calls unrecoverable, and
  a producer or store tidying it away destroys it. That a document carries
  no field the declared `spec_version` does not define, outside the `x_`
  namespace (`ERF-72`), is the schema's (`ERF-73`); an unknown key is a
  producer error a validator catches, never a consumer's licence to refuse
  (`ERF-57`). How an empty list is spelled on the wire is the binding's.
- **ERF-57** A consumer MUST preserve unknown fields and unknown record
  types as opaque data, MUST report them, and MUST NOT reject a corpus
  solely because it contains them. Strictness belongs to the producer and
  detection to the validator; a consumer that refuses what it does not
  recognize breaks forward compatibility for everything downstream of it.
- **ERF-72** A field named with the prefix `x_` is an extension field: a
  producer MAY originate one anywhere, a validator MUST NOT report it under
  `ERF-73`, and a consumer treats it as unknown (`ERF-57`). *Shape: the
  `^x_` pattern on every definition.* A field lives under the prefix while
  its need is demonstrated and graduates by entering a later version bare,
  after which the prefixed form is a distinct extension field. Rigid by
  default and extensible in one place, because a format tolerant
  everywhere decays into whatever its implementations write.
- **ERF-60** A consumer MAY refuse a corpus whose MAJOR `spec_version` it
  does not support, and MUST say so when it does. For an unsupported MINOR
  version it MUST either preserve unrecognized content losslessly or refuse
  with an explicit diagnostic; silently dropping what it does not
  understand is forbidden. A validator therefore reads `spec_version`
  before anything else and sets its strictness by it: under a version it
  knows, an unknown record type or field is a producer error (`ERF-73`);
  under a MINOR version newer than it knows, the same content is expected,
  and the validator MUST preserve it, report it as unrecognized, and MUST
  NOT count it as a violation. This is what lets a later minor add a
  record type without an earlier validator calling the corpus
  non-conforming. Reading a corpus under the wrong major version is worse
  than refusing it, because the failure is silent: fields shift meaning
  and nothing in the file announces the mismatch. Migrations between
  majors are explicit.
- **ERF-61** A MAJOR increment of `spec_version` MUST mean that records
  of the previous major are unreadable or read with changed meaning, and a
  MINOR increment an addition an older reader under-interprets but never
  misreads. The changed-meaning clause is what `ERF-60`'s refusal exists
  for: a field that stays parseable while its semantics move announces
  nothing. That the version is SemVer is the schema's.

## 8. Storage

- **ERF-62** A corpus MUST have exactly one authoritative home. Every
  index, database, or embedding built over it is a *projection*:
  recomputable, derived, never consulted as truth.
- **ERF-63** A substrate MAY be anything that preserves records, ids,
  attribution, and an edit history sufficient to verify `ERF-40`. Files
  in git are the reference implementation (history and diffing for free);
  a record's body is one more field in a database.

## Versioning and change control

- The `spec_version` on a corpus declaration (the schema (`CorpusDeclaration`)) governs the semantics
  of that corpus's records; migrations between versions are explicit, never
  inferred from field absence.
- Retired ids, never reused: `ERF-3`, `ERF-5`, `ERF-7`, `ERF-12`,
  `ERF-16`, `ERF-19`, `ERF-21`, `ERF-22`, `ERF-29`, `ERF-30`, `ERF-34`,
  `ERF-37`, `ERF-38`, `ERF-39`, `ERF-45`, `ERF-46`, `ERF-49`, `ERF-55`,
  `ERF-58`, `ERF-59`, `ERF-64`. Fourteen of them retired on 2026-08-26 as
  shape rules the schema already enforced (`ERF-73`). A requirement-by-requirement diff can tell
  a retired id from a lost one only if the list is here.
- Requirement ids are a flat sequence and carry no meaning beyond identity:
  a number does not say which section a requirement lives in, so moving a
  section can never make an id wrong. Ids are stable once published.
  Insertions append; retired ids are never reused and are never refilled.
- The discipline the specification's own editors work under (forcing
  instances, the decision register, the changelog) is stated in
  `docs/history.md`; it binds whoever amends this document, not an
  implementer reading it.

## Related formats (non-normative)

A five-territory survey of adjacent formats, with what each does and what
it lacks, is in the companion document `docs/influences.md`; the systems it
covers are listed in the informative references below. Two elements of this format appear in none of the surveyed systems: the
standings ledger (append-only, per-person, reasoned, human-only, with
dispositions computed), and the evidence primitive of a verbatim quote
checked against an immutable copy of its source. One imported caution: CiTO's
forty typed citation relations failed of manual-annotation burden; this
format's four relations rely on machine proposal with human ruling to stay
below that threshold.

## Security and privacy considerations

- Confidentiality is a deployment policy, deliberately. A deployment
  mixing open and sensitive corpora needs a rule about which may cite
  which, and a compiled open document leaning on sensitive material is a
  leak at build time; this version gives that rule no vocabulary and no
  check, so a deployment that needs the wall must build it where its other
  policies live. The `classification` label on the declaration (the schema (`CorpusDeclaration`))
  is the natural anchor for one.
- Normalized texts travel only where their licences permit. They are, in general, copyrighted third-party works; whether a given
  text ships with a shared or published corpus is a licence and
  deployment question the format records rather than rules on. The source
  list holds the judgment either way: a shipped text names its
  licence (`ERF-68`), a withheld one records the reason (the status vocabulary (section 5)). The
  honest scope of re-checkability follows: anyone holding the corpus *and
  its normalized texts* can re-run that atom's mechanical check; a recipient of the
  records alone holds citations and locators, not proof.
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
- RFC 2119 and RFC 8174 (BCP 14), requirement key words
- CommonMark 0.31.2: spec.commonmark.org
- UAX #15, *Unicode Normalization Forms*, and UAX #29, *Unicode Text
  Segmentation*, default word boundary rules
- Unicode Character Database, `Default_Ignorable_Code_Point`
  (DerivedCoreProperties)
- Semantic Versioning 2.0.0: semver.org
- RFC 3629, *UTF-8, a transformation format of ISO 10646* (STD 63)
- SPDX License List: spdx.org/licenses

### Informative

- *How the format got this way*: `docs/history.md`, this repository
- *Influences*: `docs/influences.md`, this repository
- Gordon and Walton, *The Carneades Argumentation Framework* (CMNA 2006)
- Nanopublication Guidelines: nanopub.net; Kuhn and Dumontier, *Trusty URIs*
- SEPIO: github.com/monarch-initiative/SEPIO-ontology
- Discourse Graphs: discoursegraphs.com (Chan et al.)
- Wikidata data model, Help:Ranking, and property P2241: wikidata.org
- Guru card verification: getguru.com/product/verification
- Nygard, *Documenting Architecture Decisions* (2011); MADR: adr.github.io
- BCP 47 (RFC 5646), language tags. No record carries a language today;
  if one ever does, its value is a BCP 47 tag. Advisory, because a field
  with no forcing instance is not admitted.
- `text/markdown` (RFC 7763) describes a record body. This format
  registers no media type of its own; registration serves
  content negotiation at a scale it has not reached.
- CiTO, the Citation Typing Ontology: purl.org/spar/cito
- scite Smart Citations: scite.ai
