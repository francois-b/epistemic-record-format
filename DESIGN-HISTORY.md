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
- **Three relation types** (`implies`, `refutes`, `answers`): retired in
  an earlier vocabulary audit — `implies` was `assumes` reversed;
  `refutes` had zero uses because counter-evidence lives on the claim;
  `answers` died with an earlier modeling of questions.
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

Surveyed 2026-08-22: four parallel research passes across ~24 candidates
in four territories, with primary sources captured at fetch (24 captured
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
