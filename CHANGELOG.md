# Changelog

Newest first. Requirement ids are stable once published: insertions use
letter suffixes (`ERF-4.8a`), retired ids are never reused, and every
change lands here with a date.

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
