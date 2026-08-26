---
title: "How the format got this way"
purpose: "The work history: what was tried, what was measured, what was reversed, and where the requirement ids went."
status: non-normative
last_updated: 2026-08-26
---

# How the format got this way

This is the record of the work rather than of the format. It says what was
tried and retired, what measurement decided a question, what the authors
changed their minds about, and where requirement ids went when the
specification was renumbered.

It is here for one reason: a format's credibility rests on the visible
record of its own decisions, which is the same standard the format asks of
any claim it holds. A reader who wants to know why a rule exists should not
have to reconstruct it from a changelog.

For what the format deliberately will not do, see `non-goals.md`. For what
it does not do yet, see `backlog/`. For the traditions it draws on, see
`influences.md`. The dated narrative of the 0.9.0 work, one entry per change,
is the last section of this file; the terse record of the same version is
`../CHANGELOG.md`.

## Origin

The format was not designed; it was extracted. Its rules come from a
working practice: a research methodology (atoms, claims, and compiled
argument documents) run since mid-2026 across seven corpora — research
programs, client engagements, and venture design — accumulating roughly
740 audited evidence atoms and 300 claims and questions before any
specification existed. A pilot ran the records on a third-party substrate
(an OKF-based knowledge product) before the spec was written, and the
friction found there shaped it. Every schema decision below was forced by
something in that corpus, and the ones that weren't were reversed.

## The subtraction ledger

- **Fourteen shape rules** (`ERF-3`, `5`, `7`, `12`, `19`, `21`, `22`, `34`,
  `37`, `38`, `39`, `55`, `58`, `59`): retired 2026-08-26 under the ruling
  the operator called option B. Four cold readers applying one rubric
  retired the same core with the same deletion test: the schema already
  forced each. `ERF-73` says every document validates against the schema;
  each rule's reason moved onto the definition it explains; `ERF-37` and
  `ERF-38` restated `ERF-36`. Requirement count 66 to 54.

- **`ERF-49`, unbacked as a validator duty**: retired 2026-08-26. It said
  a claim must not store whether it is backed, and the schema has no such
  field, so it forbade nothing; what remained was a definition, and
  "unbacked" is now a term in section 2. The consumer's reading of it is
  unchanged.

The format's field roster and vocabularies were reached by subtraction:
candidates were admitted only on a demonstrated need (a "forcing
instance") and retired on demonstrated non-use. The ledger, with the
measurements that decided each:

- **`granted`** (burden-shifting flag): retired — zero uses across the
  field's entire lifetime.
- **`preference`** (epistemic kind): retired — zero uses in 279 typed
  claims. Every taste decomposes: enforced taste is a commitment;
  self-reported taste is an observation whose subject is the author.
- **`stances`** (structured third-party positions): retired — one use in
  304 files; the instance moved to prose. (Its multi-person successor,
  the standings ledger, arrived later by a different route.)
- **Atom `tags`**: retired — measured rot: 201 distinct tags across 146
  atoms, more vocabulary than records, mixing topic families, entity
  names, source descriptors, and one state-vocabulary collision. Claim
  tags survived (33 terms, 4 singletons, applied exactly where
  composition pressure existed) and were renamed `families` with a single
  ruled purpose: recorded membership for exact, repeatable pulls.
- **`settled`** (structured bet outcomes): designed, accepted from an
  adversarial review, then withdrawn the same day — zero settled bets
  existed in any corpus, and typing the field cleanly forced the record
  type to pivot around one kind. A bet's settlement is the withdrawal
  entry in its standings, with the outcome in the reason.
- **The question record type**: cut 2026-08-23 as a scope decision, to keep
  v1 shippable. Measured first: 25 records across five corpora, every one
  `status: open`, none ever marked answered or parked, `answered_by` never
  written once in a year, two with sub-questions, four cited by compiled
  documents. The lifecycle machinery was unexercised; the records were not.
  They survive as prose in per-corpus `open-questions.md` documents, which is
  why this is filed as scope rather than as subtraction on evidence of
  disuse. The `bears_on` field went with it, having existed for four hours.
- **Three relation types** (`implies`, `refutes`, `answers`): retired in
  an earlier vocabulary audit — `implies` was `assumes` reversed;
  `refutes` had zero uses because counter-evidence lives on the claim;
  `answers` died with an earlier modeling of questions, and returned on 2026-08-23 as the `bears_on` field, not a relation, when a corpus-wide lint found 18 live edges of it that nothing else could express (see the fourth reversal).
- **The `rulings` state machine**: designed in full (a transition ledger
  with a stored state cache), then retired before first use when a
  parallel design produced the standings model — per-person positions
  with dispositions computed. The two coincide exactly in the one-person
  case; standings generalize.
- **Mechanical check results on records**: removed on principle —
  judgments are recorded because they are not recomputable; mechanical
  checks are derived because they are. The quote-vs-capture check runs at
  boundaries and logs receipts; it never writes fields.
- **Strength grades on held positions**: rejected — settledness is
  readable (tenure, survived disputes, accumulated evidence), not stored.
- **Decision records as a fifth type**: fenced out — an active bet plus
  its activation standing is the decision system's solo form; the record
  type waits for a corpus that demands choices with no proposition at
  stake.

## Reversals worth recording

Decisions made and unmade, each leaving a principle:

1. **Body-first-sentence as the claim statement → title-normative.** The
   original rule made the body's first sentence canonical with the title
   a machine-synced cache. An adversarial review attacked the sentence
   heuristic; the author's own editing practice (titles revised while
   reviewing rendered documents) decided it. Principle: authority should
   sit where authorship happens.
2. **Type and corpus inferred from location → files self-describe.** An
   elision scheme (fields materialized only when records travel) was
   ratified and then rejected as fuzzy. Principle: no meaning ever lives
   in a path; only a collection document's own header may carry its
   entries' shared identity.
3. **The event-time key `on` → `timestamp`.** YAML 1.1 parses the bare
   key `on` as a boolean — discovered when tolerant-read shims appeared
   in two readers. Principle: a schema that requires tribal knowledge to
   parse is a defect, whatever the documentation says.

4. **`answers` retired, readmitted as a relation, then moved to a field.**
   The relation was dropped in the vocabulary audit as a casualty of an
   earlier modeling of questions. When validation was widened from documents
   to whole corpora, 18 edges using it surfaced across two corpora, every one
   pointing at a question that is still open. The proposed migration, folding
   them into each question's `answered_by`, was abandoned on inspection: it
   would have asserted ten answers nobody had given. So it came back as
   `bears-on`, a fifth relation, and within hours an external review showed
   that placement was wrong: `ERF-6.7a` demanded a question target while the
   edge interface was typed claim-only, so the model forbade the legal case
   and permitted the illegal one. It moved again the same day, to the
   `bears_on` field, where the relation vocabulary returns to four and no
   union or widened target is needed. Two principles, learned in one
   sequence: a retirement is only as good as the coverage of the check that
   confirmed the disuse; and the evidence for a link and the right home for
   it are separate questions, decided separately. The link's own name is
   narrower than `answers` because a claim can bear on a question for months
   without answering it.
5. **The corpus narrowed twice in two days.** On 2026-08-22 it went from
   three jobs to two: confidentiality and policy scope, with ownership
   struck. On 2026-08-23 the second went too. The policy scope existed to
   serve gates, chiefly the ship gate that decided whether a deliverable
   could rest on unaudited atoms; when v1 ruled that the format specifies
   records and bindings and leaves use to the consumer, the gates left and
   the scope had nothing to attach to. A corpus is now a named body of work
   with a confidentiality tier. Principle: a field justified by a mechanism
   does not outlive the mechanism, and the second ruling is cheap only
   because the first one wrote down what the field was for.

   The story ends the same day it was settled. The question record type was
   cut for scope hours later, so `bears_on` went with the only target it
   could have, and the links it carried became prose in each claim's working
   notes. A relation retired for the wrong reason, readmitted on real
   evidence, placed wrongly, placed rightly, and then removed with the type
   it depended on, inside forty-eight hours. Nothing about the evidence
   changed at any point; only where it was allowed to live.

## Adversarial review

A cross-vendor model review (31 attacks, ranked) ran against the schema
mid-design. Roughly a third were accepted (deterministic ordering of
ledger entries; citation-block completeness; a structured locator; naming
normalization; the schema-version-on-manifest rule; the elision
convention for quotes), a third deferred with their designs attached
(non-text evidence payloads; per-attachment evidence roles; atom
lifecycle; a capture manifest with content-hash identity; a families
registry; actor registry), and a third rejected with reasons on record
(splitting state into three fields; multi-valued epistemic kinds; degrees
of belief; the decision-record type — this last over the reviewer's
objection, which is preserved as dissent). One accepted item (structured
settlement) was later withdrawn by the format's own forcing-instance
rule, which the authors regard as the system working.

## Principles that emerged

- **Judgments are recorded; mechanics are derived.** A verdict belongs to
  whoever rendered it and is kept; anything recomputable is computed.
- **Types vary shape; kinds vary contracts.** A kind demanding its own
  fields is a record type announcing itself (this is how the question
  left the claim record).
- **Fields by forcing instance; vocabularies by subtraction.**
- **Files self-describe; identity is global; membership is mutable.**
- **Only a person takes a stance.** Machines propose, classify, and
  audit; the standings ledger admits `human:` actors only.
- **What scales is heavily constrained.** The industry's schema-on-read
  experiments bought their constraints back at a premium; documents are
  the NoSQL of knowledge, and this format is schema-on-write for thought.

## The 2026-08-23 flatten

Requirement ids were `ERF-<section>.<sequence>` with letter suffixes for
insertions. The scheme rotted in the way that scheme always rots: sections
moved and ids could not follow, so section 4's numbers ran backwards once,
one base appeared in the order `c, d, a, e, f, b, g`, and two ids were
retired silently. Ids are declared stable only once published, so the last
free moment to fix it was before the first publication, and it was taken.

Ids are now a flat sequence carrying no meaning beyond identity. A number
no longer claims to say where a requirement lives, so no future section
move can make one wrong.

Historical documents (this file's register, the changelog, the adversarial
review, the practice's own method notes) cite the old ids and are not
rewritten: they describe what was true when written. This table is what
makes them readable.

| Old | New | Note |
|:--|:--|:--|
| `ERF-4.1` | `ERF-1` | |
| `ERF-4.3` | `ERF-2` | |
| `ERF-4.4` | `ERF-3` | |
| `ERF-4.4a` | `ERF-4` | |
| `ERF-4.4b` | `ERF-5` | |
| `ERF-4.5` | `ERF-6` | |
| `ERF-4.7` | `ERF-7` | |
| `ERF-4.8` | `ERF-8` | |
| `ERF-4.8a` | `ERF-9` | |
| `ERF-4.8b` | `ERF-10` | |
| `ERF-4.9` | `ERF-11` | |
| `ERF-4.9a` | `ERF-12` | |
| `ERF-4.10a` | `ERF-13` | |
| `ERF-4.10b` | `ERF-14` | |
| `ERF-4.11a` | `ERF-15` | |
| `ERF-4.11b` | `ERF-16` | |
| `ERF-4.12` | `ERF-17` | |
| `ERF-4.13` | `ERF-18` | |
| `ERF-4.14` | `ERF-19` | |
| `ERF-4.14a` | `ERF-20` | |
| `ERF-4.15` | `ERF-21` | |
| `ERF-4.16` | `ERF-22` | |
| `ERF-4.17` | `ERF-23` | |
| `ERF-4.19` | `ERF-24` | |
| `ERF-4.21a` | `ERF-25` | |
| `ERF-4.27` | `ERF-26` | |
| `ERF-4.28` | `ERF-27` | |
| `ERF-4.29` | `ERF-28` | |
| `ERF-4.30` | `ERF-29` | |
| `ERF-4.24` | `ERF-30` | |
| `ERF-4.25` | `ERF-31` | |
| `ERF-4.26c` | `ERF-32` | |
| `ERF-4.26a` | `ERF-33` | |
| `ERF-4.26b` | `ERF-34` | |
| `ERF-6.1` | `ERF-35` | |
| `ERF-6.2` | `ERF-36` | |
| `ERF-6.2a` | `ERF-37` | |
| `ERF-6.2b` | `ERF-38` | |
| `ERF-6.3` | `ERF-39` | |
| `ERF-6.4` | `ERF-40` | |
| `ERF-6.5` | `ERF-41` | |
| `ERF-6.5a` | `ERF-42` | |
| `ERF-6.6` | `ERF-43` | |
| `ERF-6.7` | `ERF-44` | |
| `ERF-6.8` | `ERF-45` | |
| `ERF-6.9` | `ERF-46` | retired 2026-08-24: authoring judgment, folded into ERF-18's guidance |
| `ERF-6.10` | `ERF-47` | |
| `ERF-6.10a` | `ERF-48` | |
| `ERF-6.11` | `ERF-49` | |
| `ERF-6.12` | `ERF-50` | |
| `ERF-6.12a` | `ERF-51` | |
| `ERF-6.12b` | `ERF-52` | |
| `ERF-7.1` | `ERF-53` | |
| `ERF-7.2` | `ERF-54` | |
| `ERF-7.4` | `ERF-55` | |
| `ERF-7.4a` | `ERF-56` | |
| `ERF-7.4b` | `ERF-57` | |
| `ERF-7.5` | `ERF-58` | |
| `ERF-7.7` | `ERF-59` | |
| `ERF-7.7a` | `ERF-60` | |
| `ERF-7.7b` | `ERF-61` | |
| `ERF-8.1` | `ERF-62` | |
| `ERF-8.2` | `ERF-63` | |
| `ERF-8.3` | `ERF-64` | |
| `ERF-4.10` | cut | cut: prohibited a field that does not exist; producers already write only defined fields |
| `ERF-4.11` | cut | merged into ERF-36 (id uniqueness, stated once) |
| `ERF-4.13a` | cut | folded into 4.3's guidance prose (`short_name`) |
| `ERF-4.13b` | cut | folded into 4.3's guidance prose (`families`) |
| `ERF-4.13c` | cut | folded into 4.3's guidance prose (`semantic_query`) |
| `ERF-4.14b` | cut | retired unused before the flatten |
| `ERF-4.14c` | cut | retired unused before the flatten (the `cause` vocabulary) |
| `ERF-4.14d` | cut | merged into ERF-20 (drift is not stored in `evidence_at_stance`) |
| `ERF-4.18` | cut | folded into 4.3's guidance prose (what a bet's whys record) |
| `ERF-4.2` | cut | folded into 4.1's guidance prose (capture when first read) |
| `ERF-4.20` | cut | folded into 4.4's guidance prose (audit on change, not on a schedule) |
| `ERF-4.21` | cut | cut: asked a verdict to name its basis atoms, and no field could hold it |
| `ERF-4.21b` | cut | merged into ERF-25 (universal negatives cite surveys) |
| `ERF-4.22` | cut | retired with the question record type |
| `ERF-4.23` | cut | retired with the question record type |
| `ERF-4.26` | cut | merged into ERF-32 (narrative bindings are checkable) |
| `ERF-4.6` | cut | folded into 4.2's guidance prose (writing a finding well) |
| `ERF-4.8c` | cut | folded into 4.2's guidance prose (hand-written citation form) |
| `ERF-4.8d` | cut | cut: described a `locator` field that never existed in the model |
| `ERF-4.8e` | cut | merged into ERF-9 (source_quality encodes one axis only) |
| `ERF-4.8f` | cut | folded into 4.2's guidance prose (record the reason in `limitations`) |
| `ERF-4.8g` | cut | merged into ERF-10 (the discourse case) |
| `ERF-6.13` | cut | retired with the ship gate; v1 specifies no gates |
| `ERF-6.14` | cut | retired as consumer mechanics; survives as advice in a note |
| `ERF-6.8a` | cut | retired: v1 says nothing about presenting a claim to a reader who lacks the source |
| `ERF-6.8b` | cut | merged into ERF-45 (the wall is evaluated against declared levels) |
| `ERF-7.3` | cut | merged into ERF-53 (grouping carries no meaning) |
| `ERF-7.6` | cut | merged into section 2's actor definition |

## Guidance that governs whoever edits the specification

These were section 3.2 of the specification until 2026-08-23. They bind the
document's authors rather than an implementer building from it, which is
why they moved here.

1. Field names are `snake_case` in YAML and in the TypeScript interfaces
   alike: serialization fidelity outranks TypeScript idiom, and every
   example stays copy-pasteable between the spec and a file.
2. Type aliases are PascalCase and self-sufficient out of context:
   `EpistemicKind`, not `Kind`; `SourceQuality`, not `Quality`.
   SCREAMING_SNAKE is not used; in TypeScript it denotes constant values.
3. Types that populate an in-record list are suffixed `-Entry`
   (`StandingEntry`, `AuditEntry`) or name the event one line records
   (`SearchAct`): either way the name separates a record from a line
   within one.
4. The compound-reading test: every `field: TypeName` pair must read as
   spoken English (`created: ActorStamp` passes; `last_modified: Provenance`
   failed it and was renamed).
5. One meaning per word, checked against the glossary at naming time. The
   registered failure: the atom field once named `source` collided with the
   glossary's source, the captured document, and became `citation_text`.
6. The specification amends itself by its own discipline: a field is
   admitted only on a forcing instance (a real corpus demanding it), a
   vocabulary value only when it carries a distinct contract, and every
   retirement is recorded with the measurement that decided it.
7. A decision that closes a proposal, whether declining it or deferring it
   behind a trigger, is recorded in the register above in the same commit
   that implements it. A register nobody updates reads as complete, and is
   worse than none.
8. Every change lands in `CHANGELOG.md` with a date. (These last three
   were the specification's change-control bullets until 2026-08-24; they
   bind its editors, not an implementer, which is why they live here.)

## The personal corpus, and why the reference practice has none

This was a section of the specification until 2026-08-23, consisting of one
note and no requirement.

Nothing stops a corpus from holding its author's own positions, a register
in which the claims the owner currently stands on are that person's
standing positions, and in which "conviction" and "insight" are readings
rather than record types. Whether to keep one is a practice decision, not a
requirement.

The reference practice deliberately does not. Its author's positions live
outside the format, in a separate writing system: 109 essays, each carrying
a headline position, each revised about once a quarter, none of them leaned
on as a premise by any claim in any corpus. Nothing in that population
asked for backing, audits, or a ledger, and founding a register ahead of
that demand would add machinery nothing uses. What would change it is an
argument in a real claims tree resting on one of those positions. This is
recorded rather than hidden: a format's credibility rests on its author
saying which parts he runs.

## More than one operator

Two designs hold the boundary when corpora are shared, and both are
recorded here rather than in the specification, because the mechanics they
imply are deliberately unspecified until a second person exists in a
corpus.

Records meet by reference rather than by copy: a shared surface exposes
records where they live, nothing is imported by default, and identity
across realms is the pair of realm and id, so bare slugs never have to be
unique between parties.

Standings never travel: a disposition is computed inside one corpus from
that corpus's own standings, and a foreign record's home standings are
visible as attributed context that is never counted. That is the
multi-operator form of "only a person takes a stance", and it is what keeps
borrowed authority from crossing a shared boundary.

The mechanics a second operator would need are an actor registry,
provenance on a copied record, and a declared actor whose stance decides a
contested claim. Quorum, voting, and merge resolution are out of scope
permanently: contested already means current stances on both sides, and
what a disagreement means is a judgment its owner makes, not one the format
computes.

## Retirements the specification used to narrate

- **A narrative was once required to be two documents.** `ERF-30` said a
  narrative comprises the prose and a claims-tree compiled from the claims it
  rests on. The second document is a doc-class artifact of the reference
  practice rather than anything the format needs, and the requirement was the
  only one the example corpus broke. Cut on 2026-08-23; bindings alone carry
  the tie from prose to claims.
- **Two epistemic kinds.** "Inference" named how a claim was produced
  rather than what would check it. "Preference" logged zero uses in 279
  typed claims, and every taste decomposes: enforced taste is a commitment,
  self-reported taste is an observation about oneself.
- **Two relations.** `implies` was `assumes` written backwards; `refutes`
  had zero uses because counter-evidence lives on the claim.
- **Atom tags.** The field rotted measurably, 201 distinct values across
  146 atoms, and was dropped; retrieval over finding, quote, and citation
  covers the pulls it was serving.
- **Dual-auditor confirmation inside the quality tiers.** Earlier
  operational anchors baked audit state into `source_quality`; the
  conflation was retired so that each axis is recorded in its own home and
  composed at read time.
- **`rejected` was added rather than removed**, on 2026-08-23, because the
  disposition rule named four readings and left a legal input unnamed: a
  claim whose current stances are all `against` matched none of them. The
  vocabulary grew because a function was partial, not because a state was
  wanted.
- **The event-time key was once `on`.** `on` is a YAML 1.1 boolean, so the
  key round-tripped as `True` through standard parsers. It was renamed
  `timestamp` after the landmine fired.
- **A batch-size stamp on standings** was considered and rejected: "batch"
  has no enforceable boundary, and ruling mechanics do not belong in a
  record format.
- **A substrate revision identifier in a narrative binding** was considered
  and declined, because it would have forced the format to define what a
  revision is and how two compare, which is exactly what section 8 exists
  to keep out.

## The 0.9.0 work, dated

These entries were the dated sub-entries of `../CHANGELOG.md`'s `0.9.0`
section until 2026-08-26, and are reproduced here unchanged and in the same
order, newest first. They moved because a changelog answers what changed and
this document answers how the work went, and sixty kilobytes of narrative
under one version heading was answering the second question in the first
place. The terse record they were split from, requirement id by requirement
id, is [`../CHANGELOG.md`](../CHANGELOG.md) under `0.9.0`.

### 2026-08-26 — the essay, findable

The essay the format grew out of, *Epistemology for Knowledge Work in the
LLM Era*, was in the repository only as the raw artifact of the first
authoring trial. It now lives at `docs/essay/` with the PDF that
circulated, and the README opens with why the format exists.

### 2026-08-26 — F-030: six rules said two things, or forbade what no record can hold

`ERF-31` said the anchor MUST occur in its passage and then that a missing
anchor is a flag, not a violation; it now says the one thing (a flag).
`ERF-48` asked for `last_modified` later than any prior value, which a
corpus cannot show; a validator decides only that it never precedes
`created`, and the rest are SHOULDs. `ERF-41`'s admissibility test checked
what `StandingEntry` now enforces; it reads every entry the schema admits
and keeps the same-instant tie rule. `ERF-20` forbade storing drift and
counts in a closed object of two id lists; the prohibitions are gone and
the reason stays. `ERF-11` said the mechanical result MUST NOT be stored
while naming no field; it now says no field holds it and an `x_` copy is
never read as the check. `ERF-47` never said what an `evidence_audit`
judged; it names the dependency set per audit kind, and the reference now
counts an atom edited or attached after the audit as a change it never
saw. The off-vocabulary stance fixture cites `ERF-73`. Separately, the
essay corpus's third-party raw captures were removed from history (as the
Bitter Lesson corpus's were), with the source list's digests standing in.

### 2026-08-26 — the cold Rust validator, and the rubric's remainder filed

A second cold Rust validator, built from the `d124820` snapshot without
sight of the reference, addressed all 66 ids, tried 21 fabrications (14
stopped, 6 green by design, the first of them `F-017`) and listed 38
ambiguities. Checked against HEAD (`rust-triage.md`): `ERF-51` step 3 was
collapsing the U+2029 step 1 inserts, since U+2029 carries `White_Space`;
it is now exempt. `ERF-43` says vacuity holds for the root alone. `ERF-52`
says each span is taken at its earliest occurrence. `ERF-71` makes a
recorded digest a MUST against the held artifact, and the loader checks
it (`fixtures/invalid/digest-mismatch`). The schema's `Instant` admitted
seconds-less stamps RFC 3339 forbids; seconds are mandatory. Ten schema
descriptions cited retired ids; the binding skipped a section number.

What the four rubric readers said about the surviving rules, beyond the
fourteen retirements, is filed as five findings so it can be ruled rule by
rule: `F-028` (seven retire candidates that survived as trims), `F-029`
(fifteen MUSTs only a producer or auditor can honour, unattributed),
`F-030` (six self-contradictions or prohibitions on fields the schema
cannot hold), `F-031` (three rules still describing an order of work or a
topology), `F-032` (repeated definitions and an unbound lifecycle).

### 2026-08-26 — the Bitter Lesson closed loop: two validator gaps, four findings

A cold agent built a corpus top-down over Sutton's "The Bitter Lesson"
(115 atoms, 32 claims, 4 surveys, 31 sources, one bound narrative) from
the spec snapshot at `d124820`, reached zero violations in two passes, and
logged sixteen friction entries. Verified against the reference: the
command-line validator computed narrative-binding staleness (`ERF-32`,
`ERF-47`) and never printed it, and named nothing it did not check, which
the Validator class requires. Both fixed: `erf-check.ts` now prints
`ERF-47` flags for stale audits and bindings, `ERF-32` for indeterminate
bindings, and a `NOT-CHECKED` line per requirement it does not decide,
with `ERF-36` named as partial. A held raw or normalized text was listed
as unrecognized, one line per source; held artifacts are now excluded
(`ERF-73`). The Validator class paragraph named `ERF-36` twice, a residue
of retiring `ERF-38`; fixed. Four findings raised, none ruled: `F-024`
(no honest status for a full text held for checking), `F-025` (a
proponent's own assertion grades `high` and reads as backing), `F-026`
(elisions used to step over footnote markers), `F-027` (`conflicts-with`
had no honest use). `F-019` gains a second demonstration. The agent's
`ERF-73` complaint was the snapshot lagging the validator, not a defect.

### 2026-08-26 — the schema is the requirement: fourteen shape rules retire

Four cold readers, Opus, Gemini 3.1 Pro, Gemini 3.5 Flash and GPT-5.6 Sol,
applied one rubric to every requirement. Six were retired by all four
(`ERF-21`, `22`, `34`, `39`, `58`, `59`) and four by three, every one a
shape rule with the same deletion test from independent hands: the schema
already forces it. The operator ruled for the schema. `ERF-73` says every
document a corpus holds validates against `erf.schema.json`, with its body
attached where the model has one, and that a held raw or normalized file is
an artifact and not a document. Fourteen rules retired: `ERF-3`, `5`, `7`,
`12`, `19`, `21`, `22`, `34`, `37`, `38`, `39`, `55`, `58`, `59`. Each
reason now sits on the schema definition it explains; the status
vocabulary's glosses moved to section 5; `ERF-12`'s act clause, a failed
audit is never a verdict, moved into `ERF-11`; `ERF-55`'s presence
semantics moved into `ERF-56` and its wire spelling became the binding's
`YAMLB-2`. Four rules were trimmed to what a schema cannot hold (`ERF-4`,
`13`, `17`, `61`).

Two readers found what the others did not. `ERF-54` had said every file a
corpus holds carries `type`, which a held PDF cannot; it is scoped to
documents. `ERF-53` had every file round-tripping "through the model",
which a raw file does not; a document round-trips through the model and an
artifact byte for byte. `ERF-1` and `ERF-50` lose their workflow gates, the
rules describing a corpus's state whatever order it was built in. Fifty-four
requirements; every corpus measured, every verdict unchanged.

### 2026-08-26 — the fold leans on the standards, and the normative surface closes

The operator asked why the format was specifying Unicode and CommonMark in
its own words, and it was. The marker rule had been approximated twice, on
word characters and then on whitespace, each approximation failing an
honest quote, and the whole-words rule carried a private list of
word-internal characters that was a subset of a Unicode standard. `ERF-51`
is now four citations: render as CommonMark plain text, leaf blocks
separated by a paragraph separator; NFC; drop `Default_Ignorable_Code_Point`;
collapse `White_Space`. `ERF-52`'s word test is UAX #29's default rules
with one stated departure, a hyphen between two letters or digits. Measured
across all four corpora, 302 atoms and 57 anchors: every verdict identical.

Three expectations in the case file flipped, each CommonMark being right
where the approximation was wrong: `a*b*c` is emphasis; an unmatched star
is literal; a list or heading marker is structure, not text; a link folds
to its text. With the behaviour determined by named standards, the two case
files are instruments again and return to `conformance/cases/`; the clause
that let a case govern over the prose is gone. The preamble now states what
is normative and closes it at three: this document, the schema, and a
binding.

`ERF-6` gains the producer's duty the measurements had been pointing at all
day: a quote is taken from the normalized text by copying, a substring
operation performed by a tool, and never regenerated, because an author
that retypes tidies. `ERF-49` is retired: the schema has no field for
whether a claim is backed, so the rule forbade nothing, and *unbacked* is a
term in section 2, read from a claim's fields, a state and not a fault, in
a format whose rules describe a corpus whatever order it was built in.

### 2026-08-25 — the data model becomes a schema, and the spec gets shorter

The operator measured the specification at 1,568 lines after the day's
rulings, most of the growth rationale written inside requirements, and
asked where the stricter data model had gone. It had been sequenced after
the first publication, on an argument about id stability that had the cost
backwards: ids are stable from publication, so the cheapest moment to
change the model's form is before it.

`erf.schema.json` is now the normative data model, JSON Schema 2020-12,
thirty-two definitions discriminated by `type`. It carries what prose
carried badly: the three actor forms as disjoint patterns, the closed
vocabularies, the date precisions, SemVer, the source list's nesting, and
the conditional that a shipping source names its normalized text while an
absent one names its reason. A gate validates every valid fixture and the
example corpus against it, and a second gate holds `types/erf.ts` to it;
the TypeScript rendering is no longer normative and the mirror left
section 3. Twenty-one shape requirements collapsed to one MUST, a *Shape*
pointer, and the rationale a schema cannot hold. `ERF-31` split, its
HTML-comment grammar and recognition becoming the binding's own `YAMLB-1`.
The rationale the day's rulings had written into `ERF-35`, `41`, `43`,
`51` and `52` moved out or was cut, every MUST kept.

### 2026-08-25 — the second cold pass: eight fabrications through the first fix

Two more cold implementations, Python and Swift, read the corrected text and
attacked the quote check. The whole-words rule had stopped `The cat[...]sat`
and nothing else: `Revenue fell 12` passed against `12.5 percent`, `The
board` against `The board's`, `binding, and management did not recommend`
against `non-binding, and management did not recommend`, a soft hyphen or a
zero-width space was a legal place to cut a word in half, a heading could be
spliced to the paragraph under it, and `3*4` folded to `34`. Every one was
run against the reference and returned green before it was ruled on.

`ERF-51` now drops format characters, keeps a marker that has word
characters on both sides or neither, and folds a blank line to a paragraph
boundary no span crosses. `ERF-52` defines a word-internal character and
forbids a span edge beside one. `ERF-31`'s `id` can no longer eat the next
binding, its anchor is non-empty, recognition follows CommonMark past code
spans, and an unterminated candidate stops at its line. `ERF-41` admits a
standing only when well formed and breaks a same-instant tie by ledger
order, which is model data. `ERF-43` is global and reaches retired premises
anywhere in the closure. `ERF-65`'s examples now satisfy its own condition
under the schema it mandates. `ERF-53`'s loss reaches opaque values, list
order, narrative frontmatter, and the bytes of held files. Conformance to
the model and conformance to a binding are named as two things.

Measured: 164 real quotes, two newly failing, both honest quotations across
a paragraph break written as one paragraph, left as the measurement they
are. Fourteen new conformance cases, six new fixtures, suite 185 green.

### 2026-08-25 — the model is separated from its wire, and seven blockers close

Two cold implementations (Go, Haskell), a protobuf schema exercise and a
parser probe ran against the spec after the morning's rulings, and found
that the central mechanism had a hole. `The cat[...]sat` passed the quote
check against a text reading "The catapult was heavy. Someone eventually
sat": split-before-normalize plus trim had left substring containment.
`ERF-52` now requires every span to occur as whole words, at every edge and
not only beside an elision, because quoting `cat` out of `catapult` is the
same fabrication without the marker. Measured before ruling: zero
regressions across 164 real quotes.

Six more, each verified against the reference before ruling. `ERF-43`'s
closure could not be implemented as written: `supports` was in the closure
and not in the cycle prohibition, so two mutually supporting arguments made
a literal traversal run forever. `ERF-51`'s NFKC folded the ellipsis and
the long s, which `ERF-52` requires literal; NFC replaces it, measured
identical across every quote. `ERF-41` asserted a totality it lacked for a
stance outside the vocabulary. `ERF-31` used "its passage" four times and
defined it nowhere. The Validator class did not bind section 4, so a tool
that never opened a normalized text conformed. And `ERF-65` gains the
producer's quoting obligation, after the operator reframed a supposed
model defect as an interchange one: the model was never ambiguous about
`as_of_date` being a string.

**The model is separated from its wire.** Section 7 is "Serialization and
bindings": conformance is a property of a corpus as loaded into the model,
every binding MUST round-trip without changing a record, a field or a
verdict, and the YAML/Markdown binding is the interchange default.
`ERF-53` defines loss against the model instance and widens from every
record to every file, because the source list is the verifiability chain
and is not a record. `ERF-65`, `ERF-66`, `ERF-67` and the YAML half of
`ERF-53` moved to `bindings/yaml-markdown.md`, ids intact. Eighteen mixed
requirements are named for splitting in 0.10. YAML was inherited, not
chosen: `docs/history.md` records no forcing instance behind it, alone
among the format's decisions, and a sourced survey of its costs ships
beside the binding.

### 2026-08-25 — six trials against the prose alone, and the queue they left

Six independent trials ran against `SPEC.md` and nothing else: no reference
implementation, no fixtures, no example corpus. Three built working
validators by hand in Python, Rust and SQL; two authored corpora from
scratch, one of them 71 sources, 151 atoms and 53 claims; one wrote
adversarial fixtures. They found two defects in the reference
implementation within the hour, including an `ERF-19` check that matched
flow-style YAML only and had been hiding a bug in the format's own fixture.
Their twenty-four findings became a governed backlog with a priority, a
basis, and a verification record on every entry.

**Discovery is by content, and `type` is on every file (`ERF-54`).** The
rule covered records; it now covers the declaration, the source list and
narratives too, so no meaning lives in a path and any substrate's export is
readable. Proven by scrambling the example corpus, declaration renamed and
atoms buried two directories deep, and loading it identically.

**`as_of_date` states what the source pinned, no more (`ERF-14`).** A year,
a year and month, or a full date, never precision the source did not give.
A conforming validator had been rejecting the specification's own example
corpus, and two authors had recorded incompatible period conventions.

**A reference asserting *now* must resolve; one recording *then* is
flagged (`ERF-35`).** Stated as a principle rather than a longer list.
`evidence_at_stance` is on the historical side by construction: once atom
lifecycle exists, a hard resolution rule would let one withdrawal
retroactively break every standing that ever faced that atom, which is the
failure `ERF-43` already reasons about.

**A flag is not a violation**, said once in section 2 rather than a sixth
time in a requirement. Flags exist because these conditions arise with no
edit to the record carrying them: stranded evidence (`ERF-35`), an aged
binding (`ERF-32`), a hollowed argument (`ERF-43`). A corpus carrying flags
and no violations conforms, and a consumer may neither present a flag as
failure nor hide one.

**The premise closure excludes its own root (`ERF-43`).** A premise-less
argument therefore satisfies the rule vacuously and is `ERF-49`'s flag;
reading the root into its own closure made one record both conforming and
not. Nothing had ever enforced the closure rule at all.

**The narrative binding is closed and made visible (`ERF-31`).**
`bound-at` is required rather than optional, which exposed that a required
part made a binding *invisible* rather than invalid: a comment failing the
grammar is indistinguishable from any other HTML comment, so its claims
vanished silently. The grammar therefore gains the recognition rule it
never had. The anchor now folds under `ERF-51`, the same test as the quote
check, because this format answers *does this string occur in that text*
exactly once; it carries the escapes `\"` and `\\`, because a passage whose
own words are quoted otherwise has no anchor at all; and a validator MUST
flag an anchor that stops occurring, which is what three silent breakages
across two trials were waiting for.

**A narrative's frontmatter is typed (`ERF-34`).** `title` a string,
`corpus` a corpus id, `created` the `{timestamp, by}` stamp everything else
carries. One field name with two shapes is how an implementer is made to
guess.

**`ERF-55`'s omit rule governs lists.** An optional mapping present and
empty asserts existence and MUST be written: absent `evidence_at_stance`
means the ruler stamped nothing, present and empty means the ruler stamped
and faced nothing, and `ERF-20` calls the second unrecoverable.

**The source list's top level is exactly `type` and `sources` (`ERF-3`).**
The earlier wording named both keys without saying which contained which,
and an independent implementation read the entries as further top-level
keys. The result was 151 correct atoms reported as naming sources that do
not exist. This was the first demonstrated interoperability break between
two implementations of the format.

**The quote check ran on the authored corpora for the first time.** Both
had gone dark under the `ERF-54` widening and the source rework, their
source lists unread. Migrated, 156 of 160 quotes now check. All four
failures are real transcription divergences and none is a normalization
gap: two are a space before a semicolon that an 1853 scan preserves and an
author tidied away, one is editorial brackets marking a reconstruction
silently dropped, one is a curly apostrophe written over the source's
ASCII. That is the cut to `ERF-51` doing what it was cut to do.

**Three gates that reported on what they did not read.** The loader skipped
unrecognized files in silence, so a widening that orphaned two source lists
surfaced as 151 accusations against the atoms; it now reports them.
`SPEC.md` and `types/erf.ts` disagreed on field names for a day, the source
rename having reached the model, the loader, the viewer and the fixtures and
stopped short of the specification. And `backlog-index.py` hand-rolled a
frontmatter parser, so four entries were invalid YAML without the tool whose
job is to catch that noticing. All three fixed; the pattern is recorded as
`F-005` and `F-006`.

**A licence, at last.** CC BY 4.0 for the specification and prose,
Apache-2.0 for the reference implementation and tooling. An implementation
is not a derivative work of the specification, and nothing in either licence
reaches the corpora anyone builds.

### 2026-08-25 — the pipeline is named, and the capture becomes normalized text

The word "capture" is retired. Web archiving already uses it for the raw
bytes off the wire, and this format used it for the derived text at the
other end of the pipeline, which is the established term for the opposite
of its established meaning. Sixty-four occurrences across seventeen
requirements now say what they mean.

The pipeline has four stages and the format names all of them. A **raw
file** arrives, from the web or an inbox or a scanner, and `received`
records where it came from, where the corpus holds it if it does, its
digest, and the date it arrived, which is what `ERF-2` demanded and had
nowhere to put. **Extraction** turns it into markdown by a named
deterministic tool. **Excerpting** selects the passage, and it is the one
step no tool can be named for, so it is attributed: `excerpt.by` records
who chose, an LLM included. **Normalization** cleans that markdown by a
second named deterministic tool. The result is the source's **normalized
text**, at `normalized`, with `normalized_digest` beside it, because that
file is what every quote check actually runs against and nothing pinned it
before.

The extraction's own output is not retained, stated as a choice: both tools
are named and deterministic, so anyone holding the raw file reproduces it.

Selection being fallible is answered rather than accepted. `ERF-69` now
requires that the normalized text occur, under the folding of `ERF-51`, in
the normalization of the whole extracted source. That is the quote check
one level up, it costs no new machinery, and it means a fallible selector
can pick the wrong passage, which is a judgment attributable to it, but
cannot silently alter one. Four invented-punctuation defects found by hand
across five authoring batches would have been caught by this.

The two-cut consequence follows: a corpus holding every raw file is the
full cut, and a published cut drops `received.path` and ships the
normalized texts that quotation permits. Same records, same ids, so a
reader citing an atom cites the same thing; what differs is what they can
verify without fetching the raw themselves.

Closes B-44 and B-52.

### 2026-08-25 — normalization drops from seventeen steps to three

Operator rulings on the capture pipeline, taken after four normalization
defects turned out to share one cause.

**Extraction and cleanup are named tools on the source.** `converter`
becomes `extraction`, a string naming the tool and its exact version, and
`cleanup` joins it for the step that reflows wrapped lines and repairs
export artifacts. Both absent when the step did not happen. The nested
`Converter` shape and its `deterministic` boolean are gone, the boolean
because determinism is now unconditional: `ERF-70` forbids a
non-deterministic tool from producing a capture, which resolves the
contradiction where the same requirement demanded determinism and then
permitted its absence four lines later.

The format does not say what good cleanup is. It cannot know, for a table
or a code block or a line of verse where the line structure is the content.
It requires only that whatever was done is named and can be run again.

**`ERF-51` keeps three steps: NFKC, strip markdown emphasis and code
markers, collapse whitespace.** Each describes a difference the author did
not introduce. The fourteen that went were doing two jobs the sequence
should never have held. Layout repair, which was guessing at information
the extractor discarded, moves to capture time under `ERF-70`. And the
character folds went for two reasons: they were unfinishable, covering the
Anglophone quotation marks and not French guillemets, German low quotes,
CJK corner brackets or two-em dashes, so a French source failed a format
claiming to fold quotation marks; and they forgave the wrong thing, since
the capture is what the check runs against and an author who retypes rather
than copies is guessing at their own evidence.

Measured before the cut, across 160 atoms in three corpora: four newly
fail, and every one is a real transcription divergence the folding had
concealed. The stricter check did not break four atoms. It found four that
were never quite verbatim, on a corpus that had passed every gate until
now.

Step 7's deletion is the sharpest of them. A hyphen at a line break is
undecidable without knowing the word, `classifi-cation` being one word and
`Pre-money` two, so the sequence stopped guessing and the producer resolves
it while looking at the page. Deferred as `B-55`, with a dictionary as its
trigger.

The conformance cases move with the requirement, including four new ones
asserting what the sequence no longer does: a retyped curly apostrophe
fails, a hyphen at a line break is not joined, a capture still carrying
markdown link syntax fails rather than being repaired. `types/erf.ts` is
brought to 0.9.0 in the same pass, its corpus comment no longer calling a
corpus a confidentiality tier and its declaration comment no longer naming
the registry retired on 2026-08-24.

### 2026-08-24 — v0.9, and a full staleness read

The version drops from 1.0 to 0.9, by operator ruling: the specification
is complete and internally verified, and 1.0 waits on stress testing in
real use beyond its author's practice. Every declared `spec_version`
moves to "0.9.0" (the example corpus, nineteen fixtures, the document's
own frontmatter); the reference consumer now implements major 0; the
unsupported-major fixture keeps its 2.0.0.

The ruling came with a fair challenge: the day's type simplifications
had not shrunk the document, so was anything stale? A front-to-back read
found eight spots the vocabulary greps could not see, all fixed:
`ERF-17` required a claim's corpus to be "registered" a day after the
registry retired (now: declared, `ERF-59`); `ERF-68`'s quotation clause
never received the `shipped-as-quotation` status name, an edit lost when
a script aborted mid-run; `ERF-69` and `ERF-70` addressed their MUSTs to
"the capture" though `excerpt` and `converter` live on the source since
the flattening; the Claim mirror's `corpus` comment still said
"confidentiality tier"; the mirror's omitted-alias list lacked
`SourceId`; the security section carried a dangling "capture" from a
partial replace; the definitions list defined capture, attester, and
deployment but never source; and two headings lacked their blank line.
On the length itself: the day netted +75 lines against a morning
baseline of 1,212, decomposed as roughly +70 for the capture
requirements and the rewritten ERF-51 note, -39 for the container
pare-down (the cuts less ERF-72 and the expanded ERF-59), and +41 for
the source artifact with its worked example. The types got simpler; the
document grew because three requirements, one mechanism, and one example
are new.

### 2026-08-24 — the source flattens to one shape

Operator review of the day's additions found structure without data
behind it: `Source` nested a `CaptureEntry` that nested a `Converter`,
three interfaces and two levels for a relationship `ERF-2` makes strictly
one-to-one (a revised document is a new source, so a source has exactly
one capture, forever). The source is now one flat shape. `CaptureEntry`
is deleted; `converter` stays a small object ({tool, deterministic}) by
operator ruling.

Two field defects went with the nesting. `source_locator` and
`source_digest` stuttered inside their own entity (`source.source_digest`)
and split one concept across two fields beside a third (`fetched_url`)
that overlapped both. There is now exactly one retrieval concept:
`fetched`, with `url` (the artifact actually retrieved, the file itself
and never a landing page describing it, per operator ruling) and an
optional `digest` ("sha256:<hex>") where the location serves stable
bytes. `ERF-7` and `ERF-71` reword accordingly; a source that cannot be
pinned simply carries no digest, which itself tells a reader what kind
of source it was.

Two vocabulary retirements in the same pass. "Corpus artifact", coined
yesterday to group three shapes, has nothing left to group and is gone:
the spec now says records and, beside them, the corpus's declaration and
its sources, with the one distinction that matters stated where the
source is defined (a source is not a record: no created stamp, no
standings, no disposition, because nobody asserts a source). And `ERF-3`
stops mandating "a YAML document": the source list is stated
substrate-neutrally like everything else, with the YAML form as its
section 7 interchange form, ending an inconsistency where records could
live in any store and sources were chained to a file format.

`path: null` entries disappear (the model's `path` is optional; absence
is the absence). The example corpus, both standalone source examples,
every fixture, and the hygiene roster flatten to match.

### 2026-08-24 — the source becomes a corpus artifact

The format's section 4.1 was titled "The source" and defined no source:
a work's identity lived on each atom (`citation_text`, `citation`,
`fetched_url`) and its capture lived in a mapping keyed by atom id, so a
work quoted by three atoms was described three times and the descriptions
were free to disagree. The live practice showed the symptom (one page
graded differently by two atoms, byte-identical capture entries repeated
per atom, "same source and same reason as kwg-014" written in prose
because the structure had no way to say it), and the classical diagnosis
is an update anomaly: an attribute stored off its entity.

The source is now the fourth corpus artifact, beside the declaration and
the capture entry. `sources.yaml` lists each work once (`ERF-3`):
citation, retrieval locator, and capture together, keyed by a source id
unique within the corpus. The atom names its source (`source`, `ERF-4`)
and keeps `source_quality`, deliberately: the grade is a judgment about
how much weight the attester's word carries for this finding (`ERF-9`,
`ERF-10`), so two atoms may legitimately grade one source differently,
and the spec now says so where it says what the atom carries. `ERF-7`
and `ERF-8` move to the source with their ids and their meaning intact;
`ERF-5`, `ERF-68`, and `ERF-71` reword from "entry" to "source". The
`CaptureEntry.source` prose note is gone, made redundant by the source's
own citation.

The example corpus's nine atoms now share five sources, which is the
deduplication demonstrated rather than asserted; its four shipped
captures carry `shipped-as-quotation` with `excerpt: true`, exercising
2026-08-24's capture requirements. Standalone examples gain
`source-book.yaml` (a scanned public-domain PDF converted by a named
deterministic tool, locator and digest pinned, the full ERF-69/70/71
chain) and `source-web.yaml` (a withheld capture with its reason);
`atom-book.yaml` and `atom-web.yaml` slim down to match. Every fixture
migrates; `atom-absent-from-mapping` now asserts an atom naming a source
the list does not hold, and the URL fixture asserts `ERF-7` on the
source. The backlog gains the three re-add triggers the pare-down owed:
cross-deployment identity, the classification wall, and the registry.

### 2026-08-24 — the container layer pares down to the corpus

Realm, the corpus registry, and the classification wall leave v1, by
operator ruling, so the version that publishes is the version a reader
can hold: every concept that remains is one a first corpus needs. The
coverage map had already said this quietly: of six uncovered requirements,
two were the wall and the registry's ordered levels, and the one
untestable-for-want-of-an-implementation requirement was multi-realm
identity. Structure nothing exercises is anticipation, and the backlog
rule (a thing earns its place by demonstrated need) now applies to the
container layer as it always applied to fields.

**`ERF-45` is retired.** The wall (a record must not cite a record whose
classification is narrower) is a rule about who may see what, which is a
policy, and v1 struck policies on 2026-08-23. The security section now
says plainly that a deployment mixing open and sensitive corpora needs
such a rule and that this version gives it no vocabulary and no check.

**`ERF-64` is retired.** The corpus registry, with its ordered
classification levels, becomes deployment practice the format no longer
specifies. The reference deployment keeps its registry file; the spec
stops requiring one.

**`ERF-16` is retired and realm leaves the vocabulary.** Ids are scoped
to the deployment, said plainly: the corpora read and cited together
(`ERF-35` through `ERF-38` reworded). Cross-deployment identity goes to
the backlog with its trigger, two parties sharing records whose ids may
collide.

**The manifest becomes the corpus declaration (`ERF-59`).** A manifest
lists contents and this document never did; a declaration declares what
the corpus is and what version it speaks. `classification` survives as
an optional opaque label the format records and does not read, so a
travelling corpus can still name its sensitivity without the format
pretending to enforce it; the manifest-versus-registry tie-breaker goes
with the registry. `CorpusManifest` becomes `CorpusDeclaration` in the
model; `RegistryEntry` is deleted.

**`ERF-72` adds the extension namespace.** A field named `x_*` is legal
on any record or corpus artifact, never an unknown-field violation, and
is where a practice grows vocabulary before the spec admits it; a field
graduates by entering a later version under its bare name. Everywhere
else `ERF-55`'s strictness stands, deliberately: rigid by default,
extensible in one designated place, against the decay that general
tolerance invites. The `licence_note` field this morning's audit removed
is the motivating instance: as `x_licence_note` it would have been legal
experimentation rather than a defect.

Sixty-six live requirements; the retired set is 16, 29, 30, 45, 46, 64,
all guarded against refill. The viewer honors `x_`, requires only id,
title, and spec_version of a declaration, and renders classification
only where one is present. A new valid fixture carries an extension
field and a declaration with no classification.

### 2026-08-24 — the freeze lifts for captures: excerpts, converters, source identity

The operator lifted the 2026-08-23 freeze for one batch: the capture layer
was too thin to carry the example corpus that is actually wanted (the
knowledge-work essay and its 147 atoms, most of whose sources permit
quotation but not republication). Three requirements added, two amended,
one note rewritten; all landed with their implementation, their model
changes, and their coverage rows in the same pass.

**A capture may be an excerpt (`ERF-69`).** A capture holding the quoted
passage plus enough adjacent text to make its place in the source legible
is a conforming capture, and must identify itself as one. The excerpt
route exists because the format needs verifiability and not
republication: a short quotation with attribution is available where
republishing the work is not.

**A converted capture names its converter (`ERF-70`).** Where the capture
text was produced from a PDF, a web page, or an EPUB, the capture records
the tool and its exact version, and the tool must be deterministic; a
non-deterministic converter may be used but must be declared, which marks
that check as reproducible by nobody but its author. Naming the
instrument rather than specifying the conversion is ERF-26's move,
applied to extraction, and for the same reason: no standard defines a
faithful text projection of a PDF or an HTML document.

**Source identity travels as a locator and a digest (`ERF-71`).** An
excerpt or converted capture should record an immutable locator for the
source artifact and its digest, algorithm named. Together they close the
step the format cannot otherwise check: a reader who fetches the artifact
confirms it is the one the author held, then re-runs the conversion and
the containment check themselves.

**`ERF-5` splits copyright from contract.** `not-redistributable` now
means copyright forbids republication, and a new `access-restricted`
means an agreement accepted to obtain the source forbids extraction. They
fail differently: the first leaves ERF-69's quotation route open, the
second closes it, since a term of access is not answered by a passage
being short.

**`ERF-68` gains the quotation basis.** A capture may ship under no
licence at all, as a short quotation for verification and comment, and
the entry must say so (status `shipped-as-quotation`) rather than leaving
the permission unstated. The example corpus's four W3C captures were
mislabelled with an SPDX id for a different licence precisely because the
vocabulary had no honest option.

**The ERF-51 media-type note is rewritten.** Captures are authored, not
converted at check time, so the deferred per-media-type extraction
profile is no longer a successor design: the conversion happens once, in
the capture author's hands, under ERF-70. The note now records why no
extraction standard exists (reading order, table cells, alt text, and
footnotes are editorial questions), and two findings from converting a
real scanned source: an OCR layer already embedded in a hashed artifact
is not a source of nondeterminism, and OCR's irregular spacing is exactly
what normalization step 11 absorbs — the Pacioli 1494/1914 quote fails a
raw substring search and passes normalized.

The `CaptureEntry` shape grows accordingly (two statuses, `excerpt`,
`converter`, `source_locator`, `source_digest`, and a `Converter` shape)
in `types/erf.ts` and the section 3 mirror; the viewer asks one
`shipsWithCorpus` predicate instead of comparing to the `shipped`
literal; ERF-69/70/71 enter the coverage map as uncovered, honestly, with
their fixtures owed.

### 2026-08-24 — an audit of the satellites: five fixes, no spec change

An audit of `types/erf.ts`, `viewer/`, and `examples/corpus/` against the
specification. The model and the viewer passed: the section 3 inline mirror
is field-for-field identical to the file across all fifteen declarations,
every type the viewer declares locally is a derived reading or a loader
shape the model correctly does not define, and the committed render matched
a fresh run. Five fixes in the corpus and the suite, none of them touching
a requirement.

**`spec_version` is a quoted SemVer string (`ERF-61`).** The example
manifest and every fixture declared `spec_version: 1.0`, which is not
Semantic Versioning and, under the YAML 1.2 JSON schema that `ERF-65`
mandates, loads as the number 1 where the model types the field `string`.
The viewer's major-version check survived by accident and the minor version
was silently destroyed, which is exactly the information `ERF-60`'s
minor-version rule reads. The rendered corpus page said "conforms to ERF 1"
and now says "conforms to ERF 1.0.0". Twenty files, `"1.0.0"` throughout
and `"2.0.0"` in the unsupported-major fixture.

**The example captures carry no SPDX identifier, correctly (`ERF-68`).**
The four shipped captures paired `licence: W3C-20150513` with
`licence_name: "W3C Document License 2023"`, which are two different
licences: SPDX's `W3C-20150513` is the *Software* Notice and Document
License of 2015, and SPDX has no identifier for the W3C Document License at
all (verified against the published list). The capture headers invoke the
2023 document licence, so the identifier was simply wrong. It is removed
and the plain name kept, which is what `ERF-68` prescribes where no
identifier applies.

**`licence_note` is gone (`ERF-55`).** The mapping originated a field
`CaptureEntry` does not define, and neither the viewer's unknown-field
check nor the suite reached capture entries to catch it. Its content was
licence terms and a note on shared captures, both of which now sit in the
file's comment header where they explain without pretending to be data.

**The retired-id guard covers `ERF-30`.** It checked `ERF-29` and `ERF-46`
but not `ERF-30`, retired the same week, so a refilled `ERF-30` would have
passed the suite.

**A coverage note stopped citing a retired id as live.** `ERF-18`'s row
said "the mechanical half is `ERF-46`" after `ERF-46` was retired into that
very guidance; the guard test reads row keys, not note prose.

### 2026-08-24 — two reviews adjudicated: eighteen external findings, fourteen internal

A cross-vendor adversarial review (GPT-5.6 sol) and an internal pass ran
against `c648804`; both are archived verbatim with per-finding rulings in
`reviews/`, a new top-level home for disposition-of-comments records. The
external reviewer was handed the decision register and re-raised nothing
already ruled — the register working as designed. Every accepted finding
below is implemented in the commits carrying this entry.

**Serialization made total (`ERF-53`).** The canonical interchange form is
one record per file, frontmatter plus body, the atom's body empty; a store
may group records or hold bodies as fields provided lossless round-trip.
The section 4.2 atom example is now a conforming record (it lacked `type`
and `corpus` and its citation block violated `ERF-8`; `publisher-place`
and `chapter-number` added).

**Surveys can be kept (`ERF-28`).** Immutability now binds what cannot
have been otherwise, the conducted acts and their yields; a transfer, a
body note, or an atom link landing in `notable_results` stamps a new
`last_modified` like every other record.

**Captures ship on their licences.** Operator ruling: what data travels is
outside the spec. The security section's blanket MUST NOT is now
licence-conditional description; `ERF-5` records the withholding judgment,
`ERF-68` names the licence when a capture ships.

**Arguments know their premises (`ERF-24`, `ERF-43`, `ERF-49`).** A
premise arrives from either side of the graph: the argument's outgoing
`assumes` edges, or another claim's `supports` edge pointing at it. The
closure is directed accordingly; the retired-leaf condition became a
validator flag (a legal withdrawal elsewhere cannot retroactively make a
corpus non-conforming); the unbacked warning consults both sides.

**Ordering is honest about precision (`ERF-47`, `ERF-48`).** A staleness
comparison the stamps' precision cannot order (bare date against same-day
instant) resolves to stale; equal bare dates read as current; `ERF-48`
says what "later" means at date precision. `ERF-19`'s argument, applied to
the rest of the format.

**The corpus artifacts have shapes.** `CorpusManifest`, `RegistryEntry`,
and `CaptureEntry` join the normative model; the registry governs where it
and a manifest disagree about classification (`ERF-59`); the conformance
classes now bind them (Corpus) and every machine-checkable MUST
(Validator).

**`ERF-46` is retired**, folded into `ERF-18`'s guidance. Three of the six
real corpus claims open in other words than their titles; whether an
opening in other words states the same claim is a reading, and the
2026-08-23 ruling already held that authoring judgment is not numbered.
The id is not reused.

**Smaller closures:** references resolve in the realm namespace, stated
once (`ERF-35`); a corpus transfer is never recorded as a standing entry,
which would move the disposition as a side effect (`ERF-17`); binding ids
got a lexical grammar (`ERF-31`); MAJOR means unreadable *or read with
changed meaning* (`ERF-61`); the `high` source-quality anchor is
disclosure under accountability, removing its overlap with vendor
self-claims (`ERF-9`); `auditor` is a bare instrument id, deliberately not
an `Actor` (`ERF-11`); the audit lists are append-only like standings
(`ERF-40`); the date-coercion war story is correctly blamed on YAML 1.1
legacy defaults, not the 1.2 Core schema (`ERF-65`); the conformance case
files are normative for normalization's exact behavior (`ERF-51`); the
change-control bullets that bind editors moved to the design history; the
3.1 field tables became a compact field-to-requirement index.

**The satellites were swept.** Pre-flatten ids, the retired survey
`limitations` field, a Questions row surviving the type's cut, wrong
counts, a stale normalization disclaimer in the viewer README, and four
atoms violating the actor convention — all corrected, and the conformance
suite now validates the shipped examples and greps the repository for
pre-flatten ids, so the drift class fails a run instead of waiting for the
next reviewer. Requirement coverage rose from 25 to 41 of 65, with
thirteen new invalid fixtures and four new suites.

### 2026-08-23 — three rulings: standing precision, ERF-30 cut, normalization order

**A standing carries a full RFC 3339 instant** (`ERF-19`), with a time and an
offset, never a bare date. Precision is mandatory here and nowhere else
because the standings ledger is the only ordered structure in the format: a
bare date and a full instant on the same day cannot be ordered against each
other, so a consumer selecting the newest stance would settle a claim's
disposition by accident. A bare date stays correct for `as_of_date` and a
survey's `conducted`, where nothing is ordered.

Implementing it found a larger defect underneath. YAML coerces an unquoted
timestamp into a date value, so the reference consumer was comparing
stringified dates, which sort alphabetically by weekday name. Newest-stance
selection, and therefore every computed disposition, turned on the day of the
week. `currentStances` now compares parsed instants, and the precision check
reads the raw frontmatter, since a parsed value cannot tell the two forms
apart.

**`ERF-30` is cut.** It required a narrative to comprise prose plus a
claims-tree document. A claims-tree is an artifact of one practice's doc
class, not something the format needs; a narrative carrying bindings already
points at its claims; and requiring a companion document is the format
reaching into use, which this version does not do. It was also the only
requirement the example corpus broke. The id is retired and not reused.

**Normalization is idempotent again** (`ERF-51`). Straight-quote removal ran
in the unwrapping steps, before the fold of typographic quotes into straight
ones, so nothing removed the results of the fold: `"straight"` normalized to
`straight` while a curly pair normalized to `"curly"`, and one quotation typed
two ways produced two strings. Quote removal is now step 5, immediately after
the fold, matching the working implementation the 19-versus-9-percent
measurement came from. No verdict changed on the example corpus.

### 2026-08-23 — the reference consumer is made to obey the specification

A conformance trace over all 63 requirements asked, for each one, whether
any code actually implements it. Two earlier passes had not: the spec audit
asked whether a requirement should stay, and the external review asked
whether requirements contradicted each other. Neither opened the viewer.

The trace found 24 gaps, of which these mattered most, all now fixed.

**Every narrative binding rendered as raw markup.** The grammar was
implemented twice, and only the parser gained `bound-at`. The renderer's
copy matched nothing, so six escaped HTML comments were visible in the
published page and no "rests on" link rendered at all, in direct violation
of `ERF-33`. There is now one grammar, defined once and imported.

**The reference consumer did not implement its own mandatory
normalization.** `ERF-51` makes six unwrapping steps equally mandatory and
carries the measurement that made them so, and the viewer implemented none
of them, computing verdicts under exactly the configuration the
specification says diverges and printing them as "Quote check passes". All
six are implemented in the specified order.

**The highlight and the check disagreed by construction**: the check
compared normalized text while the highlight searched raw text, so a quote
passing only after normalization showed a green box and no highlight, with
no explanation. The highlight now tries a literal then a whitespace-flexible
match, both exact in the raw text, and says so plainly when neither lands.

**Duplicate ids were undetected and destructive.** A `Map.set` on an
existing key discarded the first record silently, so a duplicated atom id
made one atom vanish and redirected every claim citing it. The loader now
reports and keeps the first. The validator in the private corpus this format
was extracted from checked claims only, leaving 741 atom ids and every survey
unguarded; it now covers all three types.

**A non-verdict could load as a verdict**, since the union is compile-time
only and YAML is cast straight through. `ERF-12`'s three values are checked
at load, which is the failure that put 32 `PARSE_ERROR` values in a real
corpus.

Also: the capture mapping is checked for completeness, so an omission is
distinguishable from a recorded absence, which is what `ERF-4` is for;
`ERF-47` staleness extends to a claim's evidence audit; `ERF-32` binding
staleness is computed and surfaced, reporting `indeterminate` where
`bound-at` is absent rather than reassuring; a claim's conflicts now include
the half stored on the other side of the pair, per `ERF-44`; the manifest's
four required fields are validated; and `rejected` claims render styled.


### 2026-08-23 — a survey states its coverage bounds in its body

`limitations` leaves the survey record and stays on the atom, and the
asymmetry becomes a stated rule: **a record with a body carries its caveats
there.** Claims and surveys have bodies and use them. The atom has none, so
its `limitations` is not a caveat slot bolted onto existing prose, it is the
atom's only prose. A survey carrying both a body and a caveat field was
saying the same thing in two places.

`ERF-29` is retired and its id is not reused. The substance survives as
guidance in the survey section: a survey cited for an absence or a
sparseness reading should close by stating what its acts did not cover and
how deeply hits were inspected, and a complete search of a closed corpus
correctly has nothing to state. The three surveys in the reference practice
and the example corpus had their bounds folded into their bodies verbatim.

### 2026-08-23 — the v1 pare-down

The specification is cut to what an implementer needs. 1,306 lines to
1,129; 85 requirements to 64; 22 non-normative notes to 9.

**Section 4 regrained.** It held 52 of the 85 requirements and almost none
of them were checked by anything, so most of the document's normative
weight was authoring advice wearing MUST. Each record type now reads as
one unit: what it is for, how to write one well as prose, then the
numbered promises the format makes about it. A promise is a statement
about what a record *means*; advice about writing a good one is no longer
numbered. Section 4 fell to 34 requirements.

**Requirement ids flattened.** `ERF-<section>.<sequence>` with letter
suffixes became `ERF-1` through `ERF-64`, a flat sequence carrying no
meaning beyond identity. The old scheme had already rotted: section 4's
numbers ran backwards once, one base appeared in the order c, d, a, e, f,
b, g, and two ids were retired silently. Ids are stable only once
published, so this was the last free moment. The old-to-new mapping is in
`DESIGN-HISTORY.md`, which is what keeps historical citations readable.

**Three things that were broken.** The manifest's governing key was
`schema_version` in one place and `spec_version` in four others, so a
producer could not tell which to write; `spec_version` throughout now. A
requirement described a `locator` field that never existed in the data
model, and is cut. A requirement asked an audit verdict to name the atoms
that carried the weight, which no field could hold and a strict producer
could not satisfy, and is cut.

**Vocabulary.** `canonical store` and `collection document` are gone as
terms of art, the first said plainly in one rule and the second admitting
outright that it carried no meaning. `substrate` is redefined without
leaning on the term that left. `realm` is now mechanical, the set of
corpora one corpus registry lists, which removes a circular definition.
`binding` is `narrative binding` everywhere, because the short form reads
as a programming term. Section 8 is renamed *Storage*: it was called a
conformance class and is not one.

**Notes.** History left the specification for the design history, which
gained a fourth part holding it: the flatten's mapping table, the naming
conventions that govern whoever edits the spec, the personal-corpus
disclosure, the multi-operator sketch, and the retirements the spec used
to narrate. Notes that help someone build, or that prevent a specific
misreading, stayed.


Everything below is pre-publication iteration. The format has not shipped a
version yet, so these dated entries record how the design moved rather than
what changed between releases; at first publication they become **v1.0** and
version numbers start meaning something. The durable record of what was
decided, and why, is the register in `DESIGN-HISTORY.md`.

### 2026-08-23 — the example corpus gains real captures

The example corpus shipped no captured copies, so the reference viewer's
best screen, a verbatim quote highlighted inside its source, was implemented
and never exercised. Four atoms now quote two W3C Recommendations, PROV-DM
and PROV-O, whose Document License permits redistributing portions of a
document provided the original link, the copyright notice, and the status
travel with the copy. The captures carry all three, the quote check runs
green on all four, and the capture pages show the highlight.

The five atoms whose sources cannot be republished keep their explicit
absence entries. The mixed state is deliberate: it is what the format looks
like in the ordinary case, where some evidence travels and some does not,
and the viewer says which is which. `captures.yaml` now records a licence
alongside each shipped path.

### 2026-08-23

The question record type is removed. A minor-version change rather than a
patch, because a record type leaving is a change to what the format is.

The measurements behind the decision, from the reference practice: 25
question records across five corpora, every one `status: open`, not one ever
marked answered or parked, `answered_by` never written once in a year, two
with sub-questions, four cited by compiled documents. The lifecycle
machinery was unexercised, but the records themselves were real and in use.
This is a scope decision taken to keep v1 shippable, not a finding that
questions were useless: the 25 questions still exist, carried as prose in
per-corpus `open-questions.md` documents beside the corpora they belong to.

Removed with it: `Question`, `QuestionId`, `QuestionStatus`, `ERF-4.22`,
`ERF-4.23`, section 4.5, the question rows in the field reference, and the
question status vocabulary. Sections 4.6 through 4.8 renumber to 4.5 through
4.7; no requirement id is renumbered and no retired id is reused.

`Claim.bears_on` and `ERF-6.7a` go too, and the honest account is that they
were four hours old. `bears-on` was admitted as a fifth relation in v1.0.3,
moved to a field in v1.0.7 because `edges` is claim-to-claim, and removed
here because its only possible target was a question. The link it carried is
preserved: each of the 18 claims that bore on a question now says so in its
working notes, in prose, naming the question and where it lives. The relation
vocabulary stays at four.

### 2026-08-23

`bears-on` becomes the `bears_on` field and stops being a relation. This
partially reverts v1.0.3 from earlier the same day.

The evidence that admitted it was sound and stands: 18 live edges recorded
that a claim bears on an open question, and nothing else in the format could
say that. The placement was wrong. `edges` is the claim-to-claim structure,
and every other record type a claim reaches already has its own typed field,
so `atoms_for`, `atoms_against`, and `surveys` were the pattern and a
question id inside `edges` was the anomaly. That anomaly is what made the
normative prose contradict the data model: `ERF-6.7a` demanded a question
target while `edges` was typed `to: ClaimId`, so the model forbade the legal
case and permitted the illegal one.

A field fixes it with no union and no widened target type. `Claim` gains
`bears_on: QuestionId[]`, the `Relation` union returns to the ratified four,
and `ERF-6.7a` now says plainly that edges are claim-to-claim and a tie to a
question lives in `bears_on`. The reverse direction, which claims bear on a
question, is computed rather than stored, like the reciprocal of
`conflicts-with`.

The external reviewer caught the placement rather than the evidence, and
said so explicitly: admitting the relation was not shown to be a mistake,
adding a heterogeneous target to a claim-only interface was.

### 2026-08-23

`ERF-4.5` reserved `[...]` for an omission and said a bare `...` was a
literal source character. `ERF-6.12b`, written the same day, treated any
ellipsis as a wildcard. The two rules contradicted each other, and the
looser one could pass a quotation the source never contained: quoting
"Wait... what?" matched a capture reading "Wait, despite the warning,
what?", and the mechanical check whose only job is fidelity blessed it.

Only `[...]` elides now. Bare `...` and `…` are matched literally. The
quote is split on `[...]`, every non-empty span must occur in the capture
in order and without overlap, and a quote of nothing but elisions fails
rather than trivially passing.

The gap between spans stays unbounded, stated explicitly with its reason:
an elision marker is the author's assertion that they removed material,
and whether the removal misleads is a judgment for the audit rather than a
distance a validator can measure.

Both working implementations had the same defect and are corrected. The
pilot checker had a second one that the fix removes: it split on bare dots,
which left stray brackets in every span of a `[...]` quote and would have
failed all of them.

### 2026-08-23

`ERF-6.5` was not a total function. A claim whose current stances are all
`against` matched none of its four branches, so the format's central
computed state was undefined for a legal input and two validators could
legitimately disagree about it. Found by a cross-vendor adversarial review.

The rule now discards withdrawn stances before computing, because
withdrawal is exit rather than opposition, and reads what remains: nothing
is `retired`, all `for` is `active`, all `against` is `rejected`, a mix is
`contested`. No standings at all remains `proposal`. Every input has exactly
one reading, and there is still no tie-break.

`rejected` is a fifth disposition, and `ERF-6.5a` forbids conflating it with
`retired`: a rejected claim is one every current holder judges false, a
retired one is one every current holder has left. The vocabulary grew
because a function was partial, not because a state was wanted, and it grew
without a forcing instance because totality is a property of a rule rather
than a feature.

The earlier rule also read one `for` and one `withdrawn` as disagreement,
reporting a contest that was not happening. That is fixed by the same
discard.

### 2026-08-23

Six areas the reference consumer could not implement from the text alone.
Every one was found by building `erf-view` against the specification rather
than against the existing tooling, which is what a reference consumer is
for.

**Omitted lists are not missing fields** (`ERF-7.4a`). The data model types
list fields as required and the serialization omits them when empty, and
until now nothing said what a reader does with the gap. A reader
materializes an omitted list as an empty one, and an omitted list means
none rather than unknown. This covers `finding_audit`, so an atom nobody
has audited is a complete record with an empty audit list. The model
describes a record in memory; the serialization rules describe the file;
the two differ on purpose. The viewer reported 28 divergences from this
alone, and reports none now.

**Quote normalization is defined** (`ERF-6.12a`, `ERF-6.12b`), as a ten-step
ordered sequence applied identically to quote and capture, taken from the
working implementation rather than invented. Case is explicitly NOT folded,
because case is part of a verbatim quote and folding it lets a mis-cased
quote pass a check whose whole job is fidelity. Elision markers are
wildcards, spans must occur in order, and a quote that is nothing but
elisions fails rather than trivially passing.

**Binding syntax has a grammar** (`ERF-4.25`). Ids are whitespace-separated,
never comma-separated, and the anchor is required, because it is how
software finds the passage after edits. A binding whose id resolves to
nothing MUST be reported and MUST NOT be dropped silently (`ERF-4.26a`):
hiding a broken citation turns it into a confident sentence.

**The manifest has a schema** (`ERF-7.7`): `id`, `title`, `spec_version`,
and `classification` required, a `policy` block and an `owner` optional. A
consumer MUST refuse a corpus whose `spec_version` it does not support
(`ERF-7.7a`), because reading one under the wrong version fails silently.

**The capture mapping has a shape, and absence is explicit** (`ERF-4.4a`,
`ERF-4.4b`). Every atom has an entry, giving either a path or a recorded
absence with a reason from a closed set: `not-redistributable` and
`licence-unverified`. A missing entry is a defect rather than a signal,
because `ERF-6.8a` cannot otherwise tell "no capture exists" from "nobody
wrote it down".

**A narrative is a document, not a record** (`ERF-4.26b`). It has no
evidence, no standings, and no disposition, which is exactly why it stays
out of the data model: nothing about it is adjudicated, and a reader
disputes the claims it binds to rather than the prose.

### 2026-08-23

A fifth relation, `bears-on`, admitted on a forcing instance rather than on
symmetry. It records that a claim bears on a question, it MUST target a
question, and it asserts nothing about whether that question is answered
(`ERF-6.7a`). It is the only relation whose target is not a claim.

It exists because widening validation from documents to whole corpora
surfaced 18 edges still using `answers`, a relation retired months earlier,
every one of them pointing at a question that remains open. Folding them
into each question's `answered_by` would have asserted ten answers nobody
gave, so the relation was readmitted instead, under a name that claims only
what the records support.

The lesson is recorded in the design history as the fourth reversal: a
retirement is only as good as the coverage of the check that confirmed the
disuse.

### 2026-08-23

`ERF-6.5` no longer breaks ties. It said the corpus owner's newest stance
governed when stances differed, which contradicted the format's own
position that quorum and merge resolution are out of scope because what a
disagreement means is a judgment rather than a computation. Disposition now
follows the current stances alone: none is a proposal, disagreement is
contested, agreement gives active or retired. `contested` is terminal, and
which disposition permits a use remains corpus policy. `owner` accordingly
means only the person who sets that policy, and `ERF-6.6` now tests
argument leaves on the computed disposition.

`ERF-6.8a` is new: a consumer must not present a claim as backed to a
reader who cannot resolve that backing. The classification wall constrains
what a record rests on inside a corpus and says nothing about what a reader
sees when a reference crosses a boundary, which is where a backed claim and
a bare assertion become indistinguishable. Resolvability is reader-relative
and computed at read time. A reader-safe summary of hidden evidence was
considered and rejected: it is a second version of the truth to maintain,
and an unfalsifiable claim of backing offered where it can least be checked.

### 2026-08-23 — nomenclature and self-description

Field names now carry the noun that tells a reader the type, the pattern
`fetched_url` and `source_quality` already followed.

| Was | Is |
|:--|:--|
| `modified` | `last_modified` |
| `as_of` | `as_of_date` |
| `handle` | `short_name` |
| `backing_audit` | `evidence_audit` |
| `prior` | `prior_survey` |
| `hits` | `hits_reported` |

`backing_audit` named nothing on the record, since a claim has no
`backing` field. `evidence_audit` names what the audit is about and
survives surveys becoming backing, which `atoms_audit` would not have.

**Atoms self-describe.** Every atom carries its own `type` and `corpus`,
as claims, questions, and surveys already did. `ERF-7.2` now says records
self-describe rather than files, and `ERF-7.3` is rewritten: a collection
document may group records of one type, but carries no meaning of its
own, and a record extracted from one is complete without it. The earlier
inheritance rule was fitted to one file layout, and an atom's corpus had
become its confidentiality boundary, which is not something to leave
implicit in a container.

**Realm.** The word `registry` was doing three jobs: the corpus registry,
the file holding many atoms, and the operator-or-organization scope
introduced a day earlier for cross-party identity. The third is renamed
**realm** and defined in section 2: the set of corpora one operator or
organization governs, and the scope within which ids are unique. The
second is retired as a term of art in favor of *collection document*.
An atom id's leading token is a corpus prefix, not a registry prefix.
`ERF-4.11`, `ERF-4.11b`, `ERF-6.1`, and `ERF-6.2` are reworded; the
corpus registry keeps its name and gains a definition that says it
registers corpora, not sources.

### 2026-08-22

First published version. The format was extracted from a working practice
rather than designed up front: roughly 740 audited atoms and 300 claims
and questions across seven corpora preceded the specification, and a pilot
ran the records on a third-party substrate before it was written. Every
field and vocabulary value in it was admitted on a forcing instance and
several were retired again on measurement.

What was tried, what was retired, and the measurements that decided each
are in `DESIGN-HISTORY.md`. Changes from this version on are recorded
here, one entry per dated change, naming the requirement ids it touched.
