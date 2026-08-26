---
title: "How the format got this way"
purpose: "The work history: what was tried, what was measured, what was reversed, and where the requirement ids went."
status: non-normative
last_updated: 2026-08-25
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
`influences.md`.

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
