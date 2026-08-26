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
- **verifications** — a list, one entry per check: who, when, and their
  verdict. A list rather than a field, for the reason the format itself
  gives for `finding_audit`: a verdict is one instrument's reading, several
  readings are worth more than one, and where they disagree the
  disagreement is the finding. An entry nobody has verified is not ready to
  be decided; an entry whose verifications split is a different and more
  interesting problem.
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

## Unverified

Raised but not yet checked by anyone other than whoever raised them. **Not ready to be decided.**

| id | priority | | basis | verification |
|---|---|---|---|---|
| [`B-40`](B-40-erf-53s-round-trip-clause-has-no-definition-of-loss.md) | **P2** | `ERF-53`'s round-trip clause has no definition of loss | `demonstrated` | `accurate` · `unverified` ⚠ split |
| [`B-41`](B-41-basic-rules-have-no-requirement-number-to-cite.md) | **P3** | Basic rules have no requirement number to cite | `demonstrated` | `accurate` · `unverified` ⚠ split |
| [`B-42`](B-42-the-deployment-has-no-identity.md) | **P3** | The deployment has no identity | `demonstrated` | `duplicate` · `unverified` ⚠ split |
| [`B-43`](B-43-timestamps-the-type-says-instant-every-example-writes-a-ba.md) | **P3** | Timestamps: the type says instant, every example writes a bare date | `reported` | `inaccurate` · `unverified` ⚠ split |
| [`B-44`](B-44-erf-2-requires-a-dated-capture-and-no-field-holds-the-date.md) | **closed** | `ERF-2` requires a dated capture and no field holds the date | `demonstrated` | `accurate` · `unverified` ⚠ split |
| [`B-45`](B-45-erf-28-asserts-a-computed-staleness-that-nothing-defines.md) | **P2** | `ERF-28` asserts a computed staleness that nothing defines | `reported` | `accurate` · `unverified` ⚠ split |
| [`B-46`](B-46-an-atom-may-name-a-corpus-that-was-never-declared.md) | **P2** | An atom may name a corpus that was never declared | `reported` | `accurate` · `unverified` ⚠ split |
| [`B-47`](B-47-the-serialization-rules-are-written-about-records-and-miss.md) | **P2** | The serialization rules are written about records and miss the other files | `reported` | `accurate` · `unverified` ⚠ split |
| [`B-48`](B-48-the-validator-conformance-class-omits-section-4.md) | **closed** | The Validator conformance class omits section 4 | `demonstrated` | `accurate` · `accurate` · `unverified` ⚠ split |
| [`B-51`](B-51-erf-55s-omit-rule-stops-at-lists-and-an-empty-mapping-carries-meaning.md) | **closed** | `ERF-55`'s omit rule stops at lists, and one empty mapping carries meaning | `reported` | `unverified` · `accurate` ⚠ split |
| [`B-52`](B-52-the-base-for-a-capture-path-is-stated-only-in-a-comment.md) | **closed** | The base for a capture `path` is stated only in a comment | `reported` | `unverified` |
| [`B-53`](B-53-erf-67s-encoding-clause-does-not-clearly-reach-captures.md) | **P2** | `ERF-67`'s encoding clause does not clearly reach captures | `reported` | `unverified` |
| [`B-54`](B-54-nothing-states-a-key-order-for-frontmatter.md) | **P3** | Nothing states a key order for frontmatter | `reported` | `unverified` |
| [`B-55`](B-55-dehyphenation-needs-a-dictionary-and-is-deferred.md) | **trigger-driven** | Dehyphenation at a line break | `anticipated` | `unverified` |
| [`B-56`](B-56-icu-transform-rules-as-the-folding-definition.md) | **trigger-driven** | ICU transform rules as the folding definition | `anticipated` | `unverified` |

## Defects awaiting a ruling

Verified accurate, ordered by priority. The specification is wrong, unclear, or incomplete here.

| id | priority | | basis | verification |
|---|---|---|---|---|
| [`B-27`](B-27-the-normative-conformance-cases-are-unobtainable-by-a-read.md) | **P2** | The normative conformance cases are unobtainable by a reader of the specification alone | `reported` | `accurate` |
| [`B-37`](B-37-the-actor-grammar-cannot-distinguish-two-authors-of-the-sa.md) | **P2** | The actor grammar cannot distinguish two authors of the same model | `demonstrated` | `accurate` |
| [`B-31`](B-31-append-only-rules-cannot-be-checked-from-a-single-corpus-s.md) | **P3** | Append-only rules cannot be checked from a single corpus snapshot | `reported` | `accurate` |
| [`B-32`](B-32-erf-34-legislates-authorship-where-the-format-elsewhere-re.md) | **P3** | `ERF-34` legislates authorship where the format elsewhere records attribution | `reported` | `accurate` |
| [`B-33`](B-33-one-converter-per-source-cannot-describe-a-mixed-extractio.md) | **P3** | One `converter` per source cannot describe a mixed-extraction artifact | `reported` | `accurate` |
| [`B-38`](B-38-decomposes-into-blocks-a-second-author-from-structuring-an.md) | **P3** | `decomposes-into` blocks a second author from structuring an existing corpus | `reported` | `accurate` |

## Capabilities awaiting a trigger

Verified accurate. The format does not do these yet; each names the event that would revive it.

| id | priority | | basis | verification |
|---|---|---|---|---|
| [`B-01`](B-01-cross-deployment-identity.md) | **trigger-driven** | Cross-deployment identity | `anticipated` | `accurate` |
| [`B-03`](B-03-a-corpus-registry-as-a-specified-artifact.md) | **trigger-driven** | A corpus registry as a specified artifact | `anticipated` | `accurate` |
| [`B-04`](B-04-non-text-evidence-payloads-measurement-table-image.md) | **trigger-driven** | Non-text evidence payloads (measurement, table, image) | `anticipated` | `accurate` |
| [`B-06`](B-06-atom-lifecycle-withdrawn-superseded-by.md) | **trigger-driven** | Atom lifecycle (`withdrawn`, `superseded_by`) | `anticipated` | `accurate` |
| [`B-07`](B-07-a-capture-manifest-with-content-hash-identity.md) | **trigger-driven** | A capture manifest with content-hash identity | `anticipated` | `accurate` |
| [`B-08`](B-08-content-addressed-record-ids.md) | **trigger-driven** | Content-addressed record ids | `anticipated` | `accurate` |
| [`B-09`](B-09-canonical-serialization-of-a-record-before-any-hashing.md) | **trigger-driven** | Canonical serialization of a record, before any hashing | `anticipated` | `accurate` |
| [`B-10`](B-10-a-families-registry-definitions-rename-history.md) | **trigger-driven** | A families registry (definitions, rename history) | `anticipated` | `accurate` |
| [`B-11`](B-11-an-actor-registry.md) | **trigger-driven** | An actor registry | `anticipated` | `accurate` |
| [`B-12`](B-12-import-provenance-on-copied-records-and-a-declared-decidin.md) | **trigger-driven** | Import provenance on copied records, and a declared deciding actor | `anticipated` | `accurate` |


---

43 entries, 54 verifications: 37 accurate, 1 duplicate, 1 inaccurate, 15 unverified.
Regenerate with `python3 tools/backlog-index.py`.
