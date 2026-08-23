# Changelog

Newest first. Requirement ids are stable once published: insertions use
letter suffixes (`ERF-4.8a`), retired ids are never reused, and every
change lands here with a date.

## v1.0-draft-3 (2026-08-22) — trim pass, one definitional home per field

`SPEC.md` goes from 1,219 to 1,093 lines with nothing a reader needs
removed. The motivating defect: section 5 still defined the atom quality
axis under its old name and its retired hop-based rubric, hours after
`ERF-4.8a` was rewritten, because a field could be defined in four places
and one pass updated three of them.

Four changes:

- **Section 3.1 field reference**: 56 prose cards become tables grouped by
  record type (Field, Type, Writer, When, Requirements). Definitions live
  with the requirements; the table is the index into them.
- **Section 5 vocabularies**: keeps only what lives nowhere else, the
  epistemic kinds framed by what would check a claim and the four
  relations stated subject-first. The quality tiers point at `ERF-4.8a`
  and `ERF-4.8b`, their one home.
- **Changelog section**: removed from the spec; this file is the version
  history and `DESIGN-HISTORY.md` is the narrative.
- **Two archaeology notes** move out, their measurements already recorded
  in the design history's subtraction ledger. The change-control fact that
  `ERF-4.14b` and `ERF-4.14c` are retired ids stays in the spec.

The field reference was not purely duplicative: about a fifth of it was
the only home for real rules, so the cards could not be dropped until
that content moved into requirements. Migrated in this pass:

- `ERF-4.7` gains: a received file has no retrieval locator, so its atoms
  carry no `fetched_url`.
- `ERF-4.9` gains: verdicts under different protocol versions are not
  comparable, an auditor's identity is recorded beside the protocol, and
  `accepted: true` marks a PARTIAL the operator rules acceptable.
- `ERF-4.10a` (new): an atom's `id` is permanent, never renamed or reused.
- `ERF-4.10b` (new): `as_of` records the date the fact is true of;
  `limitations` records the caveat about the evidence.
- `ERF-4.13` gains: beyond restating the title, the body is the one
  operator-authored text and carries the working notes.
- `ERF-4.13a` (new): the optional `handle`, a compact spoken name.
- `ERF-4.13b` (new): `families` records membership as a decision.
- `ERF-4.13c` (new): `semantic_query`, why it exists, and the retrieval
  measurement behind it.
- `ERF-4.27` gains: an act MAY carry a `scope`.
- `ERF-4.29` gains: a survey's `title` states what was sought, and an act
  MAY carry its own `timestamp`, inheriting `conducted` when absent.

Requirement count 56 to 61. No existing id is renumbered or reused.

## v1.0-draft-3 (2026-08-22) — identity scoped to a registry

`ERF-4.11` and `ERF-6.2` said ids are unique "across all corpora", which
is true inside one operator's registry and false the moment two parties
share records. Identity is now scoped to a registry (the set of corpora
one operator or organization governs), and across registries identity is
the pair of registry and id. Bare slugs never have to be unique between
parties. `ERF-6.2` also picks up surveys, which the survey pass missed.

A non-normative note states the two designs that hold a shared boundary.
Records meet by reference rather than by copy, so nothing is imported by
default. And standings never travel: a disposition is computed inside one
corpus from that corpus's own standings, while a foreign record's home
standings are visible as attributed context that is never counted. That
second rule is the multi-operator form of "only a person takes a stance",
and it keeps borrowed authority from crossing a boundary.

Left unspecified on purpose until a second person exists in a corpus: an
actor registry, provenance on copied records, and a declared actor whose
stance decides a contested claim. Out of scope permanently: quorum,
voting, and merge resolution.

Section 4.8 (the personal corpus) is reduced to a non-normative note. The
format permits a register of the author's own positions; the reference
practice deliberately keeps its author's positions outside the format, and
the spec now says so rather than describing a register nobody runs.

## v1.0-draft-3 (2026-08-22) — cause retired before first use

`ERF-4.14c` typed a closed vocabulary of reasons for negative standing
moves, modeled on Wikidata's P2241. It is removed, along with the
`StanceCause` type and the optional `cause` field on a standing entry.
Both ids stay retired and are not reused.

The measurement that decided it, taken across every withdrawal in the
reference practice: five exist, none carried a cause, one of the six
proposed values had a real instance, and four of the five actual reasons
were absent from the list (a claim split in two, a claim unbacked when
minted, a claim contradicted by one its owner kept, and a claim
withdrawn for what asserting it would say to a reader who would see it).
The required `why` sentence stated each reason better than an enum
could, and nothing yet queries standings by reason. `against`, the other
stance the field applied to, has no instances at all.

A non-normative note now sits beside the disposition rules: a computed
`retired` must not be read as "shown false". Withdrawals split three
ways. The content survives elsewhere (absorbed, split), the claim should
never have stood (unbacked, contradicted), or the withdrawal is not
about truth at all. Only the `why` distinguishes them.

If the concept returns, its vocabulary is derived from accumulated `why`
sentences rather than invented ahead of them, and it applies to
withdrawals only.

## v1.0-draft-3 (2026-08-22) — source_quality rubric rewritten

The value vocabulary stays `high | medium | low`. A proposed rename to
`primary | secondary | unresolved`, defined by a countable hop test, was
rejected on evidence from the reference practice: the hop test scores a
practitioner's first-hand forum comment as `primary`, which would have
relabelled eighty-five atoms into a badge telling readers to lean on
anonymous posts. Vague labels are honest for a composite judgment, and a
survey of the field found letter grades exactly as fuzzy as English
words, so a rename buys connotation rather than precision.

What changed is the rubric, in `ERF-4.8a`. The axis is named as the
composite it always was: how much weight the attester's word carries for
the fact the finding conveys, assessed on two inputs (provenance
distance and attester accountability) with the weaker governing. That
rule reproduces the existing assignments across 787 atoms, so no
migration follows from it.

`ERF-4.8b` is new, and answers the discourse case: grade against the
substance the finding conveys, not the bare fact that someone uttered
it. Reported speech does not launder an unaccountable attester upward.
Where a corpus's subject IS discourse, the utterance is the substance,
and the finding must say so, so that the grade can be checked against
what the atom attests.

## v1.0-draft-3 (2026-08-22) — corpus narrowed

The corpus carries two jobs, not three: the confidentiality boundary
(engagement, client, and correspondence-derived records are inherently
private and unrelatable outside their project, while public research
travels freely) and the policies that govern its records (audit
intensity, verification bars, ship gates). Ownership is struck: with one
operator it distinguishes nothing, and contractual ownership of client
work-product is a fact about the engagement, not a field on a record. It
returns only if the multi-operator design needs it, where whose corpus is
authoritative and who may admit records are the real questions, and the
answer most likely arrives through actor identity and import provenance.
Unchanged: a corpus is never a namespace (ids are unique across the
registry, not scoped per corpus) and never meaning. Text only, in the scope line, the claim and survey field
cards, and the `CorpusId` comment in `types/erf.ts`.

## v1.0-draft-3 (2026-08-22) — the survey record type

Gap claims ("nothing off the shelf does X", "this is niche") were
unbackable: atoms hold what sources say, not what searches failed to
find. The new `survey` record holds search acts and their yield, neutral
as to polarity: the same shape backs absence, sparseness, and density
readings, and the citing claim decides the use. Design decisions, each
with its reasoning in SPEC.md section 4.6:

- **Asymmetry**: absence and coverage are evidenced by surveys, presence
  by atoms; a found source is atom-shaped, so claims carry one `surveys`
  list and no against side (a counter-survey mirror is deferred until a
  real instance demands it).
- **SearchAct precision**: a query means nothing without its instrument,
  so each act carries `tool` (the concrete instrument, never a category)
  and `query` in that instrument's own terms (`ERF-4.27`); `hits` stays
  text because instruments report with different precision, and inventing
  precision is the sin (`ERF-4.28`).
- **`limitations` optional with a SHOULD** (`ERF-4.30`): a complete
  search of a closed corpus has no coverage bounds to state; the
  universe-relation note (world index, private sample, closed corpus)
  carries the weighting judgment the type cannot.
- **`prior` chain** (`ERF-4.29`): a re-run is a new record linking its
  predecessor; staleness of absence backing is computed from `conducted`
  timestamps; cadence is pipeline policy, never format.

Amendments: `ERF-4.21` (universal negatives SHOULD cite surveys),
`ERF-6.1` (surveys resolve), `ERF-6.11` (survey-backed observations are
not unbacked), `ERF-7.2` (surveys self-describe). The narrative and
personal-corpus sections renumber to 4.7 and 4.8; requirement ids are
untouched. Naming-convention rule 3 admits event-named entry types
(`SearchAct`) beside the `-Entry` suffix. `examples/` gains three real
survey records (gap, mixed, closed-corpus); the gap survey is the
2026-08-19 prior-art scan given record form, and the spec's own
subtraction-ledger measurement of the retired `granted` field now exists
as the closed-corpus record `granted-flag-uses-2026-08-22`.

## 2026-08-22 — worked examples replaced

The inline claim example (`no-continuous-claim-check`) is replaced by
`citators-disagree-on-negative-treatment`, a claim fully backed by three
captured atoms (a peer-reviewed citator-disagreement study and the
vendor's response). Two defects motivated the swap: the old example was a
universal negative whose one atom evidences a single case, not the
negative (the situation ERF-4.21 scopes), and its standing entry was
invented for illustration. The rule now applied: no invented human
stances anywhere in the spec; the example claim ships as a proposal with
the standings mechanics described in prose beside it. `examples/` gains a
web-sourced atom (`atom-web.yaml`, stable arXiv `fetched_url`) beside the
book-sourced one (`atom.yaml` renamed `atom-book.yaml`), and `claim.yaml`
carries the new claim. The retired example remains a real claim in its
home corpus; only its example role ended. The ERF-4.25 binding
illustration keeps the old slug deliberately: it quotes a real binding in
a real narrative document. No normative change.

## 2026-08-22 — repository split

The specification moved from a single working document into this
repository: `SPEC.md` (abstract and status to `README.md`, change history
to this file), `types/erf.ts` as the normative data model in a compiling
file (the spec keeps an inline mirror), `DESIGN-HISTORY.md`,
`examples/` (one real record per type), `tools/lint-spec-style.py`. One
wording change under an author ruling: the Deliverables section's
"reference corpus" became "worked examples" (the former overpromised
ongoing stewardship and completeness). No other normative change.

## 2026-08-22 — naming migration

Abstract replaced with the working-research framing. Field renames across
records, scripts, and the spec: `confidence` to `source_quality` (value
vocabulary under review), `source` to `citation_text`, `epistemic` to
`epistemic_kind`, `minted`/`generated`+`model` to `created`, edge key
`rel` to `relation`, `juror` to `auditor`, `subQuestions` to
`sub_questions`. Stance values `stands`/`disputes` renamed `for`/`against`
(symmetry with `atoms_for`/`atoms_against`). Type aliases:
`EpistemicKind`, `Relation`, `QuestionStatus`, `StandingEntry`,
`StanceCause`, `SourceQuality`, `ActorStamp` (was `Provenance`, which
misnamed an actor-and-time stamp). Naming conventions added as
section 3.2. `ERF-6.14` (default lens) retired to a non-normative note:
consumer mechanics, not record format.

## v1.0-draft-2 style pass (2026-08-22)

The spec doc class adopted: uniform requirement blocks, canonical note
form, em dashes and middle dots removed from prose, bold reserved for
requirement ids; a style lint as a ship gate.

## v1.0-draft-2 (2026-08-22)

Confidence narrowed to the source axis (`ERF-4.8a`); standings context
stamp (`ERF-4.14a`); jury-independence note. Structural pass to spec
conventions: abstract and status block, BCP 14 boilerplate, conformance
classes with the strict-producer/tolerant-consumer rule, versioning and
change control, security and privacy considerations, references split
normative/informative.

## v1.0-draft-2 addenda (2026-08-22)

Field reference (3.1) with the retrieval story; `shown` renamed
`evidence_at_stance`; `cause` enum on negative stances (`ERF-4.14c`;
`ERF-4.14b` retired, id not reused); audit policy note and the ship gate
(`ERF-6.13`); default lens (`ERF-6.14`); section 5 confidence listing
aligned with `ERF-4.8a`.

## v1.0-draft (2026-08-22)

Standings ratified over rulings; `title` becomes the normative statement;
questions lose their ledger (`answered_by` plain list); rewritten as a
numbered specification with RFC 2119 keywords and a normative TypeScript
data model.

## v0.11 (2026-08-21)

Standings land (per-person, append-only, computed dispositions); backing
audit; timestamp keys.

## v0.10 (2026-08-21)

`corpus`; four kinds; personal corpus; files self-describe; global claim
namespace.

## v0.8 to v0.9 (2026-08-21)

Rulings ledger; typed-first principle; Chicago rendering;
mint-is-not-a-judgment.

## v0.5 to v0.7 (2026-08-21)

Question as sibling record type; substrate agnosticism; vocabularies;
`families`.

## v0.3 to v0.4 (2026-08-21)

Recut as implementation companion; endorsement and integrity deferred;
`finding` named; citation/locator split; recorded-vs-derived checks.

## v0.2 (2026-08-20)

First circulated draft; five record types including endorsement events
and integrity hashes.
