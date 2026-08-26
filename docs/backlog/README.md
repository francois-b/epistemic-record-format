---
title: "Backlog"
purpose: "The governed queue: one file per entry, each with its basis, its provenance, and a verdict from someone other than whoever raised it. This page is the index."
status: non-normative
last_updated: 2026-08-25
---

# Backlog

A long queue here is the findings pipeline working rather than a sign the
format is unstable: an entry exists because somebody looked, wrote down what
they saw, and had it checked by a second hand, which is a count of attention
paid and not of defects loose in the specification.

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
| [`B-40`](B-40-erf-53s-round-trip-clause-has-no-definition-of-loss.md) | **closed** | `ERF-53`'s round-trip clause has no definition of loss | `demonstrated` | `accurate` · `unverified` ⚠ split |
| [`B-41`](B-41-basic-rules-have-no-requirement-number-to-cite.md) | **closed** | Basic rules have no requirement number to cite | `demonstrated` | `accurate` · `unverified` · `stale` ⚠ split |
| [`B-42`](B-42-the-deployment-has-no-identity.md) | **closed** | The deployment has no identity | `demonstrated` | `duplicate` · `unverified` · `duplicate` ⚠ split |
| [`B-43`](B-43-timestamps-the-type-says-instant-every-example-writes-a-ba.md) | **closed** | Timestamps: the type says instant, every example writes a bare date | `reported` | `inaccurate` · `unverified` · `stale` ⚠ split |
| [`B-44`](B-44-erf-2-requires-a-dated-capture-and-no-field-holds-the-date.md) | **closed** | `ERF-2` requires a dated capture and no field holds the date | `demonstrated` | `accurate` · `unverified` ⚠ split |
| [`B-45`](B-45-erf-28-asserts-a-computed-staleness-that-nothing-defines.md) | **P2** | `ERF-28` asserts a computed staleness that nothing defines | `reported` | `accurate` · `unverified` ⚠ split |
| [`B-46`](B-46-an-atom-may-name-a-corpus-that-was-never-declared.md) | **closed** | An atom may name a corpus that was never declared | `reported` | `accurate` · `unverified` · `stale` ⚠ split |
| [`B-47`](B-47-the-serialization-rules-are-written-about-records-and-miss.md) | **P2** | The serialization rules are written about records and miss the other files | `reported` | `accurate` · `unverified` ⚠ split |
| [`B-48`](B-48-the-validator-conformance-class-omits-section-4.md) | **closed** | The Validator conformance class omits section 4 | `demonstrated` | `accurate` · `accurate` · `unverified` ⚠ split |
| [`B-51`](B-51-erf-55s-omit-rule-stops-at-lists-and-an-empty-mapping-carries-meaning.md) | **closed** | `ERF-55`'s omit rule stops at lists, and one empty mapping carries meaning | `reported` | `unverified` · `accurate` ⚠ split |
| [`B-52`](B-52-the-base-for-a-capture-path-is-stated-only-in-a-comment.md) | **closed** | The base for a capture `path` is stated only in a comment | `reported` | `unverified` |
| [`B-53`](B-53-erf-67s-encoding-clause-does-not-clearly-reach-captures.md) | **closed** | `ERF-67`'s encoding clause does not clearly reach captures | `reported` | `unverified` · `stale` ⚠ split |
| [`B-54`](B-54-nothing-states-a-key-order-for-frontmatter.md) | **closed** | Nothing states a key order for frontmatter | `reported` | `unverified` · `stale` ⚠ split |
| [`B-55`](B-55-dehyphenation-needs-a-dictionary-and-is-deferred.md) | **trigger-driven** | Dehyphenation at a line break | `anticipated` | `unverified` |
| [`B-56`](B-56-icu-transform-rules-as-the-folding-definition.md) | **trigger-driven** | ICU transform rules as the folding definition | `anticipated` | `unverified` |
| [`B-57`](B-57-a-normalized-text-may-hold-what-is-not-the-works-text.md) | **P3** | A normalized text may hold what is not the work's text, and nothing says so | `demonstrated` | `unverified` |
| [`B-58`](B-58-a-consumer-that-cannot-read-a-document-blames-the-records.md) | **P2** | A consumer that cannot read a document reports its failure as findings against the records that depend on it | `demonstrated` | `unverified` |
| [`B-59`](B-59-an-audit-of-an-elided-quote-is-not-obliged-to-read-what-was-elided.md) | **P2** | An audit of an elided quote is not obliged to read what was elided | `demonstrated` | `unverified` |
| [`B-60`](B-60-an-excerpt-is-one-contiguous-passage-and-erf-69-never-says-so.md) | **P2** | An excerpt is one contiguous passage, and `ERF-69` never says so | `demonstrated` | `unverified` |
| [`B-61`](B-61-a-narrative-cannot-name-the-source-it-is-drawn-from.md) | **P3** | A narrative cannot name the source it is drawn from | `demonstrated` | `unverified` |
| [`B-62`](B-62-a-bets-resolution-criterion-has-no-home-before-anyone-stands.md) | **P3** | A bet's resolution criterion has no home before anyone stands | `demonstrated` | `unverified` |
| [`B-63`](B-63-section-42-gives-four-sentences-to-the-act-where-a-third-of-atoms-fail.md) | **P3** | Section 4.2 gives four sentences to the act where a third of atoms fail | `demonstrated` | `unverified` |
| [`B-64`](B-64-no-status-for-a-text-held-in-full-for-checking.md) | **P2** | No status for a text held in full for checking | `demonstrated` | `unverified` |
| [`B-65`](B-65-conflicts-with-has-no-forcing-instance.md) | **P2** | `conflicts-with` has no forcing instance | `demonstrated` | `unverified` |
| [`B-66`](B-66-seven-rules-the-rubric-marked-retire-survived-as-trims.md) | **P2** | Seven rules the rubric marked retire survived as trims | `reported` | `unverified` |
| [`B-67`](B-67-fourteen-act-musts-do-not-name-the-party-they-bind.md) | **P2** | Fourteen act MUSTs do not name the party they bind | `reported` | `unverified` |
| [`B-68`](B-68-erf-60-prescribes-a-parser-order-and-erf-62-a-topology.md) | **P3** | `ERF-60` prescribes a parser order, and `ERF-62` a topology | `reported` | `unverified` |
| [`B-69`](B-69-definitions-stated-two-or-three-times-and-a-lifecycle-nobody-is-bound-by.md) | **P3** | Definitions stated two or three times, and a lifecycle nobody is bound by | `reported` | `unverified` |

## Defects awaiting a ruling

Verified accurate, ordered by priority. The specification is wrong, unclear, or incomplete here.

| id | priority | | basis | verification |
|---|---|---|---|---|
| [`B-37`](B-37-the-actor-grammar-cannot-distinguish-two-authors-of-the-sa.md) | **P2** | The actor grammar cannot distinguish two authors of the same model | `demonstrated` | `accurate` |
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
| [`B-08`](B-08-content-addressed-record-ids.md) | **trigger-driven** | Content-addressed record ids | `anticipated` | `accurate` |
| [`B-09`](B-09-canonical-serialization-of-a-record-before-any-hashing.md) | **trigger-driven** | Canonical serialization of a record, before any hashing | `anticipated` | `accurate` |
| [`B-10`](B-10-a-families-registry-definitions-rename-history.md) | **trigger-driven** | A families registry (definitions, rename history) | `anticipated` | `accurate` |
| [`B-11`](B-11-an-actor-registry.md) | **trigger-driven** | An actor registry | `anticipated` | `accurate` |
| [`B-12`](B-12-import-provenance-on-copied-records-and-a-declared-decidin.md) | **trigger-driven** | Import provenance on copied records, and a declared deciding actor | `anticipated` | `accurate` |


---

56 entries, 76 verifications: 37 accurate, 2 duplicate, 1 inaccurate, 8 stale, 28 unverified.
Regenerate with `python3 tools/backlog-index.py`.
