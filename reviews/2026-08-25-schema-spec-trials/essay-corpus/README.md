# A companion corpus for *Epistemology for Knowledge Work in the LLM Era*

Built cold on 2026-08-25 from four documents and nothing else:
`SPEC-as-tried.md`, `SCHEMA-as-tried.json`, `BINDING-as-tried.md`, and
`rust-validator/README.md`. No other file under `epistemic-record-format/` was
read, listed or grepped: not `ambiguities.md`, not the validator's own friction
log, not `conformance/`, not `examples/`, not another trial. The one moment of
temptation is recorded as `F-00` in `friction-log.md`.

The corpus was built **from the narrative down**: read the essay, mark every
checkable assertion, type each by what would settle it, decompose the arguments
until the premises are not arguments, then go and get evidence, then go and get
the *opposite* of the evidence, then bind the prose back to the claims.

**Nobody has taken a stance.** Every one of the seventy claims computes to
disposition `proposal` (ERF-41), because only a person takes a stance (ERF-21)
and the author has not ruled. This corpus is a proposal to him, not a verdict
on him.

---

## What the corpus holds

| Record type | Count |
|:--|--:|
| **atoms** | 133 |
| **claims** | 70 |
| **surveys** | 10 |
| **narrative** | 1 (31 narrative bindings) |
| **corpus declaration** | 1 |
| **sources** (not records) | 40 |

Claims by epistemic kind:

| kind | count | what would settle it |
|:--|--:|:--|
| `observation` | 45 | data or research |
| `argument` | 11 | reasoning over premises |
| `commitment` | 10 | the author's decision is the backing |
| `bet` | 4 | the world will settle it |

Atoms:

| cut | count |
|:--|--:|
| quoting the essay itself | 65 |
| quoting an outside source | 68 |
| `source_quality: high` | 74 |
| `source_quality: medium` | 59 |
| `source_quality: low` | 0 |
| distinct atoms cited in some claim's `atoms_against` | 47 |

**47 of 133 atoms exist because of the search-for-the-opposite step.** That is
the number this whole exercise turns on: a third of the evidence in the corpus
was gathered to attack the document it accompanies.

No atom is graded `low`. That is a fact about the sources reached (vendor
documentation, standards bodies, encyclopedias, two preprints, one Nature
paper, one first-hand historical account) and not a claim that nothing weak was
used: several `medium` atoms are vendor marketing pages, and each says so in
`limitations`.

### Grading rule used throughout

ERF-9 grades one axis: how much weight the attester's word carries *for the
fact the finding conveys*. The line this corpus drew, stated here so a reader
can disagree with it in one place rather than 133:

- **`high`**: a body's own normative documentation of a mechanism it owns
  (GitHub on commit trailers, Google on its check-grounding API, Notion on page
  verification, NIST on its own framework); a named study reporting its own
  data; a first-hand participant account; **and the essay quoted about the
  author's own practice, stipulations and positions**, where ERF-10's carve-out
  applies: the finding's subject *is* the utterance, and a recorded identified
  utterance is direct and accountable.
- **`medium`**: a vendor's capability or marketing claim about its own
  product; an encyclopedia relaying someone else's work; **and the essay quoted
  about the world**, where the author is an identifiable intermediary reporting
  someone else's fact and is an interested one.

One source, the essay, therefore carries both grades, which section 4.2 says is
the intended behaviour and which this corpus is a worked instance of.

### The finding audit

Every atom's finding was put to a second vendor's model, so that the instrument
that wrote the finding is not the instrument that grades it. Protocol
`finding-audit-v1-batched-10`, auditor `gemini-3.5-flash`, run through
`tools/run_finding_audit.py`. Each item carried only the source citation, the
quote and the finding: no claim, no other atom, no essay.

Batches whose reply did not parse to `id: VERDICT` lines produced **no entry at
all**, because ERF-12 forbids writing a failed or unparseable audit as a
verdict. Six passes were run over the unaudited remainder; two batches never
parsed and their **10 atoms carry no `finding_audit` key at all**, which ERF-56
says is a complete record rather than a malformed one.

| verdict | count |
|:--|--:|
| `SUPPORTED` | 76 |
| `PARTIAL` | 46 |
| `UNSUPPORTED` | 1 |
| unaudited (no entry written) | 10 |

**46 PARTIAL out of 123 is the blunt number in this report.** A second vendor's
model, given only the source citation, the quote and the finding, judged more
than a third of my findings to claim more scope, certainty or specificity than
their quote gives. I do not accept all 46 (the format says a verdict is a
recorded hypothesis, not proof, and section 4.4's note on juries says so
explicitly), and I do not dismiss them either: writing 133 findings that hedge
exactly as hard as their source is harder than the specification's one-paragraph
guidance in section 4.2 makes it sound, and this is what the failure rate looks
like when someone actually counts.

Two `UNSUPPORTED` verdicts came back across the run, and they behaved
differently.

**`ell-160` was a real defect and the audit caught it.** The finding named a
chief technology officer, four startups and a 2025 date; the quote attached to
it said none of those things and was about LLM-written dictation output. I
rewrote the finding to match its quote, stamped `last_modified` (ERF-48),
withdrew the verdict, and re-ran the audit, which returned `PARTIAL`. That is
the audit loop working on a corpus its own author was too close to.

**`ell-102` stands as `UNSUPPORTED`, deliberately.** Its quote uses an elision
marker to skip a markdown link:

> `Available on the [...], it helps you understand the origin of each line when you review or revisit code`

The finding says the feature is Enterprise-only, and the plan name lives
*inside the elided link*. I had flagged that myself in the atom's `limitations`
before the audit ran; a different model, given the quote and the finding alone,
reached the same verdict independently. The mechanical check passed (the quote
is verbatim) and the judgment failed (the quote does not carry the finding),
which is exactly the two-layer split section 4.2 designs. The atom keeps the
verdict and the `limitations` that predicted it, because ERF-12 says
disagreeing with a verdict is a standing, never an edit to the verdict, and no
standing is mine to take.

---

## How many passes to zero violations

**One.** Full table and the honest caveat in `iterations.md`: the corpus never
carried a violation after the empty-directory baseline, because the pre-flight
tools were written before the records were. Three would-be violations were
caught by `tools/erf_fold.py` and `tools/build_records.py` before `erfval`
ever saw them.

Final run:

```
0 violation(s), 2 flag(s), 33 unperformed check(s), 3 partial, 70 note(s).
The corpus conforms. A flag is not a violation (SPEC section 1).
```

### The flags left standing, and why

**`ERF-68` on the source `essay-2026-08-19`.** The essay is an unpublished
manuscript, all rights reserved, held by the author who owns this corpus. No
SPDX identifier exists for that, so the source names `licence_name` and no
`licence`. The validator reads ERF-68 as satisfied only by `licence`; I read
its "as an SPDX identifier **where one exists**" as carving out exactly this
case. Clearing the flag would mean minting a `LicenseRef-` identifier for a
licence that does not exist, which is a fabrication in a corpus whose subject
is fabrication. The flag stays. (Friction `F-03`.)

**`ERF-6` on the atom `ell-150`.** The quote carries a `…` that the *source*
contains, inside a Wikipedia sentence quoting Berners-Lee: "This simple
idea…remains largely unrealized". ERF-52 says a bare `…` is a literal source
character and only `[...]` is an elision, so the checker matches it literally
and it passes; the flag exists so a person looks, and looking confirms the
character belongs to the source. This is the format working correctly and the
flag is the correct output.

### The 33 unperformed checks and the 3 partials

Both are `erfval` reporting its own limits, exactly as section 1 requires, and
neither is something this corpus can or should fix. The three partials
(ERF-35, ERF-36, ERF-38) are deployment-wide checks run over one corpus. The
33 unperformed are the judgments the format deliberately keeps with people
(does the finding follow, does the source deserve its grade, is the elision
honest) plus the facts that live in the substrate rather than in the bytes.

---

## What the essay asserts and this corpus could not back

Twenty-eight of the seventy claims carry outside supporting evidence or a
survey. The rest split three ways.

### Backed only by the author, and unbackable by anyone else

These are first-party facts about a system nobody else has seen. They are
recorded, graded `high` under ERF-10's discourse carve-out, and they are not
evidence about the world.

1. `author-system-holds-500-atoms-one-operator-six-months`
2. `author-built-a-save-time-authorship-shadow-record`
3. `governance-was-where-most-of-the-value-turned-out-to-be`
4. `llm-fit-sharpened-the-authors-document-thinking`
5. `the-approach-is-untested-beyond-one-person`

### Assertions about the world with no outside evidence at all

Every one of these is checkable in principle and none of them is checked here.
Each claim's body says so.

1. **`km-1990s-failed-on-the-cost-of-manual-maintenance`**: the single most
   important gap. The essay's whole second-chance argument rests on the 1990s
   failing *for a specific reason*, and no history of 1990s knowledge
   management was retrieved. If the reason was something else (org politics,
   incentives, the absence of search), the LLM-economics bet loses its motor.
2. **`grounded-material-lowers-hallucination-risk-downstream`**: the mechanism
   the entire proposal depends on. No measurement comparing grounded, typed
   material against loose prose as LLM input was found. The claim-checking
   tools this corpus records *presuppose* that grounding helps; none
   demonstrates it.
3. **`code-review-formed-around-diff`**: a premise of the essay's central
   argument, carrying zero atoms. Recorded unbacked deliberately: it is the
   half of the pair everyone accepts without checking, and omitting it would
   have flattered the argument.
4. `ai-tooling-is-further-along-for-coding-than-for-knowledge-work`: a
   comparative claim with no comparative measure.
5. `pkm-is-broadly-manual-work`: no search was run, and LLM-native note tools
   are the obvious place a counterexample sits.
6. `successful-saas-picked-a-use-case-with-workflow-constraints`: a claim
   about a whole category with no product named.
7. `pragmatic-interoperability-is-an-established-term`: checkable in one
   search, and that search was not run. This is an omission of the corpus
   rather than of the essay.
8. `google-docs-records-authorship-no-finer-than-the-document`: no Google
   source retrieved; Docs' own revision history and activity log were never
   examined.
9. `agentic-marketing-outruns-its-substrate`: "underserved" is a comparative
   judgment needing a market survey nobody ran.

### Assertions backed in part, where the unbacked half is the one the argument needs

- **`trust-tracking-is-confined-to-niches-and-done-by-hand`**: the legal-citator
  half was never retrieved, and citator treatment flags are the place a reader
  would press hardest on "by hand".
- **`company-brain-was-a-yc-request-for-startups-for-summer-2026`**: the YC
  attribution checks out exactly. The same sentence's "a cluster of startups
  use the name" and "the business press is pitching 'enterprise brain'" have no
  source in this corpus.
- **`knowledge-engineering-descends-to-palantirs-ontologies`**: Palantir's own
  documentation corroborates the Ontology's shape and never says the mapping is
  hand-built, which is the word the essay's argument needs.
- **`enterprise-wikis-go-stale-and-are-cleaned-up-or-abandoned`**: well
  supported for enterprise knowledge stores in general, and nothing at all was
  retrieved about Confluence or SharePoint, the two products the essay names.

### One assertion the evidence contradicts outright

**`agile-began-when-software-iteration-got-faster`.** The primary first-hand
account of the Snowbird meeting gives a different cause: the participants
convened out of a shared need for an alternative to documentation-driven,
heavyweight processes, and the account locates the deeper theme in values about
people and collaboration. Nothing in it attributes the movement to iteration
having become faster.

This is not a footnote. The essay's forward bet, that LLMs making knowledge
work faster will produce an Agile-shaped methodological wave, runs on that
analogy. If speed is not what produced Agile, the bet loses its engine.

---

## What the search for the opposite found

Ten surveys, 20 search acts, every query and yield recorded. The short version:
**four of the essay's five universal negatives are false as written, one
survived, and every one of them is true in a narrower form the essay does not
state.**

### 1. "What none of them add is a primitive for checked provenance, for checking claims, or for recording what you stand behind"

The sharpest sentence in the document, and two of its three legs break.

- **Checked provenance** exists and is old. Nanopublications were defined in
  the literature by 2012 as a claim-grain unit carrying its own assertion,
  provenance and publication metadata. SEPIO is an OWL ontology built expressly
  for "the evidence and provenance behind scientific assertions". W3C PROV is a
  recommendation for provenance interchange. sciwrite-lint (2026) verifies
  citations by traversing the citation graph, using the essay's own word for
  what it does.
- **Claim checking** is a commodity. Google ships a check-grounding API that
  returns per-claim citations and a support score with a sub-500ms latency
  budget, and defines grounding as every claim being *wholly entailed* by the
  facts. Ragas and TruLens both decompose a response into claims and check each
  independently. Schema.org has had a `ClaimReview` type since well before the
  LLM era, and Scite classifies citations as supporting or contrasting at
  scale.
- **Recording what a person stands behind** was found **nowhere**, and that is
  the finding the author should keep. Notion and Guru verify whole pages with
  an expiry. Architecture decision records record a decision once and never
  revisit it. Kialo records impact ratings without dating them per person or
  allowing withdrawal. A dated, per-person, withdrawable position on a claim
  does not appear in any system this corpus reached.

**The sentence the evidence supports is one third as long and much stronger.**

### 2. "Today's tools don't record whether something was written by a human or an AI tool" and "Nothing records who wrote what, human or AI, below the grain of a whole page"

False, four times over, and one of the counterexamples is named by the essay
itself two sections earlier.

- **Grammarly Authorship**, the essay calls it "a per-document sidecar inside
  its own app". Grammarly's own page says it runs *inside Microsoft Word,
  Google Docs and Canvas*, and that it "identifies if sentences were written by
  you or came from a website, a Grammarly suggestion, or a non-web source".
  Sentence grain, inside the very Google Docs the essay says records nothing
  finer than the author. Both halves of the essay's description are wrong.
- **agentblame**, free and open source, does line-level AI attribution across
  Cursor, Claude Code and OpenCode, survives squash and rebase, and puts an AI
  percentage on every pull request. Cursor Blame is not the exception; it is an
  instance.
- **`Co-authored-by` commit trailers** are GitHub-documented and are what AI
  coding tools already write themselves into. Git records no AI use by default;
  it is not *unable* to.
- **C2PA Content Credentials** is a shipped open standard for the origin and
  edits of digital content.

What survives, and it is what the essay actually needs: **no such record spans
a working corpus across tools.** Every instance is confined to one editor, one
document format, or one vendor's app.

### 3. "Knowledge work has no diff for arguments, no test that runs on claims as a document grows, no lint for provenance"

- **No test on claims**: false. See above.
- **No lint for provenance**: false, and falsified by a tool that borrowed the
  metaphor first. sciwrite-lint "applies the linting paradigm from software
  engineering to citation verification", checks reference existence, metadata
  accuracy, retraction status and claim support, runs locally, and is fast
  enough to re-lint between revisions.
- **No diff for arguments**: the most interesting near-miss in the corpus.
  Argument mapping is a *field*, with a literature, a settled vocabulary
  (conclusion, premise, co-premise, objection, rebuttal, lemma) and a teaching
  tradition. Argdown writes argument structure as plain text usable inside
  markdown, with premise-conclusion structure explicit, which a line diff
  already handles. Kialo runs claim trees at scale with pro and con children.
  **And still nothing found computes or presents a structural difference
  between two versions of an argument.** The sentence is false as written and
  close to true as meant.

What survives across all three: every claim-checker found runs over *a
generated answer against retrieved context at inference time*. None runs over a
document's own claim graph on every save, which is the continuous-integration
shape the essay is asking for. **The essay's diagnosis is better than its
assertion.**

### 4. "Recording human judgment... there is next to no tooling for it" and "of everything on this list this is the newest practice"

Architecture decision records: a founding text from 2011, command-line tools,
a GitHub organization, format variants, Confluence and Notion templates, and an
explicit statement on the practice's own site that it "can be extended to
design and other decisions ('any decision record')". Fifteen years old, not the
newest. What survives is the narrow version, again: an ADR records a decision
once, in prose, and nothing revisits it.

### 5. "This last layer is missing from the AI-governance conversation", the one that survived

Nine results, and not one addresses the operator's own files, folders and
document classes as the governed object. The nearest neighbours are document
lifecycle management (organizational policy over a document's phases) and
enterprise LLM governance platforms (models, prompts, risk classification).
Microsoft Purview and the NIST AI Risk Management Framework are both real and
both sit squarely in the essay's *operating* and *data* layers.

The survey's own coverage bound is the honest caveat and it is in the record:
the concept has no settled name, and a single phrasing is the weakest possible
instrument for an absence.

### Two more things the author will not enjoy

**The company-brain source specifies more than the essay says it does.** The
essay's verdict is that the word "anthropomorphizes and specifies nothing". The
Y Combinator entry it cites names a pipeline (pull from fragmented sources,
structure it, keep it current, emit an executable skills file) and explicitly
rejects the two descriptions the essay applies to the category: "This isn't a
company-wide search or a chatbot over documents." The word may
anthropomorphize; the request for startups behind it does not specify nothing.

**The CRM decay literature gives a different cause.** The essay says a CRM
"has to be maintained by hand and decays because of it". The retrievable
sources attribute decay to job changes and email churn, the world moving under
a record that was correct when written. Hand maintenance is the *remedy* those
sources describe, not the cause. (They are also, without exception, published
by companies selling the remedy, which is recorded in the survey as its own
finding.)

**And one gift.** Guru's own documentation says manual verification "typically
reaches only 8-12% of organizational content, leaving the rest to slowly become
outdated". That is the essay's staleness claim, quantified, by a vendor with
every reason to know and no reason to understate it.

---

## Layout

```
corpus/
  corpus.yaml                     the declaration (ERF-59)
  sources.yaml                    40 sources (ERF-3)
  raw/                            40 raw files, as received (ERF-2)
  normalized/                     40 normalized texts, what checks run against (ERF-1)
  atoms/                          133 atoms
  claims/                         70 claims
  surveys/                        10 surveys
  narrative/                      the essay with 31 narrative bindings (ERF-31, YAMLB-1)
tools/                            the pipeline, below
logs/                             the finding-audit runs
friction-log.md                   24 entries, the point of the trial
iterations.md                     every erfval run
```

## Tools, so the pipeline is reproducible

Everything under `tools/` was written for this trial, from the specification
alone.

| Tool | What it does | Named in the corpus as |
|:--|:--|:--|
| `erf_fetch.sh` | `curl 8.7.1` with pinned flags; takes the raw file, prints its digest | `received` |
| `erf_digest.sh` | `sha256:<hex>` in ERF-71's spelling | — |
| `erf_excerpt.py` | cuts **one contiguous** passage from an extracted text; single-range by necessity, see `F-04` | the `excerpt` attribution |
| `erf_normalize.py` | **erf-normalize 1.1.0**, the corpus's normalizing tool: LF endings, frontmatter dropped, trailing whitespace stripped, markdown images dropped, blank runs collapsed. Every step line-local, which is what keeps ERF-69's fidelity check true | `normalization` |
| `erf_fold.py` | an independent implementation of **ERF-51** (the fold) and **ERF-52** (the span check), written from the prose | — |
| `erf_check.py` | runs the quote check over every atom before `erfval` sees it; recomputes digests | — |
| `build_sources.py` | emits `sources.yaml` with digests computed and every string-typed scalar quoted (ERF-65) | — |
| `build_records.py` | emits atoms, claims and surveys; enforces ERF-55, ERF-58, ERF-65 and ERF-18 by construction | — |
| `build_narrative.py` | inserts the 31 narrative bindings into the essay's prose | — |
| `run_finding_audit.py` | the cross-vendor finding audit, protocol `finding-audit-v1-batched-10` | `finding_audit.protocol` |
| `pick.sh` | prints a numbered window of an extracted text, for choosing an excerpt range | — |

Extraction was `pandoc 3.8.3 --from=html --to=gfm-raw_html --wrap=none` for web
pages and `pdftotext 25.12.0 (poppler) -layout -enc UTF-8` for the one PDF.
Both are named on every source that used them (ERF-70).

To rebuild the corpus from the data files:

```sh
python3 tools/build_sources.py
python3 tools/build_records.py
python3 tools/build_narrative.py
python3 tools/erf_check.py quotes
../rust-validator/target/release/erfval corpus
```

## Reproducing the normalized texts

`tools/rebuild-normalized.sh` regenerates every normalized text from the raw
files the corpus holds, using the tools each source names. The extraction's own
output is not retained (ERF-70), so the script recreates it and applies the
excerpt ranges in `tools/excerpts.tsv` against it.

Spot-checked on five sources spanning both extractors (`fowler-ci`,
`adr-nygard`, `kialo-wikipedia`, `graphrag-ms`, and the one PDF,
`arxiv-nanopub-claims`): all five reproduced byte for byte, which is what
ERF-70's determinism requirement asks of the pipeline and what
`normalized_digest` lets a reader confirm.
