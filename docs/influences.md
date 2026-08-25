---
title: "Influences"
purpose: "The fields this format draws on, what each contributed, and where each stops short."
status: non-normative
last_updated: 2026-08-25
---

# Influences

A format that claims to make working research checkable is standing on
several older traditions, and owes its readers an account of which. This
document surveys five territories: what each already solved, what this
format borrowed, and the point at which each stops short of the problem.

Two elements of this format appear in none of them, which is stated at the
end rather than assumed at the start. The rest is inheritance, and saying so
is cheaper than being caught not knowing.

Surveyed 2026-08-22: five research passes across ~30 candidates in five
territories, with primary sources captured at fetch (24 captured
documents; the captures remain in the author's corpus, since captured
copies of third-party works do not travel with a published corpus — see
the spec's security considerations). Summary verdicts; the spec's Related
Formats section is the condensed form.

## Argumentation formats

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

## Provenance and claim standards

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

## Research tools and discourse graphs

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

## Organizational knowledge and decision records

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

## Archival science and diplomatics

**Diplomatics** (Mabillon, 1681, formalized from Valla's 1440 exposure of
the Donation of Constantine) is the oldest working precedent in this
whole survey for judging a record's trustworthiness from its form and
provenance rather than its content: Duranti's own gloss, "the study of
the content of the document is extraneous to diplomatics." **InterPARES**
(Duranti, UBC, 1998-) is the closest institutional match anywhere in
this scan: its Authenticity Task Force splits authenticity into
identity and integrity, and its benchmark/baseline requirements draw
exactly the presumption-versus-gate line ERF's ship gate once drew (a
pre-publication requirement retired on 2026-08-23 when v1 shed policies) —
eight cumulative, partial-credit requirements building a working
presumption against three that must ALL be met before a certified copy may
issue. No other territory surveyed supplied a tested precedent for that
split, and it remains the design to reach for if a gate ever returns.
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
## The two absences

Across all territories, two elements of ERF appear nowhere: the
**standings ledger** (append-only, per-person, dated, reasoned,
human-only, dispositions computed) and the **evidence primitive** (a
verbatim quote checked against an immutable captured copy of its source).
A third near-absence: human-versus-machine attribution as a data-model
concern exists only in C2PA, and only for media.

## Verdict

The field is dense with formal ontologies at web-scale scholarly altitude
and with single-mechanism products, and essentially empty at the altitude
this format occupies: plain records in git, one operator to a small team,
machine-assisted and human-adjudicated. ERF is a synthesis whose parts
mostly have better-resourced prior art in their own narrow lanes, plus
two elements with none. The name is carried on that basis, and this
document is the receipt.
