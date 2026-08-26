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
`docs/non-goals.md`, and what it does not do yet is `docs/backlog/`. The normative data model is the TypeScript file
`types/erf.ts`, mirrored inline in section 3.

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

Requirements are numbered (`ERF-7`) and use RFC 2119 keywords: MUST
(violation means non-conformance), SHOULD (default with legitimate
exceptions; a departing system should know and say so), MAY (declared
option; differing here is flavor, not divergence). Passages set as notes
are non-normative: they explain choices and bind nothing.

### Conformance classes

Conformance is claimed per class, not against the whole document:

- Record: a single atom, claim, or survey. Binds the data model
  (section 3) and its record type's requirements (section 4).
- Corpus: a collection of records under one declaration. Binds the
  invariants (section 6), the declaration (`ERF-59`), the authoritative
  home (`ERF-62`), and the source list (`ERF-3`, `ERF-4`, `ERF-5`).
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
  requirements it does not check, and a deployment-wide check (`ERF-36`,
  `ERF-38`) run over a single corpus MUST be named as partial.

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
- *disposition*: the computed reading of a claim's standings, one of
  `proposal`, `active`, `contested`, `rejected`, `retired` (`ERF-41`).
  Never a stored field.
- *narrative binding*: an HTML comment closing a passage of prose, naming
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
omitted on the wire when empty; a reader materializes them (`ERF-55`,
`ERF-56`). A field the schema does not require asserts existence when
present: a `citation` means structure exists, a `received` means a fetch
happened, a `last_modified` means an edit happened. `types/erf.ts` is a
TypeScript rendering of the schema for the reference implementation, held
to it by a gate, and is not normative.

### 3.1 Field reference

An index from field to the requirements that constrain it, by record
type. Definitions live with the requirements; a field marked *guidance*
is bound by the data model alone, with advice in the section named.

| Atom field | Constrained by |
|:--|:--|
| `id` | `ERF-13` |
| `type`, `corpus` | `ERF-54` |
| `finding`, `finding_audit` | `ERF-11`, `ERF-12`; guidance in 4.2 |
| `quote` | `ERF-6`, `ERF-52` |
| `source` | `ERF-4` |
| `source_quality` | `ERF-9`, `ERF-10` |
| `as_of_date`, `limitations` | `ERF-14` |
| `created`, `last_modified` | `ERF-47`, `ERF-48`, `ERF-58` |

| Claim field | Constrained by |
|:--|:--|
| `id` | `ERF-36` |
| `type` | `ERF-54` |
| `corpus` | `ERF-17` |
| `title`, `body` | `ERF-18` |
| `epistemic_kind` | `ERF-24`, `ERF-49` |
| `atoms_for`, `atoms_against` | `ERF-23` |
| `surveys` | `ERF-25` |
| `edges` | `ERF-43`, `ERF-44` |
| `standings` | `ERF-19`, `ERF-20`, `ERF-21`, `ERF-39`, `ERF-40` |
| `evidence_audit` | `ERF-24`; guidance in 4.4 |
| `created`, `last_modified` | `ERF-47`, `ERF-48`, `ERF-58` |
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
| `citation_text`, `citation` | `ERF-7`, `ERF-8` |
| `received.url`, `received.path`, `received.digest`, `received.timestamp` | `ERF-2`, `ERF-7`, `ERF-71` |
| `status`, `normalized`, `normalized_digest`, `reason` | `ERF-1`, `ERF-4`, `ERF-5`, `ERF-71` |
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

Field names are `snake_case` in YAML and in the TypeScript interfaces
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
rather than a broken check.

```yaml
sources:
  pacioli-1494-geijsbeek:
    citation_text: "Luca Pacioli, Particularis de Computis et Scripturis
      (Venice, 1494), ch. 36, trans. Geijsbeek 1914"
    citation:
      type: book
      author: [{family: Pacioli, given: Luca}]
      title: "Particularis de Computis et Scripturis"
      publisher-place: Venice
      issued: 1494
      chapter-number: 36
      translator: [{family: Geijsbeek, given: John B.}]
    received:
      url: "https://archive.org/download/ancientdoubleent00geijuoft/ancientdoubleent00geijuoft.pdf"
      path: raw/pacioli-1494-geijsbeek.pdf
      digest: "sha256:05e58ce3f2589584d7d36446c46e2f74ab14f33ee6d1f0f20ef5e21c2aeaf2aa"
      timestamp: 2026-08-23
    status: shipped-as-quotation
    normalized: normalized/pacioli-1494-geijsbeek.md
    normalized_digest: "sha256:1b9a0c47d3e8f5a2c6b4e09f7d132a8be5c40f6719d2ab83c5e7104f9a6d2b3e"
    extraction: "pymupdf4llm 0.3.4"
    normalization: "pandoc 3.1.11 --wrap=none"
    excerpt: {timestamp: 2026-08-23, by: "agent/claude-sonnet-5"}
```

Where a source has no `citation` block, write `citation_text` as "Author,
Title (venue, year), locator when it matters"; the upgrade path to
exactness is the citation block.

Take the raw file when you first read something. Legacy material is taken
the next time it is read or used, and its atoms are minted then; a corpus
is not retrofitted wholesale, because a file taken long after the reading
is evidence about today's page rather than about what was read.

- **ERF-1** A source's *normalized text* MUST exist before any check runs
  against it, and checks MUST run against that text, never the live web. It
  is the output of the corpus's text pipeline: the raw file as received,
  then extraction to markdown, then a passage selected from it, then
  normalization. Where a source arrives already as clean markdown the
  pipeline is empty and the normalized text is the file itself.
- **ERF-2** A raw file is immutable: a revision arriving later MUST be a
  new source, never an overwrite. A corpus that holds the raw file records
  where, in `received.path`; a corpus that does not holds `received.url` and
  `received.digest` instead, which is what lets a reader obtain the same
  bytes. A source whose raw file is mutable at its location, a web page
  above all, MUST record `received.timestamp`, the date it arrived, because
  otherwise nothing says which version was read.
- **ERF-3** A corpus MUST keep a source list, one entry per work, keyed by
  a source id unique within the corpus. *Shape: `SourceList`, `Source`.*
  A source's citation, locator and normalized text live on the source and
  never on the atom. How the list is stored is the store's business
  (section 8); its interchange form is the binding's (section 7).
- **ERF-4** Every atom MUST name its source, the named id MUST exist in
  the source list, and every source MUST either give the path of its
  normalized text or record that none is held and why. *Shape:
  `Atom.source`; the conditional on `Source.status`.* Absence is explicit
  because a validator can tell a recorded absence from an omission and
  cannot tell an omission from an oversight.
- **ERF-5** A source recording an absence MUST carry a `status` from the
  closed set and a `reason`. *Shape: `Source.status`.*
  `not-redistributable`: copyright permits reading and not republication,
  and the quotation route of `ERF-69` stays open. `access-restricted`: a
  term of access forbids extraction, and a short passage does not answer a
  contract, so that route is closed. `licence-unverified`: rights could not
  be established, and unverified is not permission. The set grows by
  demonstrated instance.
- **ERF-68** A source whose normalized text ships SHOULD name the licence
  that permits it as an SPDX identifier where one exists, with the plain
  name alongside, and a text shipping under no licence as a short
  quotation MUST carry `status: shipped-as-quotation`. *Shape:
  `Source.licence`, `Source.status`.* An identifier matches or it does
  not; prose matches by eye. SPDX names a licence and never the
  redistribution judgment, which stays `ERF-5`'s. An absent licence
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
  under `ERF-70` to confirm the excerpt occurs in it. A digest is worth
  recording only where the location serves stable bytes; a page that
  differs on every fetch cannot be pinned, and its source simply carries
  no digest, which itself tells a reader what kind of source it was.

### 4.2 The atom

One piece of evidence: a verbatim quote, a finding, and the trail.

```yaml
---
id: kwg-117
type: atom
corpus: knowledge-work-governance
finding: "Pacioli's 1494 treatise states the double-entry rule
  explicitly: every ledger entry is made twice, once as a debit
  and once as a credit."
quote: "All entries made in the ledger have to be double entries --
  that is, if you make one creditor, you must make some one debtor."
source: pacioli-1494-geijsbeek
source_quality: high
created: {timestamp: 2026-07-19, by: "agent/claude-fable-5"}
finding_audit:
  - {auditor: deepseek-v4-pro, verdict: SUPPORTED, timestamp: 2026-07-19,
     protocol: finding-audit-v2}
  - {auditor: gemini-3.5-flash, verdict: SUPPORTED, timestamp: 2026-07-19,
     protocol: finding-audit-v2}
---
```

The closing `---` ends the record: an atom's body is empty, so its file is
frontmatter and nothing else (`ERF-53`).

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
  the source itself contains.
- **ERF-7** `citation_text` MUST NOT contain a URL. *Shape:
  `Source.citation_text`.* A citation identifies a work; a locator
  retrieves one copy, and that is `received.url`, naming the artifact
  retrieved rather than a page describing it. A web-native work's own
  identity MAY appear as `citation.URL`. A file received by hand has no
  locator and no `received`.
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
- **ERF-11** The mechanical check (the normalized quote occurs in the
  normalized text) is recomputable by anyone holding the corpus and its texts,
  so its result MUST NOT be stored. The judgment (does the quote, in
  context, support the finding?) is not recomputable: it MUST be recorded
  per auditor in `finding_audit`, with the protocol version that produced
  it. Verdicts rendered under different protocol versions MUST NOT be read
  as like for like, which is why the protocol travels with the verdict and
  why an auditor's identity, a hosted model id whose weights drift under a
  stable name, is recorded beside it. The `auditor` is a bare model or tool
  identifier (`deepseek-v4-pro`), deliberately not an `Actor`: an audit
  entry names the instrument that rendered a verdict, not a role in the
  practice, and it is read together with its `protocol`.
- **ERF-12** A verdict MUST be exactly one of `SUPPORTED`, `PARTIAL` or
  `UNSUPPORTED`, and a failed, unparseable or abandoned audit MUST NOT be
  written as one. *Shape: `Verdict`.* An audit that produced nothing did
  not happen: the atom stays unaudited and the remedy is to run it again,
  because a tool failure in the field that holds a judgment is a judgment
  to everything downstream. Disagreeing with a verdict is a standing on the
  claim, never an edit to the verdict.
- **ERF-13** An atom's `id` MUST be permanent: a mint-time prefix and a
  sequence number (`kwg-117`), never renamed and never reused. *Shape:
  `Id`.*
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
- **ERF-17** `corpus` MUST be written on every record and MUST name a
  declared corpus (`ERF-59`). *Shape: `corpus` on each record.* Changing
  it is a promotion or transfer that stamps `last_modified` (`ERF-48`) and
  is explained in working notes; it MUST NOT be written as a standing,
  because a bookkeeping note in the ledger moves the disposition
  (`ERF-41`).
- **ERF-18** `title` MUST state the claim; it is the normative statement.
  The body SHOULD open by restating it, and keeping the restatement
  verbatim is what makes later drift visible to a reader; whether an
  opening in other words still states the same claim is a reading, so no
  rule numbers it. Beyond that restatement the body is the one
  operator-authored text on the record, and carries the working notes.
- **ERF-19** `standings` is append-only, entries MUST NOT be edited or
  deleted and a correction is a new entry, and each entry's `timestamp`
  MUST be a full RFC 3339 instant with time and offset, never a bare date.
  *Shape: `StandingEntry`.* Precision is required here alone because this
  is the format's only ordered ledger: a bare date and an instant on the
  same day cannot be ordered, and a consumer choosing the newest stance
  would settle a disposition by accident. A bare date stays correct where
  nothing is ordered.
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
- **ERF-21** A standing's `by` MUST be a `human:` actor. *Shape:
  `StandingEntry.by`.* An LLM proposes; only a person takes a stance, and
  a stance speaks for one person, five endorsements being five entries.
- **ERF-22** A claim MUST NOT store a state field: the disposition is
  computed (`ERF-41`). Minting is not a standing: a claim is born with
  none, and a claim nobody has taken a stance on is a proposal. The origin
  story belongs in working notes; origin that carries evidential weight is
  a source: take it, normalize it, and cite atoms.
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
`surveys` list and no against side.

```yaml
---
id: granted-flag-uses-2026-08-22
type: survey
corpus: knowledge-work-governance
title: "Current uses of the granted field across the registered corpora"
conducted: {timestamp: 2026-08-22, by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rnE (BSD grep, macOS)"
    query: "^granted:|^  granted:"
    scope: "every claim and question file in a private working collection
      of corpora"
    hits_reported: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "granted (word-level, --include=*.md)"
    scope: "the same claim and question files"
    hits_reported: "4 lines in 3 files; none a field use"
notable_results:
  - what: "A doc-class granted dimension in a corpus's own documentation"
    note: "A render-layer field of one document class, described in that
      corpus's own documentation; the word's nearest live relative, not a
      record field."
---
```

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
                      ws+ "bound-at=" date ws* "-->"
date     ::= YYYY "-" MM "-" DD
ids      ::= id (ws+ id)*
id       ::= one or more characters, none of them whitespace, '"', '<' or '>'
anchor   ::= '"' char+ '"'
char     ::= any character other than '"' and '\', or one of the
             two-character escapes '\"' and '\\'
ws       ::= any Unicode White_Space character, line breaks included
```

  The grammar is applied to a comment already delimited: recognition finds
  `<!--` followed by `claims:` where CommonMark would read an HTML comment,
  never inside a code span or a code block, and runs it to the first `-->`
  before the grammar sees it, so that a greedy `ids` cannot eat the next
  binding. A candidate whose first `-->` comes after another `<!--`, or
  never, is unterminated: it extends to the end of its own line, so the
  bindings after it stay visible, and it is reported. The escapes are
  decoded before the anchor is folded. Every id MUST resolve to a claim.

  Every part is required. Ids are separated by whitespace, never by commas,
  because a comma inside an unquoted list invites a parser to guess.
  `bound-at` is the date the binding was made, and `ERF-32` is what it is
  for. The anchor is how software finds the spot after the prose moves; a
  binding without one could only point at a line number, which edits
  destroy. It carries two escapes because a grammar that cannot express a
  legal value is a defect in the grammar: a passage whose own words are in
  quotation marks would otherwise have no anchor at all.

  **The anchor occurs in its passage under `ERF-51`**, the same fold the
  quote check uses, applied to the anchor and to the passage alike. A
  binding's passage is the text from the end of the previous binding's
  marker, or the start of the body where there is none, to the start of
  its own marker: a binding closes the passage above it (section 2), and
  the previous binding closed the one before. A candidate that fails the
  grammar is not a binding, closes nothing, and is blanked out of
  whichever passage holds it. The anchor meets the test a quote meets
  (`ERF-52`): the fold, and whole words. Nothing wider serves. The
  whole body as the passage makes the check nearly vacuous, since an
  anchor lifted from anywhere in a long document matches and the
  mechanism that exists to detect moved prose then detects almost nothing;
  a paragraph as the passage false-flags a sentence split across a break.
  This format answers *does this string occur in that text* exactly once, and
  two occurrence tests would be two verdicts for one question. It also
  settles the case that raised this: prose hand-wrapped at some column puts
  a newline inside a sentence, which is a space in CommonMark and a
  collapsed whitespace run under `ERF-51`, so an anchor that reads as one
  phrase matches as one phrase. Nothing here reflows anything, and nothing
  needs to: the fold that already exists is enough.

  **A validator MUST flag an anchor that does not occur in its passage.**
  Anchors break, and they break for the ordinary reason that someone edited
  the prose. A flag rather than a violation, on section 2's principle: an
  edit to the passage is an act the format permits. Without this the
  failure is silent, which is how two anchors in one trial and one in
  another went unnoticed until something else happened to look.

  **A binding that does not match this grammar MUST be reported, never
  skipped.** A comment opening `<!--` followed by `claims:` IS a narrative
  binding: recognizing one and validating one are separate acts, and a
  consumer performs them in that order. Without this rule a required part
  does not make a binding invalid, it makes it invisible, because a comment
  failing the grammar is indistinguishable from any other HTML comment and
  the claims it named simply vanish from the narrative. That is `ERF-33`'s
  failure moved down to the parse layer, and it is the same answer: a
  broken citation reported is a defect, a broken citation hidden is a
  confident sentence.

- **ERF-32** A narrative binding MUST be checkable: it is stale when the
  claim it names carries a `last_modified` later than the binding's
  `bound-at`, a complete mechanical test using only fields the format
  already defines. Where the comparison cannot be run, a consumer MUST show
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
- **ERF-34** A narrative MUST NOT be modelled as a record: it is a
  document carrying `type: narrative`, `title`, `corpus` and `created`,
  whose only structured content is its narrative bindings. *Shape:
  `Narrative`.* It has no evidence, no standings and no disposition, which
  is why it is not a record: nothing about it is adjudicated, and a person
  disputes the claims it binds rather than the prose. `created` takes the
  stamp everything else takes, because a narrative is prose someone wrote
  and who wrote it is the fact a reader most wants.
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
  within the deployment (the corpora read and cited together):
  `atoms_for`, `atoms_against`, `edges.to`, `surveys`, `prior_survey`, and
  each `notable_results` entry's `atoms` name existing records. Ids are
  deployment-unique (`ERF-36`), so one lookup serves every record type.

  A reference recording a *past state* MUST NOT be a violation when it
  fails to resolve, and a validator MUST flag it instead. `ERF-20`'s
  `evidence_at_stance` names the evidence a ruler faced at the moment of
  ruling, and a corpus changing afterwards is an act the format permits,
  so it cannot retroactively make the corpus non-conforming. This is the
  distinction `ERF-43` draws for a retired leaf and `ERF-33` for a
  narrative binding, and it decides how any later id-bearing field is
  treated: ask whether the reference asserts something now or records
  something then.
- **ERF-36** Every record id MUST be unique across every corpus in the
  deployment, regardless of record type: one atom, claim, or survey may
  hold a given id, and no second record of any type may repeat it.
- **ERF-37** A producer MUST verify that an id is unused in the deployment
  before writing a record. The means are the substrate's: a directory that
  cannot hold two files of one name, a unique index, a lookup against a
  list the deployment keeps. The format states the invariant and declines
  to specify the mechanism, because the mechanism is exactly what varies
  between substrates (section 8).
- **ERF-38** A validator MUST reject a deployment containing duplicate
  record ids, regardless of record type.
- **ERF-39** Every standing entry MUST have a `human:` actor and a
  non-empty `why`. *Shape: `StandingEntry`.*
- **ERF-40** Standings MUST be append-only; an edit or deletion of an
  existing entry is a violation, verified against the substrate's history.
  The audit lists (`finding_audit`, `evidence_audit`) are append-only in
  the same sense, which is why `ERF-48` can exempt appends to all three
  from re-stamping.
- **ERF-41** Disposition MUST be computed, never stored, from the current
  stances alone, meaning each person's newest entry. With no standings at
  all the disposition is `proposal`. Otherwise discard every current stance
  of `withdrawn`, because withdrawal is exit rather than opposition, and
  read what remains: nothing remaining means `retired`; all `for` means
  `active`; all `against` means `rejected`; both `for` and `against`
  remaining means `contested`. A standing is admitted to this computation
  only when its `stance` is in that vocabulary, its `timestamp` is an
  instant (`ERF-19`) and its `by` is a `human:` actor (`ERF-21`); any
  other entry is a producer error, MUST be reported, and is treated as
  though it had never been written, so the person's previous admissible
  entry, if any, stays their newest. `ERF-57` obliges a consumer to load
  such a record, and a reading it cannot compute is one it would otherwise
  invent. Where one person's newest entries share an instant, the later in
  the ledger is current and a validator MUST flag the collision:
  `standings` is an ordered list in the model (`ERF-40`), so its order is
  a fact about the corpus and not about any binding's bytes. With that,
  every input has exactly one reading. No stance outranks another and the format supplies no tie-break: `contested`
  is the terminal reading of a disagreement, not a state resolved by
  arithmetic. What any particular use requires of a
  disposition is not specified here: the format computes the reading and a
  consumer decides what to do with it.
- **ERF-42** `rejected` and `retired` MUST NOT be conflated. A rejected
  claim is one every current holder judges false; a retired claim is one
  every current holder has left. Both are terminal readings and neither is
  a deletion; a consumer presenting them identically MUST say which it
  means.
- **ERF-43** An argument's premise closure, followed transitively (its
  outgoing `assumes` edges and the incoming `supports` edges of other
  claims, per `ERF-24`), MUST terminate in non-argument leaves. The closure
  is what the edges *reach* and does not include the argument itself, so an
  argument with no premises has an empty closure and satisfies this rule
  vacuously: what is wrong with such an argument is that nothing backs it,
  which is `ERF-49`'s flag, not that its closure ends badly. Reading the
  root into its own closure would make the same record a violation here and
  a flag there. Self-edges MUST NOT exist, in any of the four relations.
  The premise relation over all claims MUST admit no cycles, where `X
  assumes Y` and `Y supports X` both make `Y` a premise of `X` (`ERF-24`),
  whether or not any argument's closure reaches the cycle: a chain of
  premises that returns to its own argument grounds nothing. A premise id
  that resolves to nothing is `ERF-35`'s violation and is absent from the
  relation. `decomposes-into` MUST admit no cycles likewise. The closure
  is followed over distinct claims, a claim reached twice being visited
  once, so that a validator terminates on any input, conforming or not.
  `supports` was absent from the prohibition while present in the closure,
  and two mutually supporting arguments made a literal traversal run
  forever. A validator MUST flag a closure that contains a claim whose
  disposition is `retired`, a leaf or not, because a retired premise
  hollows every argument above it: a flag rather than a violation,
  like `ERF-49`, because a withdrawal elsewhere can create the condition
  without any edit to the argument, and an act the format permits cannot
  retroactively make a corpus non-conforming.
- **ERF-44** `conflicts-with` MUST be stored once per pair.
- **ERF-47** Staleness MUST be computed, never stored: a
  `finding_audit`, `evidence_audit`, or narrative binding older than the last change
  to what it judged is flagged stale. Where the two stamps differ in
  precision and the coarser one cannot order them (a bare date against a
  full instant on the same day), the comparison MUST resolve to stale: a
  check that cannot tell says look, never rest. Two bare dates that are
  equal read as current, because the re-audit that follows an edit lands
  on the same day.
- **ERF-48** Any change to a record MUST set `last_modified` to a
  timestamp later than its `created` and later than any prior
  `last_modified`. At date precision "later" admits the same day, because
  a bare date cannot order within one; a producer stamping a second edit
  on the same day SHOULD write a full instant, which is what makes the
  ordering it owes recoverable. The one exception: appending to an
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

- **ERF-49** A validator MUST flag as unbacked an `observation` someone
  stands on with empty `atoms_for` and empty `surveys`, and such an
  `argument` with no premises, meaning no outgoing `assumes` edge and no
  incoming `supports` edge (`ERF-24`). The computed warning a render
  shows.
- **ERF-50** The mechanical quote check (the normalized quote occurs in
  the source's normalized text) MUST be re-runnable by anyone holding the corpus and its
  normalized texts; it MUST run as a gate at minting and after any transform that
  moves atoms between homes.
- **ERF-51** Normalization MUST be this ordered sequence, applied
  identically to the quote and to the normalized text, so that two conforming tools
  reach the same verdict on the same pair:

  1. Unicode NFC, then remove every format character (Unicode General
     Category `Cf`: the soft hyphen, the zero-width space, the joiners).
  2. Remove a marker `*`, `_` or `` ` `` that has a word character on
     exactly one side; keep one that has word characters on both sides
     (`MAX_LEN`, `3*4`) or on neither (`a * b`, a lone footnote star).
  3. Collapse each whitespace run (Unicode `White_Space`) to a single
     space, except a run holding a blank line, which is a paragraph
     boundary and collapses to U+2029 PARAGRAPH SEPARATOR; then trim.

  Case MUST NOT be folded. Case is part of a verbatim quote, and folding it
  lets a mis-cased quote pass a check whose whole job is fidelity.

  Three steps, and each earns its place by describing a difference the
  author did not introduce. NFC because an editor may silently compose or
  decompose an accented letter, and the two spellings are one character by
  definition. Format characters go because they are invisible and
  untypeable, an extractor's artifact that a PDF's hyphenation leaves by
  the thousand; left in, each one was a legal place to cut a word in half
  and quote the fragment. The marker rule is CommonMark's own for `_`,
  approximated for the other two: it stops `3*4` folding to `34`, a number
  the source never held. The paragraph boundary stops a quote from
  splicing the end of one paragraph to the start of the next, or a heading
  to the prose under it, as if the source had said them in one breath. A
  word character is a letter, digit or combining mark (Unicode `L`, `N`,
  `M`). NFC and not NFKC, which was the first choice: NFKC is a
  package of compatibility folds, and among the ligatures and fullwidth
  forms an extractor emits, it also folds characters an author retypes,
  the long s of a pre-1800 scan to a modern s and the ellipsis to three
  periods, which `ERF-52` requires to be matched literally. Measured over
  164 quotes in three corpora, NFC and NFKC gave identical verdicts, and
  the only compatibility characters present were 684 long-s glyphs in two
  scans. A ligature or a fullwidth form in extracted text is the extraction
  tool's output, and decomposing it is that tool's job (`ERF-70`) or the
  normalization tool's (`normalization`), both of which the source names. The emphasis markers because the
  normalized text is markdown and the quote is the prose inside it, so a source that
  italicises a word mid-sentence yields `*however*` in one and `however` in
  the other. Whitespace because line structure differs between a text and
  a quoted span and always will.

> *Note (non-normative):* on what this sequence deliberately does not do,
> and why the list is short. An earlier version folded typographic quotes
> to straight ones, folded seven dash variants to a hyphen, joined words
> broken across lines, and removed spaces before punctuation: seventeen
> steps repairing layout damage and forgiving retyped characters. Two
> things killed them. The character folds were unfinishable, covering the
> Anglophone set and not French guillemets, German low quotes, CJK corner
> brackets, fullwidth forms, or two-em dashes, so a French source failed a
> format that claimed to fold quotation marks. And they were forgiving the
> wrong thing: the normalized text is what the check runs against, so an author who
> retypes rather than copies is guessing at their own evidence, and a
> failure telling them to copy is the correct answer. Measured over 160
> atoms in three corpora, dropping the folds newly failed four, and every
> one was a real transcription divergence the folding had concealed.
> Layout repair moved to where it belongs, a named tool in the pipeline
> (`ERF-70`), rather than a rule guessing at information the extractor
> discarded. Which glyph a source used is a fact about the source; a
> consumer that wants it normalized does so at read time, as it does with
> every other reading the format computes rather than stores.

  These assume text or markdown, which is what normalized text always is:
  it is authored, not converted at check time. Where the source was a
  PDF, a web page, or an EPUB, the conversion happened once, in the hands of
  the person who ran the pipeline, under `ERF-70`; the format receives its
  result.

  A validator therefore never converts. Facing a normalized text that is not text or
  markdown it MUST report the check as unavailable rather than pass or fail
  it, exactly as it does for a text it does not hold. The prose above
  names each transformation; the conformance case files
  (`conformance/cases/normalization.txt` and
  `conformance/cases/quote-check.yaml`, this repository) are normative for
  its exact behavior: where a reading of the prose and a case disagree, the
  case governs, and a conforming implementation reproduces every pair.
- **ERF-52** Only the exact marker `[...]` MUST be treated as an
  omission, and it is the only wildcard. A bare `...` and a bare `…` are literal source
  characters and MUST be matched literally (`ERF-6`). The quote MUST be
  split on `[...]` BEFORE normalization, because normalization may fold or
  strip brackets and would otherwise destroy the marker; each span is then
  normalized independently. Every non-empty span MUST occur in the
  normalized text, in order and without overlap, **and as whole words**:
  where a span begins with a word character, the character before its
  occurrence MUST NOT be a word character or a word-internal one, and
  where it ends with one, the character after MUST NOT be either. A
  character is **word-internal** when it joins two word characters: `.`,
  `,`, `:` or `/` between digits (`12.5`, `1,000`, `12:30`); an apostrophe
  between letters (`board's`); a hyphen between word characters
  (`non-binding`). So `Revenue fell 12` does not occur in `Revenue fell
  12.5 percent`, `The board` does not occur in `The board's own review`,
  and `binding, and management did not recommend` does not occur in `the
  plan was non-binding, and management did not recommend`, each of which
  a plain letters-and-digits boundary passed while changing what the
  source said. A span that opens or closes on any other character is
  unconstrained on that side, because that character is the boundary. A
  span never crosses a paragraph boundary (`ERF-51` step 3) unless the
  quote holds the same blank line. Without this rule the check is substring containment, and
  `The cat[...]sat` passes against a text reading "The catapult was heavy.
  Someone eventually sat": an atom attributing to a source words it never
  contained, with a green check. Trimming each span (`ERF-51` step 3) is
  what removed the whitespace that had made it a whole word at its edge.
  The rule applies at every span edge and not only beside an elision,
  because quoting `cat` out of `catapult` is the same fabrication without
  the marker, and a verbatim quotation (`ERF-6`) is a run of whole words
  from the source. A quote whose spans are all empty MUST fail rather than
  trivially pass. The text between two
  spans is unbounded by design: an elision marker is the author's assertion
  that they removed material, and whether the removal misleads is a
  judgment for the audit, not a distance a validator can measure.
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
hold in every binding. Rules that hold only for YAML, markdown and files
moved to the binding document on 2026-08-25 (`ERF-65`, `ERF-66`, `ERF-67`,
and the YAML half of `ERF-53`), keeping their ids. Eighteen requirements
outside it still carry a clause that names a file, YAML, markdown or
CommonMark: `ERF-1`, `ERF-2`, `ERF-3`, `ERF-7`, `ERF-14`, `ERF-25`,
`ERF-28`, `ERF-31`, `ERF-34`, `ERF-37`, `ERF-51`, `ERF-52`, `ERF-54`,
`ERF-59`, `ERF-63`, `ERF-69`, `ERF-70`, `ERF-71`. Each splits into its
model half and its binding half in the next minor version, which
renumbers nothing.

- **ERF-53** A corpus MUST have a canonical interchange form, given by
  a binding (this section's opening). A store MAY hold a corpus any other
  way it likes, body as one more field, many records in one collection
  document, rows in a database, provided every file the corpus holds
  round-trips through the model without loss. Loss is any difference,
  after loading, in anything a file carried: a value the model types, an
  opaque value the model preserves (`citation`'s CSL fields, extension
  and unknown fields, `ERF-57`), the order of any list, a narrative's
  frontmatter and text, or the bytes of a held raw or normalized file,
  which is where every quote-check verdict lives. Two forms are equivalent
  when they load to the same instance so defined, and a store that returns
  `chapter-number: 36.0` for `36` has lost, whatever its own types say. "Every file" and not "every record": the source list
  carries the digests, the licence judgments and the normalized-text
  paths, the whole verifiability chain, and it is not a record. How
  records are grouped in a store carries no meaning, because each record
  states its own `type` and `corpus` (`ERF-54`).
- **ERF-54** Every file a corpus holds MUST self-describe with `type`,
  no meaning MAY live in a path, exactly one file MUST carry `type:
  corpus`, and every record MUST also carry `corpus`. *Shape: the `type`
  discriminator.* A consumer discovers a corpus by reading: it walks what
  it was given and dispatches on `type`; a file without one is not part of
  the corpus, and a consumer MUST ignore it and report that it did
  (`ERF-57`); a validator MUST reject two declarations. This is what keeps
  the format out of a store's business: what travels is a set of
  self-describing documents, and where they sit carries nothing.
- **ERF-55** Empty lists MUST be omitted, a field's absence meaning none;
  an optional mapping present and empty asserts existence and MUST be
  written; and a producer MUST NOT originate a field the declared
  `spec_version` does not define, outside the `x_` namespace (`ERF-72`).
  *Shape: every definition refuses undefined fields.* `evidence_at_stance`
  is why the mapping clause exists: absent, the ruler stamped nothing;
  `{}`, the ruler stamped and faced nothing, which `ERF-20` calls
  unrecoverable. An unknown key is a producer error a validator catches,
  never a consumer's licence to refuse (`ERF-57`).
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
- **ERF-72** A field named with the prefix `x_` is an extension field: a
  producer MAY originate one anywhere, a validator MUST NOT report it under
  `ERF-55`, and a consumer treats it as unknown (`ERF-57`). *Shape: the
  `^x_` pattern on every definition.* A field lives under the prefix while
  its need is demonstrated and graduates by entering a later version bare,
  after which the prefixed form is a distinct extension field. Rigid by
  default and extensible in one place, because a format tolerant
  everywhere decays into whatever its implementations write.
- **ERF-58** The event-time key MUST be `timestamp`, everywhere.
- **ERF-59** A corpus MUST carry exactly one declaration naming `type:
  corpus`, `id`, `title` and `spec_version`, and MAY name an `owner` and a
  `classification`. *Shape: `CorpusDeclaration`.* `classification` is an
  opaque label this version records and does not read; what it means, and
  which corpora may cite or travel together, is deployment policy. The
  declaration declares no bars or gates.
- **ERF-60** A consumer MAY refuse a corpus whose MAJOR `spec_version` it
  does not support, and MUST say so when it does. For an unsupported MINOR
  version it MUST either preserve unrecognized content losslessly or refuse
  with an explicit diagnostic; silently dropping what it does not
  understand is forbidden. Reading a corpus under the wrong major version
  is worse than refusing it, because the failure is silent: fields shift
  meaning and nothing in the file announces the mismatch. Migrations
  between majors are explicit.
- **ERF-61** `spec_version` MUST follow Semantic Versioning 2.0.0, where
  a MAJOR increment means records of the previous major are unreadable or
  read with changed meaning, and a MINOR increment is an addition an older
  reader under-interprets but never misreads. *Shape: `SemVer`.* The
  changed-meaning clause is what `ERF-60`'s refusal exists for: a field
  that stays parseable while its semantics move announces nothing.
## 8. Storage

- **ERF-62** A corpus MUST have exactly one authoritative home. Every
  index, database, or embedding built over it is a *projection*:
  recomputable, derived, never consulted as truth.
- **ERF-63** A substrate MAY be anything that preserves records, ids,
  attribution, and an edit history sufficient to verify `ERF-40`. Files
  in git are the reference implementation (history and diffing for free);
  a record's body is one more field in a database.

## Versioning and change control

- The `spec_version` on a corpus declaration (`ERF-59`) governs the semantics
  of that corpus's records; migrations between versions are explicit, never
  inferred from field absence.
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
  policies live. The `classification` label on the declaration (`ERF-59`)
  is the natural anchor for one.
- Normalized texts travel only where their licences permit. They are, in general, copyrighted third-party works; whether a given
  text ships with a shared or published corpus is a licence and
  deployment question the format records rather than rules on. The source
  list holds the judgment either way: a shipped text names its
  licence (`ERF-68`), a withheld one records the reason (`ERF-5`). The
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
- YAML 1.2: yaml.org/spec/1.2.2
- RFC 2119 and RFC 8174 (BCP 14), requirement key words
- CommonMark 0.31.2: spec.commonmark.org
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
