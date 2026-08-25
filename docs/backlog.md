---
title: "Backlog"
purpose: "The governed queue: everything the format might do, might fix, or has been told is wrong, each with its evidence, its provenance, and whether anyone has checked that the description is true."
status: non-normative
last_updated: 2026-08-25
---

# Backlog

Everything this format knows it does not do, plus everything a reader has
told it is wrong. One queue, because both need the same governance before
they reach the operator: an accurate description, a stated basis, and
someone other than the raiser confirming both.

Nothing here is a promise and nothing is scheduled.

## How an entry works

Every entry carries six things. The last two are the point.

- **id** — `B-nn`, stable and never reused, so a decision elsewhere can
  cite it. An entry that leaves keeps its id in the changelog.
- **kind** — `capability` (the format does not do this yet) or `defect`
  (the specification is wrong, unclear, or incomplete). They exit
  differently: a capability waits on a trigger, a defect waits on a
  ruling.
- **description** — what it is, in enough detail that a reader can check
  the claim without asking its author.
- **basis** — how the entry knows what it says:
  - `demonstrated` — an artifact exists: a failing check, two
    implementations disagreeing, a file that would not load. Nameable and
    re-runnable.
  - `reported` — a reader judged it and named the reading, with no failure
    shown. Worth what a careful reader's opinion is worth.
  - `anticipated` — nobody has hit this. It is foresight, and the weakest
    basis there is.
- **raised** — where it came from, specifically enough to go back to.
- **verified** — whether anyone has checked the description against the
  current specification, and who. **An unverified entry is not ready for
  the operator.** Verification is a separate act from raising, by someone
  other than the raiser, and it can find that an entry is stale, wrong, or
  already closed by a later change.

## The rule the queue exists to enforce

A field earns its place by a demonstrated need rather than by symmetry or
by anticipation. That rule is why `anticipated` is recorded as a weak
basis rather than treated as equal to the others: an item that has sat
unverified and unhit for a year is evidence about its author's
imagination, not about the format.

Items leave when their trigger fires or their ruling lands, going either
into the specification or into `non-goals.md` if the answer turns out to
be no.

Decisions already taken against something are not here.

## Capabilities

### B-01 · Cross-deployment identity

`capability` · basis: `anticipated` · raised: retired from v0.9 as `ERF-16` on 2026-08-24 with the realm concept · **verified: no**

**Trigger.** Two parties sharing records whose ids may collide.

Record ids are unique within a deployment. Between two deployments a bare id promises nothing, and the format says so and stops. What it does not supply is a way to name the pair.

### B-02 · A classification wall: machine-checked citation direction

`capability` · basis: `anticipated` · raised: retired from v0.9 as `ERF-45` on 2026-08-24 as a policy · **verified: no**

**Trigger.** A second deployment that needs the check and cannot carry it as its own policy, or a leak that a policy-side wall failed to stop.

A rule that a record may not cite one whose classification is narrower. Removed because it is a rule about who may see what, which is policy, and v0.9 specifies none.

### B-03 · A corpus registry as a specified artifact

`capability` · basis: `anticipated` · raised: retired from v0.9 as `ERF-64` on 2026-08-24 · **verified: no**

**Trigger.** A tool that must discover corpora it was not pointed at.

The realm-level list of corpora with their homes and classifications. Now deployment practice the format does not specify.

### B-04 · Non-text evidence payloads (measurement, table, image)

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** The first non-text atom in real work.

An atom's quote is text. A figure from a table, a chart, an image region have no representation.

### B-05 · Per-attachment evidence roles

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** The first atom that must sit in both evidence lists at once.

### B-06 · Atom lifecycle (`withdrawn`, `superseded_by`)

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** The first bad atom found after citation. Also where an undercutting defeater would be expressed.

A claim can be withdrawn through its standings ledger. An atom has no exit at all, which is the sharpest asymmetry below the claim layer.

### B-07 · A capture manifest with content-hash identity

`capability` · basis: `anticipated` · raised: design period; sharpened 2026-08-24 when captures gained `fetched.digest` · **verified: no**

**Trigger.** A captures reorganization, a same-URL revision collision, or any corpus sharing.

Partly overtaken: `ERF-71` now pins the fetched artifact by digest. What remains unaddressed is the capture file itself, and whether a corpus can prove which capture it holds.

### B-08 · Content-addressed record ids

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** A second writer minting into a shared corpus, where check-before-write cannot prevent a collision.

### B-09 · Canonical serialization of a record, before any hashing

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** A content-addressed id, a capture manifest, or signatures.

The real blocker rather than the choice of hash: two byte-different files can hold the same record, and neither multihash, Subresource Integrity, nor a Trusty URI says how to canonicalize YAML-plus-markdown first.

### B-10 · A families registry (definitions, rename history)

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** The first family split or rename that matters to an existing document.

### B-11 · An actor registry

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** A second human in a corpus.

### B-12 · Import provenance on copied records, and a declared deciding actor

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** A second human in a corpus.

### B-13 · Declared perishability (`stale_after`)

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** A report that needs it.

### B-14 · Structured bet settlement

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** Calibration across many settled bets.

### B-15 · Inference grouping (joint premises)

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** A lint or a cold reader miscounting a joint premise set.

### B-16 · A counter-survey mirror

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** The first survey that must stand against a claim rather than back one.

### B-17 · A typed cause on withdrawals

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** Something that must filter withdrawals by reason.

Its vocabulary would then be derived from accumulated reasons rather than invented.

### B-18 · A relation for near-identical claims

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** Two parties holding the same proposition at a shared boundary.

### B-19 · Media-type extraction profiles for capture text

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** The first capture that is not text or markdown.

**Suspected stale.** `ERF-51` was rewritten on 2026-08-24 to state that captures are authored rather than converted at check time, with the conversion happening once under `ERF-70`. Verification should decide whether this entry still has a subject.

### B-20 · A machine-readable audit policy schema

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** A second corpus with a genuinely different audit bar.

### B-21 · A full normalization grammar in prose

`capability` · basis: `anticipated` · raised: design period · **verified: no**

**Trigger.** A second implementation that matches every conformance case yet disagrees with the reference on an uncased input.

**Trigger may have fired.** B-30 records exactly such a disagreement. Verification should decide whether this entry and B-30 are one item.

### B-22 · The question record type's return

`capability` · basis: `anticipated` · raised: cut from the format 2026-08-23 as ERF v1.1.0 · **verified: no**

**Trigger.** Questions that need a lifecycle, meaning someone actually marking one answered rather than just minting the claim that settles it.

## Defects

### B-23 · The corpus has no stated shape on disk

`defect` · basis: `demonstrated` · raised: trials 1, 2 and 4 independently, 2026-08-25 (S1, S14, S15) · **verified: no**

Neither the corpus declaration nor the source list has a stated filename, the frontmatter file grammar appears only in an example, and nothing requires a consumer to report files it scanned and did not recognize. Trial 4 wrote `declaration.yaml` where the reference expects `corpus.yaml`; trial 2 wrote `narrative/` where it expects `narratives/` and wrote claims with no closing delimiter. In each case a conforming corpus was unreadable, twice silently.

**Proposed resolution.** Name the interchange layout in section 7, on the framing `ERF-3` already uses: this is what a corpus looks like when it travels as a directory, and a store is unaffected. Add a consumer SHOULD to report the unrecognized.

### B-24 · `as_of_date` has neither a stated format nor stated semantics

`defect` · basis: `demonstrated` · raised: trial 1 (A-series) and capex batches 1, 3 and 5, 2026-08-25 (S2) · **verified: no**

Format: trial 1's validator requires a full date; the example corpus carries year-only; two capex batches wrote year-month, five instances. Semantics: two batch authors used different conventions for period-actual figures, period-end date against document date, both defensible under "the date the FACT is true of", and batch 3 found the divergence by reading its predecessors.

**Proposed resolution.** Admit reduced precision explicitly, and add one sentence naming the convention for period figures and for forward guidance.

### B-25 · `ERF-51` step f is under-specified, and it changes verdicts

`defect` · basis: `demonstrated` · raised: predicted by trial 1 (A8), proved by capex atom `acx-110`, 2026-08-25 (S7) · **verified: no**

"A space before punctuation": the reference reads it as one literal space, a batch author's from-prose implementation read it as whitespace generally. A quote whose capture line-wraps before a bare source ellipsis normalizes differently on each side, and the two implementations return opposite verdicts on a faithful atom. `acx-110` is kept failing in the capex corpus as the exhibit.

**Proposed resolution.** State that step f covers any whitespace run before the punctuation mark; add a conformance case pinning the line-wrapped pair; move the reference and the case file together.

### B-26 · Three normalization edge cases from real captures

`defect` · basis: `demonstrated` · raised: trial 2 and capex batch 5, 2026-08-25 (S12) · **verified: no**

A hyphen-space-newline that step 7's literal wording does not cover; a spurious OCR line-leading hyphen that steps 10 and 11 fuse into an unrelated word; a hyphenated compound or em dash sitting exactly at a capture's line-wrap, which step 7's join silently mangles against a hand-typed quote. Every one was found by running an implementation against real captures.

**Proposed resolution.** Add as conformance cases; decide per case whether the prose or the case is wrong.

### B-27 · The normative conformance cases are unobtainable by a reader of the specification alone

`defect` · basis: `reported` · raised: trial 1 friction 31, 2026-08-25 (S6) · **verified: no**

`ERF-51` declares the conformance case files normative where prose and case disagree, but they live in the repository, not the document. Every trial that implemented normalization had to do so blind and then reimplement the sequence to self-check.

**Proposed resolution.** Say where the normative cases live, and decide what ships with a published specification.

### B-28 · `ERF-35`'s scope is ambiguous

`defect` · basis: `reported` · raised: trial 1 ambiguity A2, 2026-08-25 (S3) · **verified: no**

"Every reference MUST resolve" against an enumerated four fields. Whether `prior_survey`, `notable_results[].atoms` and `evidence_at_stance` ids may dangle is unstated, and two validators may legally differ.

**Proposed resolution.** One sentence naming the closed list, or making it open.

### B-29 · `ERF-32` requires what the `ERF-31` grammar makes optional

`defect` · basis: `reported` · raised: trial 1 ambiguity A1, 2026-08-25 (S4) · **verified: no**

`bound-at` is a MUST in `ERF-32`, is optional in `ERF-31`'s stated grammar, and `ERF-32` then defines the handling of its own violation state (staleness `indeterminate`).

**Proposed resolution.** Reconcile, or say plainly that the grammar admits what `ERF-32` then reports.

### B-30 · `ERF-43` and `ERF-49` collide at the flag boundary

`defect` · basis: `reported` · raised: trial 1 ambiguity A3 and trial 4 undecidable 4, 2026-08-25 (S5) · **verified: no**

A premise-less argument is a flag under `ERF-49` and a violation under `ERF-43` when reached as a closure leaf. Whether a closure includes its own root is unstated and decides which fires. Separately, whether a flag-only corpus is still in the loads-clean class has no answer.

**Proposed resolution.** State whether the closure includes its root, and state what a flag means for conformance.

### B-31 · Append-only rules cannot be checked from a single corpus snapshot

`defect` · basis: `reported` · raised: trial 4 undecidable 5, 2026-08-25 (S8) · **verified: no**

`ERF-40` and `ERF-48`'s append-only exemption constrain a transition between two states, not any one state. No fixture in this format can exercise them.

**Proposed resolution.** A note in section 6 that these bind the substrate's history, which `ERF-63` already implies. **Hold:** the SQL trial is testing exactly this distinction and should inform the wording.

### B-32 · `ERF-34` legislates authorship where the format elsewhere records attribution

`defect` · basis: `reported` · raised: trials 2 and 3's closing author, three independent flags, 2026-08-25 (S10) · **verified: no**

The guidance says a narrative is "authored by a person and never generated." Three agents flagged the tension and wrote one anyway, disclosing the authorship. The format's posture everywhere else is to record who did what rather than to restrict who may.

**Proposed resolution.** Operator ruling. The recommendation on file is to soften to attribution rather than restriction.

### B-33 · One `converter` per source cannot describe a mixed-extraction artifact

`defect` · basis: `reported` · raised: trial 2, 2026-08-25 (S11) · **verified: no**

Jefferson's Notes PDF has clean embedded text for most pages and a fold-out table with no OCR layer at all. The author disclosed the split in prose and marked the whole source non-deterministic, which works and is not an answer the specification gives.

### B-34 · The narrative anchor does not say raw or reflowed

`defect` · basis: `reported` · raised: trial 2, 2026-08-25 (S13) · **verified: no**

`ERF-31`'s anchor is a "verbatim substring" of the passage, against raw bytes or reflowed text unstated. A hand-wrapped paragraph broke an anchor across a line-wrap.

**Proposed resolution.** One sentence.

### B-35 · The binding grammar has no escape for a quote character in an anchor

`defect` · basis: `demonstrated` · raised: trial 3's closing author, 2026-08-25 (S20) · **verified: no**

Two anchors broke silently when the passage's own prose used scare-quotes: the file still parses, the binding simply stops matching, and only a validation script noticed.

**Proposed resolution.** Either the grammar gains an escape, or the guidance forbids the character and a validator SHOULD flag an anchor that no longer occurs in its passage.

### B-36 · The narrative's frontmatter fields are named but untyped

`defect` · basis: `demonstrated` · raised: trial 3's closing author against trial 1's validator, 2026-08-25 (S21) · **verified: no**

`ERF-34` requires title, corpus and created, and having ruled that a narrative has no interface in the data model, types none of them. The closing author wrote `created` as a bare date; trial 1's validator expects an actor stamp. Both defensible, and they disagree.

**Proposed resolution.** Type the three fields in one sentence.

### B-37 · The actor grammar cannot distinguish two authors of the same model

`defect` · basis: `demonstrated` · raised: capex corpus, 151 records across five authors, 2026-08-25 (S16) · **verified: no**

`<producer>/<version>` resolves to the same string for every agent of one model, so all 151 capex atoms carry an identical `created.by`. A five-author corpus is unattributable per author from its own records, which is the multi-writer provenance the format exists to keep.

**Proposed resolution.** Either the Actor grammar admits an instance discriminator, or the guidance says a deployment running same-model writers SHOULD distinguish them.

### B-38 · `decomposes-into` blocks a second author from structuring an existing corpus

`defect` · basis: `reported` · raised: capex claims batch B, 2026-08-25 (S18) · **verified: no**

The edge is stored on the parent, so an author barred from editing existing claims cannot decompose them. Every other relation can be added from the new side. The batch used `supports` instead and lost the part-whole meaning.

**Proposed resolution.** Either bless the workaround in guidance, or let a child declare its parent, compiled to the same edge.

### B-39 · The example corpus's narrative carries an undefined field

`defect` · basis: `demonstrated` · raised: trial 1's validator against the example corpus, 2026-08-25 (S9) · **verified: no**

The narrative frontmatter carries `type: narrative`, which the data model does not define; `ERF-34` names title, corpus and created.

**Proposed resolution.** Drop the field from the example, or admit it. Related to B-37.

