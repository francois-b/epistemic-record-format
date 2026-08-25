---
title: "Independent trials of v0.9"
purpose: "Executable plan for the four tests that stand between v0.9 and 1.0. Self-contained: a fresh session executes from this file alone."
status: planned
generated: 2026-08-24
model: claude-opus-5[1m]
---

# Independent trials of v0.9

v0.9's status text says 1.0 waits on stress testing in real use beyond the
author's practice. This file is the plan: four tests, each aimed at an
audience the existing verification does not reach. The conformance suite
and the viewer were written by the spec's author; every fixture encodes the
author's reading. These tests put the text in front of readers who do not
share that reading.

Ruled by the operator 2026-08-24: run all four; the corpus-authoring test
runs twice, once small and once at real-practice scale (150+ atoms, 50
claims).

## The purity boundary (applies to every trial)

An agent in any trials receives:

- `SPEC.md`, and nothing else from this repository: no fixtures, no
  `viewer/`, no `examples/`, no `DESIGN-HISTORY.md`, no `CHANGELOG.md`.
- Its trial's raw materials (listed per trial).
- For batched trials, the corpus-so-far on disk, as any real author has.

An agent never receives: the conversation history that produced the spec,
the [private repo] repository's corpora, or another trial's output. Every trial
keeps a **friction log**: each point where the agent guessed, re-read,
or made a choice the spec did not settle, one dated line each. The
friction log is a first-class deliverable, not a nicety.

Model policy: authoring and research trials run on Sonnet ([private repo]
[house rule]; research-shaped work never inherits the session model), plain
fetches on Haiku. The validator-build trials may run on a stronger model;
diversity of model per trial is itself an independence axis.

## Trial 1 — independent validator build (implementability)

**Question:** can an implementer build a conforming validator from the
prose alone?

- Agent receives `SPEC.md` only. It builds a validator in a language of
  its choosing (not required to be TypeScript) that accepts a corpus
  directory and reports violations with requirement ids.
- THEN, and only then, the orchestrator runs the reference conformance
  fixtures (`conformance/fixtures/`) against the agent's validator, and
  the agent's validator against `examples/corpus/`.
- Every disagreement between the two implementations is classified:
  spec ambiguity (the prose admits both readings), reference bug, or
  independent-build bug. Ambiguities are the harvest; each becomes a spec
  erratum or a conformance case.
- Deliverables: the validator, its run reports, the disagreement table,
  the friction log.

## Trial 2 — small authored corpus: Buffon (authorability, depth)

**Question:** can an author produce a conforming corpus from the prose
alone? Nothing currently tests the producer side.

- Topic: Buffon's American degeneracy thesis and Jefferson's refutation.
  Chosen because it is a genuine two-sided historical dispute
  (`atoms_for` and `atoms_against` on one claim), public-domain primaries
  (Histoire Naturelle scans exercise the full `fetched.digest` +
  `converter` + `excerpt` chain; Notes on the State of Virginia;
  Jefferson's letters at founders.archives.gov), one deliberately
  restricted modern secondary (pointer-only path), and quantitative
  quotes (Jefferson's weight tables) that exercise normalization on
  numbers.
- Scope: 4 sources, 8-10 atoms, 4-5 claims with at least one
  `conflicts-with` or `supports` edge, 1 survey ("did Buffon retract,
  and where?"), 1 short narrative with bindings.
- Prior topic knowledge in the model is fine: the test is process
  fidelity, not topic novelty, and the quote check cannot be passed from
  memory, only from a capture actually fetched.
- Afterward the orchestrator runs the reference validator and the quote
  checks over the output. Three result classes, all valuable: violations
  (the spec failed to communicate), clean-but-wrong records (the gap
  between machine-checkable and normative), and the friction log.
- A corpus that comes out well is candidate material to sit beside or
  replace `examples/corpus/`: fixture material written by a different
  hand, which the current fixtures lack by construction.

## Trial 3 — large authored corpus: AI capex (authorability at scale)

**Question:** which disciplines degrade as a corpus grows? Small tests
cannot see id-sequencing under volume, citation-style drift between atom
5 and atom 150, `source_quality` inconsistency across similar sources,
families emerging ad hoc, or the discipline an author quietly abandons
when tired. Precedent from the reference practice: atom tags died only
at volume (201 distinct tags across 146 atoms).

- Topic (ruled 2026-08-24): **the AI capital-expenditure sustainability
  debate**: is the datacenter buildout economically sustainable, or a
  capex bubble? Chosen for: named opinion-holders on both sides;
  quantitative claims everywhere (`as_of_date` on nearly every atom,
  normalization over figures); the full `source_quality` ladder in one
  corpus (SEC filings and earnings calls high, analyst notes and trade
  press medium, vendor self-claims medium-interested, blogs and X low,
  with the same organization attesting at two grades); the honest
  licence mix (filings ship, almost everything else is excerpt-as-
  quotation or pointer-only); and by-product value: the corpus lands
  inside the operator's [private thesis], so the test produces an
  asset rather than homework.

**Scale targets (operator floor):**

| Entity | Target |
|---|---|
| atoms | 150-170 |
| claims | 50, with a real edge graph |
| sources | 40-55 |
| surveys | 6-8, at least one re-run chained via `prior_survey` |
| narratives | 3 (synthesis; the skeptic case; the numbers) |
| audited atoms | ~30, cross-vendor via `mods` (DeepSeek or Gemini) |

**Phasing** (no single context holds this; batches are the design, and
multiple writers minting into one corpus is itself the second-writer
stress the `ERF-52` uniqueness note defers behind exactly this trigger):

- Phase 1: source scouting and capture. One or two agents fetch 40-55
  sources, write source entries with licence judgments, author excerpt
  captures, record converters and digests where applicable.
- Phase 2: atom minting, sequential batches of 25-30 per agent, each
  batch reading the corpus state on disk and continuing the id sequence.
  Per-batch friction logs, which also measure degradation over batches.
- Phase 3: claims and edges, two runs.
- Phase 4: surveys (including the deliberate re-run), then narratives
  with bindings.
- Phase 5: reference validator, quote checks at scale (the practice's
  historical fail rate was 9%; measure this corpus's), metrics:
  violations by requirement, friction entries per batch, drift measures
  (citation style, quality-grade distribution by source type).
- Phase 6: **operator standings pass.** `ERF-21` makes stances
  human-only, so every authored claim lands as `proposal` and no agent
  can exercise the ledger. The operator reads a handful of claims and
  takes real stances, which exercises standings, `evidence_at_stance`,
  and computed dispositions on the one path agents cannot walk.

**Decisions taken (operator may override):** audits on a ~30-atom subset
only, the rest legally unaudited and shown as such by the health page;
home is `03-authoring-trial-at-scale/corpus/` in this repository, migrating to the
[private repo] later if it proves an asset (corpus directories
are portable by design); tooling note for capture conversion, a pinned
pymupdf4llm venv exists at the scratch directory but a fresh one is
two commands.

**Cost, honestly:** the largest run of the project, on the order of
10-15 sequential Sonnet agent runs with live web fetching, spread over
hours. Run the three cheap trials first as early warning.

## Trial 4 — adversarial fixtures (fixture blind spots)

**Question:** what do the author's own fixtures fail to test?

- Agent receives `SPEC.md` only and writes new fixture corpora: valid
  ones that must load clean, and invalid ones each violating a named
  requirement, aiming for requirements and boundaries the agent judges
  most likely to be under-tested (it cannot see the existing fixtures,
  which is the point).
- The orchestrator runs them against the reference validator. A valid
  fixture that fails or an invalid one that passes is a finding:
  reference bug, spec ambiguity, or fixture-authoring error, classified
  like Trial 1.
- Also in scope, the spirit red-team: corpora that pass every machine
  check while violating the format's intent (an excerpt capture that is
  only the quote; a survey with one trivial act backing a sweeping
  absence claim). These map which SHOULDs carry weight the MUSTs cannot
  see, and each becomes a design-history note or a candidate check.

## Execution order

1. Trials 1, 2, 4 dispatch in parallel (one agent run each).
2. Trial 3 Phase 1 starts alongside; atom batches gate on Phase 1's
   source list and on Trial 1 not having found the spec unimplementable.
3. Findings consolidate into three buckets: spec errata (fix under the
   0.9 change discipline), new conformance cases, design-history notes.
4. The 1.0 call is the operator's, after reading the consolidated
   findings and completing the Phase 6 standings pass.

## What "done" looks like

Four friction logs and a disagreement table on file under
`reviews/2026-08-25-independent-trials/`; every finding dispositioned (fixed, cased, noted, or
rejected with a reason); the capex corpus green under the reference
validator with its quote-check rate measured; and a written operator
read on whether 0.9's text survived contact with four cold readers.
