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

Three decisions were made and unmade within the design period, each
leaving a principle:

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

## Part III — Decided against, and deferred

A format's readers keep proposing what its authors already considered. This
part exists so that a proposal can be checked against a ruling instead of
re-argued, and so the reasons stay attached to the decisions. Things retired
*after* being used live in the subtraction ledger above; this register holds
what was considered and declined, and what waits on a named trigger.

### Rejected

- **Degrees of belief on claims** (probabilities, confidence percentages):
  invites false precision and averaging over judgments that were never
  commensurable.
- **Strength grades on held positions**: settledness is readable from tenure,
  from disputes survived, and from evidence accumulated, so storing it
  duplicates what the record already shows.
- **A decision record type**: an active bet plus the standing that activated
  it is the solo decision system; the adversarial reviewer's dissent is
  preserved rather than resolved.
- **Quorum, voting, and merge resolution**: permanently out of scope. What a
  disagreement means is a judgment its owner makes, not a computation.
- **A tie-break for disposition**: `contested` is the terminal reading of a
  disagreement. No stance outranks another (v1.0.2).
- **Reader-safe summaries of hidden evidence** ("rests on three primary
  sources, two audited"): a second version of the truth to maintain, and an
  unfalsifiable claim of backing offered exactly where a reader can least
  check it.
- **A typed vocabulary of reasons for negative standings**: measured against
  every withdrawal in the reference practice; five existed, none carried
  one, and four of the five actual reasons were absent from the proposed
  list.
- **Mechanical check results stored on records**: recomputable by anyone
  holding the corpus and its captures, therefore derived, never a field.
- **Splitting state into three fields**, and **multi-valued epistemic
  kinds**: both from the adversarial review, both rejected as complexity
  without a forcing instance.
- **A lettered source-reliability scale** (Admiralty style) and **a
  two-field split of source quality**: the literature records 87% of
  two-axis ratings collapsing onto the diagonal, and letter grades measuring
  exactly as fuzzy as English words.
- **schema.org `Claim` export as a requirement**: consumption-side mapping
  with no bearing on the record format. It may be written; it is not owed.
- **A default query lens as a normative requirement**: consumer mechanics,
  kept as advice in a note rather than as a rule.
- **Topic tags on atoms**: measured rot, 201 distinct tags across 146 atoms,
  more vocabulary than records.
- **Requiring a register of the author's own positions**: the format permits
  one; the reference practice deliberately keeps its author's positions
  outside the format, and says so.

### Deferred, each with the trigger that would revive it

- **Non-text evidence payloads** (measurement, table, image): the first
  non-text atom in real work.
- **Per-attachment evidence roles**: the first atom that must sit in both
  evidence lists at once.
- **Atom lifecycle** (`withdrawn`, `superseded_by`): the first bad atom
  discovered after it has been cited. This is also where an undercutting
  defeater, evidence that a support no longer holds without arguing the
  claim false, would be expressed.
- **A capture manifest with content-hash identity**: a captures
  reorganization, a same-URL revision collision, or any corpus sharing.
- **A families registry** (definitions and rename history): the first family
  split or rename that matters to an existing document.
- **An actor registry**: a second human in a corpus.
- **Declared perishability** (`stale_after`): a report that needs it.
- **Structured bet settlement**: calibration across many settled bets, which
  is also the day the one-union-versus-bet-as-type question gets decided
  with usage data.
- **Inference grouping** (joint premises, OR-of-ANDs): a lint or a cold
  reader miscounting a joint premise set where it matters.
- **A counter-survey mirror**: the first survey that must stand against a
  claim rather than back one.
- **A typed cause on withdrawals**: something that must filter withdrawals by
  reason. Its vocabulary would then be derived from accumulated reasons
  rather than invented ahead of them.
- **Ownership as a format concern**: the multi-operator design, where whose
  corpus is authoritative and who may admit records become real questions.
- **Import provenance on copied records, and a declared deciding actor**: a
  second human in a corpus.
- **A relation for near-identical claims**: two parties holding the same
  proposition at a shared boundary. Within one corpus, near-duplicates are
  merged rather than related.

