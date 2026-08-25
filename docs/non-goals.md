---
title: "Non-goals and declined ideas"
purpose: "What this format deliberately does not do, each with the date it was ruled and the reason."
status: non-normative
last_updated: 2026-08-25
---

# Non-goals and declined ideas

Readers propose what a format's authors already considered. This register
exists so that a proposal can be checked against a ruling instead of
re-argued, and so the reason stays attached to the decision.

Every entry is a **permanent no** under the current design, distinct from
`backlog.md`, which is a **conditional yes**: things the format does not do
yet, each waiting on a named event. An idea moves from here to there only
if the ground it was declined on has changed, which is itself worth a dated
entry.

Rows carry the date the ruling was taken. Versions are deliberately absent:
before first publication they record iteration rather than release, and
dates are what a reader can use. A decision that closes a proposal is
recorded here in the same commit that implements it. A register nobody
updates is worse than none, because it reads as complete.

A format's readers keep proposing what its authors already considered. This
register exists so a proposal can be checked against a ruling instead of
re-argued, and so the reasons stay attached to the decisions. Things retired
*after* being used also appear in the subtraction ledger above, with the
measurement that decided them; this table is the scannable index.

Rows carry the date the ruling was taken. Versions are deliberately
absent: before first publication they record iteration rather than
release, and dates are what a reader can actually use. A decision
that closes a proposal is recorded here in the same commit that implements
it, on the same discipline the changelog already follows. A register nobody
updates is worse than none, because it reads as complete.

## Declined

| Decision | Ruled | Why |
|:--|:--|:--|
| Redistribution rules for captures | 2026-08-24 | Operator ruling: what data travels is outside the spec; the format records the licence judgment (`ERF-5`, `ERF-68`) and rules on nothing. The security section's blanket MUST NOT was rewritten as licence-conditional description. |
| Title/body agreement as a numbered requirement (`ERF-46`) | 2026-08-24 | Three of the six real corpus claims open in other words than their titles, and whether an opening in other words states the same claim is a reading. Extends the 2026-08-23 ruling that authoring judgment is not numbered; folded into `ERF-18`'s guidance. Id retired. |
| A survey record forbidden to change at all | 2026-08-24 | The immutability that matters is the conducted acts and their yields; a corpus transfer, a body note, or an atom link landing in `notable_results` are record-keeping, now stamped by `last_modified` like every other record. From the 2026-08-24 external review. |
| A narrative required to be two documents | 2026-08-23 | A claims-tree is a doc-class artifact of one practice, not something the format needs. A narrative carrying bindings already points at its claims, and requiring a companion document is the format reaching into use. `ERF-30` retired. |
| A caveat field on records that have a body | 2026-08-23 | A record with a body carries its caveats there. `limitations` stays on the atom alone, which has no body and for which it is the only prose; the survey's copy was the same content in two places, and a claim never needed one. |
| Policies of any kind in the format | 2026-08-23 | v1 specifies records and the bindings between them; what anyone does with a corpus is the consumer's. Supersedes the earlier ruling that made the ship gate an invariant, and takes the audit policy, its aliases (audit intensity, verification bars), and the manifest's policy block with it. |
| Presentation rules for readers without the sources (`ERF-6.8a`) | 2026-08-23 | How a claim is shown to someone who cannot open its backing is presentation, and presentation is the consumer's. The reference viewer still shows the gap, as its own choice. |
| Degrees of belief on claims (probabilities, confidence scores) | design period | Invites false precision and averaging over judgments that were never commensurable. |
| Strength grades on held positions | design period | Settledness is readable from tenure, disputes survived, and evidence accumulated. |
| A decision record type | design period | An active bet plus its activating standing is the solo decision system. Reviewer dissent preserved. |
| Mechanical check results stored on records | design period | Recomputable by anyone holding the corpus and its captures, therefore derived. |
| Splitting state into three fields; multi-valued kinds | design period | Complexity with no forcing instance. From the adversarial review. |
| Topic tags on atoms | design period | Measured rot: 201 distinct tags across 146 atoms. |
| A lettered source-reliability scale; a two-field split of source quality | 2026-08-22 | 87% of two-axis ratings collapse to the diagonal; letter grades measure as fuzzy as words. |
| Typed reasons on negative standings (`cause`) | 2026-08-22 | Five withdrawals existed, none carried one, and four of the five real reasons were absent from the proposed list. |
| schema.org `Claim` export as a requirement | 2026-08-22 | Consumption-side mapping, no bearing on the record format. |
| A default query lens as a requirement | 2026-08-22 | Consumer mechanics. Kept as advice in a note (`ERF-6.14` retired). |
| Requiring a register of the author's own positions | 2026-08-22 | The format permits one; the reference practice deliberately keeps its author's positions outside it. |
| Migrating an existing personal knowledge base into the format | 2026-08-22 | 109 entities, all documents rather than statements, revised about quarterly, and no claim ever leaned on one. |
| Ownership as a corpus concern | 2026-08-22 | With one operator it distinguishes nothing; contractual ownership is an engagement fact, not a record field. |
| Quorum, voting, and merge resolution | 2026-08-22 | What a disagreement means is a judgment its owner makes, not a computation. Permanent. |
| Reader-safe summaries of hidden evidence | 2026-08-22 | A second version of the truth to maintain, and an unfalsifiable claim of backing offered where it can least be checked. |
| A tie-break for disposition | 2026-08-22 | No stance outranks another. `contested` is terminal. |
| `bears-on` as a fifth relation | 2026-08-23 | `edges` are claim-to-claim; every other record type a claim reaches has its own field. Became the `bears_on` field, then left with questions. |
| The question record type | 2026-08-23 | 25 records across five corpora, every one `status: open`, `answered_by` never written once in a year. Cut to keep v1 shippable rather than to deny questions matter. |
| `accepted` on an audit entry | 2026-08-23 | Zero uses across 1,642 audit entries, with 87 PARTIAL verdicts unaccepted. Per-entry acceptance asks for review at a granularity nobody works at; a disagreement with an auditor is a standing on the claim. |
| A failed audit recorded as a verdict (`PARSE_ERROR`) | 2026-08-23 | An audit that produced nothing is an audit that did not happen. Tool failure is not a judgment. |
| Optional capture unwrapping | 2026-08-23 | Measured: the same corpus failed at 19% without it and 9% with it, so an optional step decided one verdict in ten. Made mandatory instead. |
| An enumerated list of substantive fields for `last_modified` | 2026-08-23 | A list that must move in lockstep with the schema, and lockstep failed three times in two days. |
| An external vocabulary for audit verdicts (ClaimReview, scite) | 2026-08-24 | ClaimReview has no closed vocabulary to adopt, only a schema for hosting whatever rating scale each publisher invents; scite classifies citation stance rather than entailment. Adopting either would remove the one asset `finding_audit` has, a closed comparable set. |
| DIDs for actor identity | 2026-08-24 | Solves cryptographic identity across trust boundaries, an entire mechanism this scale does not need. The `human:` / producer / `process:` convention costs three lines. |
| Registering a media type | 2026-08-24 | `text/markdown` (RFC 7763) already covers the body. A combined registration serves interoperability at a scale this format has not reached. |
| Bell-LaPadula for the classification wall | 2026-08-24 | Intellectual credit, not a design to adopt: the model brings operating-system security-kernel machinery for a rule already stated in one sentence. |
| Outsourcing markdown-to-text extraction to a library | 2026-08-24 | CommonMark specifies parsing to HTML and never text extraction, so there is no standard to adopt. The nearest candidate is a thirty-line third-party convention with no per-node contract that misses pandoc attribute blobs and costs 42 transitive packages against the current one. |
| Numbered requirements for authoring judgment | 2026-08-23 | Section 4 held 52 requirements and 18 of 85 were checked by anything, so most of the document's normative weight was advice wearing MUST. Promises about what a record means stay numbered; advice about writing a good one became prose. Section 4 fell to 34. |
| Section-shaped requirement ids | 2026-08-23 | The scheme rotted as it always does: sections moved, ids could not, and the correspondence broke in three places. Flattened to a flat sequence before publication, the last moment it was free. |
| Outsourcing text normalization to an existing standard | 2026-08-24 | Surveyed against UAX #15, UTS #10, UTS #39, Charmod-Norm, PRECIS, CommonMark, and the remark ecosystem. Only NFKC fits, and the format already uses it via the runtime built-in. Collation is disqualified because its one useful strength level also folds case, which this format forbids. CommonMark specifies parsing to HTML, not text extraction, so there is no standard for the markup half at all; the nearest candidate is a thirty-line third-party convention with no per-node contract that misses pandoc attribute blobs and costs 42 transitive packages against the current 1. Adopting it would trade an explicit sixteen-rule list this format owns for a longer one it does not, and call it a standard. |

## Deferred

Deferred items and their triggers live in `BACKLOG.md`. They are a queue
rather than a record: an item leaves that file when its trigger fires, which
is the opposite lifecycle to everything else in this document.
