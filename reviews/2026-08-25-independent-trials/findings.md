---
title: "Findings from the independent trials"
status: complete; consolidated in README.md
generated: 2026-08-25
model: claude-opus-5[1m]
---

# Findings so far (trials 1, 3b, 4 landed)


> **Where these findings live now.** Every finding that needed action was
> migrated into `docs/backlog.md` on 2026-08-25 as a governed entry with an
> id, a basis, and a verification state. This document stays as the trials'
> own record of what they observed; the queue is where anything gets
> decided. Findings marked here as "for the report" did not migrate,
> because they are observations rather than work.
>
> The migration also exposed a defect in this document: only six of its
> twenty-four entries carried an explicit attribution, and the rest had to
> have their provenance recovered from prose. A findings register for a
> provenance format should not need that. The backlog entries carry it as
> a field.

## Reference-implementation bugs, fixed and committed

- **R1. `ERF-19` checked flow-style YAML only.** The bare-date standing
  check read raw frontmatter with a regex matching `{timestamp: ...}`
  entries; a block-style standing with a bare date passed unexamined. Our
  own fixture is flow-style, so the suite never noticed: a same-hand
  fixture hiding a same-hand bug. Rewritten onto parsed entries, which
  ERF-65's JSON schema makes sufficient. (Trial 4, fixture i01.)
- **R2. Held conflated with shippable.** The viewer gated quote checks
  and backing resolvability on shipping status, so a locally held capture
  for a `not-redistributable` source was never checked, against `ERF-50`
  ("re-runnable by anyone holding the corpus and its captures", silent on
  shipping). A working corpus legitimately holds captures it may never
  redistribute. Fixed: held (a `path`) decides checkability; status
  decides travel. (Trial 4, fixtures i09/i10, which only surfaced after
  this fix let their checks run.)

## Spec errata candidates (operator to rule; not yet applied)

- **S1. The declaration and source list have no anchored filenames.**
  `ERF-59` requires "a declaration, a YAML document" and `ERF-3` a source
  list, but neither names a file, and nothing fixes the corpus directory
  layout. Trial 4 independently wrote `declaration.yaml` where the
  reference expects `corpus.yaml`; trial 1 independently listed the same
  gap as its top ambiguity (its A4), noting a validator cannot even
  decide what the corpus IS. Two conforming implementations cannot read
  each other's corpora today. Candidate fix: name the interchange
  filenames in section 7.
- **S2. `as_of_date` has neither a stated format nor stated semantics.**
  Format: trial 1 requires a full date; the example corpus carries
  year-only ("2018"); capex batches 1 and 2 independently wrote
  year-month, five instances. Candidate fix: admit reduced precision.
  Semantics, found by batch 3 reading its predecessors: the two batch
  authors used different conventions for period-actual figures,
  period-end date versus document date, and both are defensible under
  "the date the FACT is true of". A second sentence naming the
  convention for period figures and for forward guidance (batch 1 used
  the issue date for forecasts) would close it.
- **S3. `ERF-35`'s scope is ambiguous** (trial 1 A2): "every reference
  MUST resolve" against an enumerated four fields; `prior_survey`,
  `notable_results[].atoms`, and `evidence_at_stance` ids may or may not
  be allowed to dangle.
- **S4. `ERF-32` vs the `ERF-31` grammar** (trial 1 A1): `bound-at` is a
  MUST in ERF-32 while the grammar marks it optional, and ERF-32 defines
  handling for its own violation state (indeterminate staleness).
  Candidate fix: state plainly that the grammar admits what ERF-32 then
  reports, or reconcile.
- **S5. `ERF-43` vs `ERF-49` at the flag boundary** (trial 1 A3, trial 4
  undecidable 4): whether a premise closure includes its own root decides
  which rule fires, and whether "flag" outcomes keep a corpus in the
  "loads with zero findings" class needs one sentence.
- **S6. `ERF-51` names normative case files a standalone SPEC.md reader
  cannot obtain** (trial 1 F31): the conformance cases govern where prose
  and case disagree, but they live in the repository, not the document.
  Publication packaging question.
- **S7. `ERF-51` step f under-specified — now demonstrated live** (trials
  1 A8, predicted; trial 2 friction 2, adjacent; capex atom acx-110, the
  proof). "A space before punctuation": the reference reads it as one
  literal space; batch 4's from-prose implementation read it as
  whitespace generally. A quote reading `compute" ... used` against a
  capture that line-wraps to `compute"\n... used` normalizes to
  `compute...` on one side and `compute ...` on the other, opposite
  verdicts on a faithful atom. acx-110 is kept failing in the corpus as
  the living demonstration until the ruling. Candidate fix: step f
  covers any whitespace run before the punctuation mark, with a
  conformance case pinning the line-wrapped-ellipsis pair; the reference
  and the case file change together.
- **S8. Structural: `ERF-40` and `ERF-48`'s append-only exception are
  untestable from any single corpus snapshot** (trial 4 undecidable 5):
  both constrain transitions between states. Candidate: note in section 6
  that these bind the substrate history (`ERF-63` already implies it).
- **S9. Example-corpus nit: the narrative carries `type: narrative`,
  which the data model does not define; ERF-34 names title, corpus,
  created. Either drop the field from the example or admit it.**

- **S10. `ERF-34`'s guidance says a narrative is "authored by a person
  and never generated"; the practice the format itself describes has LLMs
  draft while people judge, and trial 2's narrative was LLM-drafted with
  the attribution disclosed.** Candidate fix: the binding fact is
  attribution, not authorship; soften the guidance to say who wrote it is
  recorded, not legislated. (Trial 2, its sharpest tension.)
- **S11. One `converter` per source cannot describe a mixed-extraction
  artifact**: Jefferson's Notes PDF has clean embedded text plus a
  fold-out table with no OCR layer at all. Trial 2 disclosed the split in
  prose and marked the whole source non-deterministic, which works but is
  not an answer the spec gives.
- **S12. Three normalization edge cases from real captures**: a
  hyphen-space-newline that step 7's literal wording does not cover; a
  spurious OCR line-leading hyphen that steps 10/11 fuse into an
  unrelated word (both trial 2); and a hyphenated compound or em dash
  sitting exactly at a capture's line-wrap, which step 7's join silently
  mangles against a hand-typed verbatim quote (capex batch 5, two
  near-misses caught by the author's checker). Candidate conformance
  cases; every one found only by running an implementation against real
  captures.
- **S13. `ERF-31`'s anchor is a "verbatim substring" of the passage, but
  against raw bytes or reflowed text is unstated**: a hand-wrapped
  paragraph broke an anchor across a line-wrap.
- **S14. The interchange file grammar is shown, never stated.** `ERF-53`
  says "YAML frontmatter plus markdown body"; the closing delimiter
  appears only in an example. Trial 2 wrote claims as one YAML document
  with `body:` as a field and no closing delimiter, and BOTH validators
  failed to read them (the reference with a finding, trial 1 silently).
  Candidate fix: state the file grammar in section 7.
- **S15. Unrecognized files are droppable without a trace.** The
  reference silently ignored trial 2's `narrative/` directory (it
  hardcodes `narratives/`; S1's third independent manifestation); trial 1
  silently skipped the delimiter-less claims. Candidate: a validator
  SHOULD report files and directories it scanned but did not recognize,
  extending `ERF-57`'s conduct to the corpus scan.

## Trial 2 (Buffon) cross-validation result

Corpus built cold: 4 sources (2 scanned archive.org PDFs with converter
and digest, 1 federal letter, 1 recorded absence), 9 atoms, 5 claims
with edges, 1 survey with real search acts, 1 bound narrative. After two
mechanical shims (closing delimiters; directory rename), the corpus is
fully green under BOTH validators, and all 9 quote checks PASS under the
reference normalization despite the captures having been converted and
excerpted by an independently implemented pipeline. The author caught a
near-reversed finding (a Buffon polecat passage that reads as support
until its antecedent is traced, filed as atoms_against) purely by
following the spec's checking discipline, which is the format doing its
job in other hands.

- **S16. The actor convention cannot distinguish two authors of the same
  model.** All 151 capex atoms carry an identical `created.by`
  (`<producer>/<version>` resolves to the same string for every batch
  agent), so a five-author corpus is unattributable per batch from its
  own records: the multi-writer provenance the format exists to keep is
  invisible exactly where the scale test created it. Related backlog
  item: the actor registry behind the second-human trigger. Candidate:
  the Actor grammar admits an instance discriminator
  (`<producer>/<version>/<instance>`), or the guidance says a deployment
  running same-model writers SHOULD distinguish them.
- **S17. Observed at scale, for the report rather than a rule**: five
  authors independently reimplemented the normalization sequence as a
  pre-ship gate and every one caught real defects with it (five invented-
  punctuation errors, one near-reversed finding, two step-7 near-misses);
  93% of atoms carry `as_of_date` including timeless findings where
  `ERF-14` says to omit it, a drift batch 5 broke with; and grading
  practice on officer quotes in accountable filings diverged across
  authors (`high` in four batches, `medium` once) until batch 5 resolved
  toward the spec's literal table. The audit machinery and the extension
  namespace went entirely unexercised without prompting.

- **S18. `decomposes-into` lives on the parent, so a second author cannot
  decompose an existing claim without editing it.** Claims batch B, barred
  from touching batch A's 27 claims, could not formally decompose the wide
  core claims and routed narrower claims via `supports` instead, flagging
  the loss. Every other relation can be added from the new side; this one
  cannot. Candidate: either the guidance blesses the supports workaround,
  or a child may declare its parent (`part-of` as an authoring direction
  compiled to the same edge).
- **S19. Jury behavior in the wild, for the report**: 31 atoms audited by
  two non-Claude vendors, 62 verdicts, 58 SUPPORTED and 2 PARTIAL, and
  both PARTIALs are single-vendor dissents on atoms the other vendor
  passed, the correlated-judgment caveat of the 4.4 note demonstrated in
  record form. ERF-12 discipline held: timeouts and unparseable outputs
  wrote nothing.

- **S20. The binding grammar has no escape for `"` inside an anchor.**
  Two anchors in the closing narratives broke silently when the passage's
  own prose used scare-quotes: the file still parses, the binding simply
  stops matching, and only a validation script noticed. Candidate: either
  the grammar gains an escape, or the guidance says anchors MUST avoid
  the quote character and a validator SHOULD flag an anchor that no
  longer occurs in its passage.
- **S21. The narrative's frontmatter fields are named but untyped.**
  `ERF-34` requires title, corpus, and created, and, having ruled the
  narrative has no interface in the data model, types none of them: the
  closing author wrote `created` as a bare date, trial 1's validator
  expects an ActorStamp, both defensible. The `ERF-34` person-authored
  tension also recurred (third independent flag). Candidate: one sentence
  typing the three fields, and the S10 fix.
- **S22. The survey machinery works, for the report**: six closed-corpus
  surveys ran real acts including a deterministic-script act and manual
  classification acts the shape absorbed cleanly; the deliberately
  re-scoped re-run, chained via prior_survey, surfaced a genuine
  un-atomized finding (AWS's stated $15B AI-revenue run rate sitting in a
  capture), which is the recurring-survey behavior the parked
  standing-watch concept predicted. The purity boundary correctly forced
  the gap to be recorded in notable_results rather than silently closed.

## Conformance-case candidates (adopt after operator review)

- Trial 4's fixture set: 6 valid, 12 invalid, 4 spirit; cross-run against
  the reference agrees 22/22 after R1/R2. Adopting the set (or its
  non-duplicative subset) fixes the fixtures' same-hand weakness.
- Trial 1's three smoke corpora, same argument.
- Trial 2's S12 normalization artifacts as cases; the shimmed Buffon
  corpus as a second example corpus or fixture material.

## Cross-implementation result (trial 1)

A ~1,100-line Python validator built from SPEC.md alone, purity held.
Against the reference fixture suite: 19/21 exact agreement, 2 partial
with defensible readings (ERF-36+38 both reported where one was
expected; stored-mechanical-result read as unknown-field ERF-55 rather
than ERF-11, which the prose permits since no field name is specified).
Against the example corpus: agreement except S2 and S9 above. Coverage
self-report: 54 of 66 requirements implemented as machine checks, 10
judged not machine-checkable, largely matching the reference's
untestable-by-design list.

## Trial 3b (bear-side sources) delivered

24 sources, 23 excerpt captures, one contractually restricted absence
(Apollo/Slok, explicit anti-redistribution terms: the `access-restricted`
vs `not-redistributable` distinction earning its place in the wild).
Friction worth noting: no genuinely open-licence source found in 24
(IEA is per-figure CC BY only), so `shipped` went unused; several
canonical PDFs bot-blocked live and recovered via Wayback.
