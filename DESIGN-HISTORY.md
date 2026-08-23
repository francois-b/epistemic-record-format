---
title: "ERF: Design History and Prior Art"
subtitle: "Companion to the Epistemic Record Format specification (SPEC.md): where the format came from, what was tried and retired, and what the field already holds. Non-normative."
byline: "v1.0, August 22, 2026"
status: draft
version: 1.0
last_updated: 2026-08-22
generated: 2026-08-22
model: claude-fable-5
---

This document is the non-normative companion to the Epistemic Record Format
specification. The spec states what the format is; this states how it got
that way and what already existed. It is published alongside the spec for
one reason: a format's credibility rests on its author knowing the field
and on the visible record of its own decisions — the same standard the
format asks of any claim.

## Part I — Design history

### Origin

The format was not designed; it was extracted. Its rules come from a
working practice: a research methodology (atoms, claims, and compiled
argument documents) run since mid-2026 across seven corpora — research
programs, client engagements, and venture design — accumulating roughly
740 audited evidence atoms and 300 claims and questions before any
specification existed. A pilot ran the records on a third-party substrate
(an OKF-based knowledge product) before the spec was written, and the
friction found there shaped it. Every schema decision below was forced by
something in that corpus, and the ones that weren't were reversed.

### The subtraction ledger

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

### Reversals worth recording

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

### Adversarial review

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

### Principles that emerged

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

## Part II — Prior art

Surveyed 2026-08-22: five research passes across ~30 candidates in five
territories, with primary sources captured at fetch (24 captured
documents; the captures remain in the author's corpus, since captured
copies of third-party works do not travel with a published corpus — see
the spec's security considerations). Summary verdicts; the spec's Related
Formats section is the condensed form.

### Argumentation formats

**Carneades** (Gordon & Walton, AI-and-law) is the territory's closest
touch: pro and con arguments on one statement, resolved under graded
proof standards — the nearest formal precedent to evidence-for/against
with confidence tiers. Academic, verdict-computing where ERF records
judgment, no capture discipline, no ledger. **AIF** contributes the
canonical-store-plus-projections architecture (RDF-first). **Argdown** is
the one plain-text, git-friendly citizen (file-per-map granularity).
**SADFace** names its units "Argument Atoms" — a naming coincidence over
a thin structure (its example ships an empty `sources: []`). **Kialo** is
the only per-person stance precedent: live agreement ratings, overwritten
on update — a current value, not a ledger. **IBIS/Compendium** supplied
the ancestral question/idea/pro/con node split.

### Provenance and claim standards

**Nanopublications** is the closest structural ancestor anywhere: the
assertion/provenance/pubinfo three-graph split is the same architectural
move as ERF's statement/evidence/record-metadata separation, and its
Trusty URIs (content-hash identifiers) solve immutability more rigorously
than a captured copy in git — earmarked for ERF's future capture
manifest. RDF at institutional scale; no standing concept. **SEPIO**
(ClinGen's evidence ontology) is the closest claim model: evidence
explicitly for and against one assertion, with evidence lines as
arguments distinct from raw items — institution-tested, OWL-locked, no
doxastic layer. **PROV-O** formalizes the human/software-agent split ERF's
attribution generalizes, and names the atom-quote link (`wasQuotedFrom`)
as a bare, unchecked triple. **ClaimReview** (schema.org) is the
widest-deployed claim markup on the web — paraphrase-plus-rating for
fact-checks, no verbatim checking, no ledger. **CiTO** is the cautionary
tale: forty typed citation relations that died of manual-annotation
burden — the adoption risk ERF's four relations dodge only because the
machine proposes and the human rules.

### Research tools and discourse graphs

**Discourse Graphs** (Chan et al.) is the nearest overall shape found in
any territory: Question/Claim/Evidence node typing with supports/opposes
relations — node-for-node close to ERF's core. One flat claim kind, no
capture checking, no standings, no attribution, tool-native. **scite.ai**
is production proof at 280M articles that machine-classified stance
(supporting/contrasting) works commercially — direct validation of the
machines-propose half of the standings design, with no human ledger.
**ACH** (intelligence tradecraft) holds the one structure ERF lacks: the
comparative evidence-versus-N-hypotheses matrix, noted and not adopted.
**Evergreen notes** (Matuschak) contributes a craft discipline ERF's
schema doesn't capture: what makes a claim-shaped sentence good writing.

### Organizational knowledge and decision records

Three strong half-matches that do not talk to each other. **Wikidata**:
statement ranks with real query-engine semantics (deprecated statements
vanish from default queries) and P2241, the only shipped controlled
vocabulary of typed reasons for a standing change — but rank is a single
anonymous consensus value with no per-person history. **Guru**: the
closest shipped analog to a standing anywhere — dated, reasoned (a
Quality Log records why), expiring verification that gates the product's
own AI retrieval — at whole-card granularity with no claim typing. Its
continuous automated verification also narrowed one of this project's own
earlier findings, and the corpus records that correction (atom kwg-147).
**ADR/MADR**: the substrate sibling — one markdown record per decision in
git, numbered monotonically, superseded never deleted — with no
evidentiary or standing machinery at all.

### Archival science and diplomatics

**Diplomatics** (Mabillon, 1681, formalized from Valla's 1440 exposure of
the Donation of Constantine) is the oldest working precedent in this
whole survey for judging a record's trustworthiness from its form and
provenance rather than its content: Duranti's own gloss, "the study of
the content of the document is extraneous to diplomatics." **InterPARES**
(Duranti, UBC, 1998-) is the closest institutional match anywhere in
this scan: its Authenticity Task Force splits authenticity into
identity and integrity, and its benchmark/baseline requirements draw
exactly the presumption-versus-gate line ERF draws with `ERF-6.13` — eight
cumulative, partial-credit requirements building a working presumption
against three that must ALL be met before a certified copy may issue.
No other territory surveyed supplied a tested precedent for that split.
**MacNeil** (2001, after Duranti) names the split ERF performs but never
names: reliability (truth-value as a statement, judged by the maker's
proximity to the facts) against authenticity (truth-value as an
artifact, judged by unbroken custody) — the nearest match anywhere to
`source_quality` against the mechanical quote-check. The **archival
bond** (Cencetti 1937; revived by Duranti and MacNeil) — originary,
necessary, and determined by a record's function — reads on inspection
less like a field ERF is missing than a decades-old name for what ERF's
own atom-to-claim edges already do. The **records continuum** (Upward,
McKemmish, Monash, 1996) rejects the life-cycle model's split between
current records and archives for the same reason ERF never separates
minting from use. Appraisal theory (Schellenberg's evidential/
informational split; Cook's macroappraisal) asks a question no other
territory asks — which activities are significant enough to record and
audit at all — and stops there. None of this supplies a standings
ledger: the presumption of authenticity is an institutional, largely
static status attached to a recordkeeping system, never a per-person,
dated, reasoned stance on one proposition, and diplomatics has no unit
smaller than the whole document to check a quote against. Human-role
attribution here is dense (author, writer, originator, addressee) but,
like everywhere else surveyed, never runs the human-versus-machine axis.
### The two absences

Across all territories, two elements of ERF appear nowhere: the
**standings ledger** (append-only, per-person, dated, reasoned,
human-only, dispositions computed) and the **evidence primitive** (a
verbatim quote checked against an immutable captured copy of its source).
A third near-absence: human-versus-machine attribution as a data-model
concern exists only in C2PA, and only for media.

### Verdict

The field is dense with formal ontologies at web-scale scholarly altitude
and with single-mechanism products, and essentially empty at the altitude
this format occupies: plain records in git, one operator to a small team,
machine-assisted and human-adjudicated. ERF is a synthesis whose parts
mostly have better-resourced prior art in their own narrow lanes, plus
two elements with none. The name is carried on that basis, and this
document is the receipt.

## Part III — The decision register

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

### Declined

| Decision | Ruled | Why |
|:--|:--|:--|
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

### Deferred, each with the trigger that would revive it

| Deferred | Trigger |
|:--|:--|
| Non-text evidence payloads (measurement, table, image) | The first non-text atom in real work. |
| Per-attachment evidence roles | The first atom that must sit in both evidence lists at once. |
| Atom lifecycle (`withdrawn`, `superseded_by`) | The first bad atom found after citation. Also where an undercutting defeater would be expressed. |
| A capture manifest with content-hash identity | A captures reorganization, a same-URL revision collision, or any corpus sharing. |
| Content-addressed record ids | A second writer minting into a shared corpus, where check-before-write cannot prevent a collision. |
| A families registry (definitions, rename history) | The first family split or rename that matters to an existing document. |
| An actor registry | A second human in a corpus. |
| Import provenance on copied records, and a declared deciding actor | A second human in a corpus. |
| Declared perishability (`stale_after`) | A report that needs it. |
| Structured bet settlement | Calibration across many settled bets. |
| Inference grouping (joint premises) | A lint or a cold reader miscounting a joint premise set. |
| A counter-survey mirror | The first survey that must stand against a claim rather than back one. |
| A typed cause on withdrawals | Something that must filter withdrawals by reason. Its vocabulary would then be derived from accumulated reasons. |
| A relation for near-identical claims | Two parties holding the same proposition at a shared boundary. |
| Media-type extraction profiles for capture text | The first capture that is not text or markdown. |
| A machine-readable audit policy schema | A second corpus with a genuinely different audit bar. |
| The question record type's return | Questions that need a lifecycle, meaning someone actually marking one answered rather than just minting the claim that settles it. |
