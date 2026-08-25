---
title: "Backlog"
purpose: "The governed queue: one file per entry, each with its basis, its provenance, and a verdict from someone other than whoever raised it. This page is the index."
status: non-normative
last_updated: 2026-08-25
---

# Backlog

Everything this format does not do yet, plus everything a reader has told it
is wrong. One queue, because both need the same governance before they reach
a decision: an accurate description, a stated basis, and someone other than
the raiser confirming both.

Nothing here is a promise and nothing is scheduled. **One file per entry,
in this folder**; this page is generated from them by
`tools/backlog-index.py` and is never edited by hand.

## What an entry carries

- **id** — `B-nn`, stable and never reused. An entry that leaves keeps its
  id in the changelog.
- **kind** — `capability` (the format does not do this yet, waits on a
  trigger) or `defect` (the specification is wrong, unclear, or incomplete,
  waits on a ruling).
- **basis** — how the entry knows what it says. `demonstrated`: an artifact
  exists and can be re-run. `reported`: a careful reader judged it, nothing
  failed. `anticipated`: nobody has hit this, and it is the weakest basis
  there is.
- **raised** — where it came from, specifically enough to go back to.
- **verified** — who checked the description against the current
  specification, when, and their verdict. An entry nobody has verified is
  not ready to be decided.
- **status** — `open` (verified accurate, awaiting trigger or ruling) or
  `contested` (verification disputes it: stale, inaccurate, duplicate, or
  already decided elsewhere). A contested entry is a decision about the
  entry, not about the format.

## How an entry gets here

An entry is not raised here. Observations land in `../findings/`, and pass
three gates before becoming an entry: **raised** (someone noticed it),
**specified** (a second hand determines what is actually being claimed
about the specification), **verified** (a third hand checks that claim
against the specification as it stands). Only a finding verified `accurate`
becomes an entry. The reasoning, and what happens to the ones that do not,
is in `../findings/README.md`.

## Priority

One dimension, and it means one thing: **what must be settled before v1.0
is published.**

- **P1** — blocks publication. Either the fix is breaking, and breaking
  changes are free before publication and a migration for every adopter
  after; or leaving it means two conforming implementations cannot read
  each other; or the specification asserts something untrue.
- **P2** — should be fixed soon, does not block, non-breaking.
- **P3** — real, can wait indefinitely. Contested entries sit here too:
  they need disposal rather than a ruling.
- **trigger-driven** — capabilities only. They are not scheduled and not
  ranked; each names the event that would revive it, and that event is
  their prioritization.

There is deliberately no effort or size field. A second dimension invites
trading urgency against cost, and the only question this queue needs
answered is what has to be true before the specification is published.

## The rule this queue exists to enforce

A field earns its place by a demonstrated need rather than by symmetry or by
anticipation. That is why `anticipated` is recorded as weak rather than
treated as equal: an item that has sat unhit through a five-trial battery is
evidence about its author's imagination, not about the format.

Items leave when their trigger fires or their ruling lands, going into the
specification or into `non-goals.md` if the answer turns out to be no.
Decisions already taken against something are not here.

## Contested

Verification disputes these: stale, inaccurate, duplicated, or already ruled elsewhere. Each needs a decision about the **entry** before the format is touched.

| id | priority | | basis | verification |
|---|---|---|---|---|
| [`B-05`](B-05-per-attachment-evidence-roles.md) | **trigger-driven** | Per-attachment evidence roles | `anticipated` | `inaccurate` |
| [`B-17`](B-17-a-typed-cause-on-withdrawals.md) | **trigger-driven** | A typed cause on withdrawals | `anticipated` | `already-closed` |
| [`B-19`](B-19-media-type-extraction-profiles-for-capture-text.md) | **trigger-driven** | Media-type extraction profiles for capture text | `anticipated` | `stale` |
| [`B-20`](B-20-a-machine-readable-audit-policy-schema.md) | **trigger-driven** | A machine-readable audit policy schema | `anticipated` | `already-closed` |
| [`B-21`](B-21-a-full-normalization-grammar-in-prose.md) | **trigger-driven** | A full normalization grammar in prose | `anticipated` | `inaccurate` |
| [`B-22`](B-22-the-question-record-types-return.md) | **trigger-driven** | The question record type's return | `anticipated` | `inaccurate` |
| [`B-39`](B-39-the-example-corpuss-narrative-carries-an-undefined-field.md) | **unassessed** | The example corpus's narrative carries an undefined field | `demonstrated` | `duplicate` |

## Unverified

Raised but not yet checked by anyone other than whoever raised them. **Not ready to be decided.**

| id | priority | | basis | verification |
|---|---|---|---|---|
| [`B-40`](B-40-erf-53s-round-trip-clause-has-no-definition-of-loss.md) | **unassessed** | `ERF-53`'s round-trip clause has no definition of loss | `demonstrated` | `unverified` |
| [`B-41`](B-41-basic-rules-have-no-requirement-number-to-cite.md) | **unassessed** | Basic rules have no requirement number to cite | `demonstrated` | `unverified` |
| [`B-42`](B-42-the-deployment-has-no-identity.md) | **unassessed** | The deployment has no identity | `demonstrated` | `unverified` |
| [`B-43`](B-43-timestamps-the-type-says-instant-every-example-writes-a-ba.md) | **unassessed** | Timestamps: the type says instant, every example writes a bare date | `reported` | `unverified` |
| [`B-44`](B-44-erf-2-requires-a-dated-capture-and-no-field-holds-the-date.md) | **unassessed** | `ERF-2` requires a dated capture and no field holds the date | `reported` | `unverified` |
| [`B-45`](B-45-erf-28-asserts-a-computed-staleness-that-nothing-defines.md) | **unassessed** | `ERF-28` asserts a computed staleness that nothing defines | `reported` | `unverified` |
| [`B-46`](B-46-an-atom-may-name-a-corpus-that-was-never-declared.md) | **unassessed** | An atom may name a corpus that was never declared | `reported` | `unverified` |
| [`B-47`](B-47-the-serialization-rules-are-written-about-records-and-miss.md) | **unassessed** | The serialization rules are written about records and miss the other files | `reported` | `unverified` |
| [`B-48`](B-48-the-validator-conformance-class-omits-section-4.md) | **unassessed** | The Validator conformance class omits section 4 | `reported` | `unverified` |

## Defects awaiting a ruling

Verified accurate, ordered by priority. The specification is wrong, unclear, or incomplete here.

| id | priority | | basis | verification |
|---|---|---|---|---|
| [`B-23`](B-23-the-corpus-has-no-stated-shape-on-disk.md) | **unassessed** | The corpus has no stated shape on disk | `demonstrated` | `accurate` |
| [`B-24`](B-24-as-of-date-has-neither-a-stated-format-nor-stated-semantic.md) | **unassessed** | `as_of_date` has neither a stated format nor stated semantics | `demonstrated` | `accurate` |
| [`B-25`](B-25-erf-51-step-f-is-under-specified-and-it-changes-verdicts.md) | **unassessed** | `ERF-51` step f is under-specified, and it changes verdicts | `demonstrated` | `accurate` |
| [`B-26`](B-26-three-normalization-edge-cases-from-real-captures.md) | **unassessed** | Three normalization edge cases from real captures | `demonstrated` | `accurate` |
| [`B-27`](B-27-the-normative-conformance-cases-are-unobtainable-by-a-read.md) | **unassessed** | The normative conformance cases are unobtainable by a reader of the specification alone | `reported` | `accurate` |
| [`B-28`](B-28-erf-35s-scope-is-ambiguous.md) | **unassessed** | `ERF-35`'s scope is ambiguous | `reported` | `accurate` |
| [`B-29`](B-29-erf-32-requires-what-the-erf-31-grammar-makes-optional.md) | **unassessed** | `ERF-32` requires what the `ERF-31` grammar makes optional | `reported` | `accurate` |
| [`B-30`](B-30-erf-43-and-erf-49-collide-at-the-flag-boundary.md) | **unassessed** | `ERF-43` and `ERF-49` collide at the flag boundary | `reported` | `accurate` |
| [`B-31`](B-31-append-only-rules-cannot-be-checked-from-a-single-corpus-s.md) | **unassessed** | Append-only rules cannot be checked from a single corpus snapshot | `reported` | `accurate` |
| [`B-32`](B-32-erf-34-legislates-authorship-where-the-format-elsewhere-re.md) | **unassessed** | `ERF-34` legislates authorship where the format elsewhere records attribution | `reported` | `accurate` |
| [`B-33`](B-33-one-converter-per-source-cannot-describe-a-mixed-extractio.md) | **unassessed** | One `converter` per source cannot describe a mixed-extraction artifact | `reported` | `accurate` |
| [`B-34`](B-34-the-narrative-anchor-does-not-say-raw-or-reflowed.md) | **unassessed** | The narrative anchor does not say raw or reflowed | `demonstrated` | `accurate` |
| [`B-35`](B-35-the-binding-grammar-has-no-escape-for-a-quote-character-in.md) | **unassessed** | The binding grammar has no escape for a quote character in an anchor | `reported` | `accurate` |
| [`B-36`](B-36-the-narratives-frontmatter-fields-are-named-but-untyped.md) | **unassessed** | The narrative's frontmatter fields are named but untyped | `demonstrated` | `accurate` |
| [`B-37`](B-37-the-actor-grammar-cannot-distinguish-two-authors-of-the-sa.md) | **unassessed** | The actor grammar cannot distinguish two authors of the same model | `demonstrated` | `accurate` |
| [`B-38`](B-38-decomposes-into-blocks-a-second-author-from-structuring-an.md) | **unassessed** | `decomposes-into` blocks a second author from structuring an existing corpus | `reported` | `accurate` |

## Capabilities awaiting a trigger

Verified accurate. The format does not do these yet; each names the event that would revive it.

| id | priority | | basis | verification |
|---|---|---|---|---|
| [`B-01`](B-01-cross-deployment-identity.md) | **trigger-driven** | Cross-deployment identity | `anticipated` | `accurate` |
| [`B-02`](B-02-a-classification-wall-machine-checked-citation-direction.md) | **trigger-driven** | A classification wall: machine-checked citation direction | `anticipated` | `accurate` |
| [`B-03`](B-03-a-corpus-registry-as-a-specified-artifact.md) | **trigger-driven** | A corpus registry as a specified artifact | `anticipated` | `accurate` |
| [`B-04`](B-04-non-text-evidence-payloads-measurement-table-image.md) | **trigger-driven** | Non-text evidence payloads (measurement, table, image) | `anticipated` | `accurate` |
| [`B-06`](B-06-atom-lifecycle-withdrawn-superseded-by.md) | **trigger-driven** | Atom lifecycle (`withdrawn`, `superseded_by`) | `anticipated` | `accurate` |
| [`B-07`](B-07-a-capture-manifest-with-content-hash-identity.md) | **trigger-driven** | A capture manifest with content-hash identity | `anticipated` | `accurate` |
| [`B-08`](B-08-content-addressed-record-ids.md) | **trigger-driven** | Content-addressed record ids | `anticipated` | `accurate` |
| [`B-09`](B-09-canonical-serialization-of-a-record-before-any-hashing.md) | **trigger-driven** | Canonical serialization of a record, before any hashing | `anticipated` | `accurate` |
| [`B-10`](B-10-a-families-registry-definitions-rename-history.md) | **trigger-driven** | A families registry (definitions, rename history) | `anticipated` | `accurate` |
| [`B-11`](B-11-an-actor-registry.md) | **trigger-driven** | An actor registry | `anticipated` | `accurate` |
| [`B-12`](B-12-import-provenance-on-copied-records-and-a-declared-decidin.md) | **trigger-driven** | Import provenance on copied records, and a declared deciding actor | `anticipated` | `accurate` |
| [`B-13`](B-13-declared-perishability-stale-after.md) | **trigger-driven** | Declared perishability (`stale_after`) | `anticipated` | `accurate` |
| [`B-14`](B-14-structured-bet-settlement.md) | **trigger-driven** | Structured bet settlement | `anticipated` | `accurate` |
| [`B-15`](B-15-inference-grouping-joint-premises.md) | **trigger-driven** | Inference grouping (joint premises) | `anticipated` | `accurate` |
| [`B-16`](B-16-a-counter-survey-mirror.md) | **trigger-driven** | A counter-survey mirror | `anticipated` | `accurate` |
| [`B-18`](B-18-a-relation-for-near-identical-claims.md) | **trigger-driven** | A relation for near-identical claims | `anticipated` | `accurate` |


---

48 entries: 32 accurate, 2 already-closed, 1 duplicate, 3 inaccurate, 1 stale, 9 unverified.
Regenerate with `python3 tools/backlog-index.py`.
