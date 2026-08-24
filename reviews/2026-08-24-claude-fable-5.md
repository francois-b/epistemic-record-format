---
reviewer: claude-fable-5
date: 2026-08-24
reviewed_at_commit: c648804
generated: 2026-08-24
model: claude-fable-5
---

# Internal review: Claude Fable 5, 2026-08-24

**Reviewer:** `claude-fable-5`, the session that also ran and adjudicated
the external pass archived as `2026-08-24-gpt-5.6-sol.md`. The two passes
were independent in production (this one completed before the external
output arrived) and overlap on several findings; overlaps are marked. This
file records what the internal pass surfaced beyond the external one, which
was mostly a different class of defect: **the satellites lagging the
specification**, where rulings had landed in `SPEC.md` and
`DESIGN-HISTORY.md` without being swept through what ships beside them.

## Findings and adjudications

All rulings 2026-08-24.

| # | Finding | Ruling |
|:--|:--|:--|
| 1 | Pre-flatten requirement ids (`ERF-<section>.<n>`) alive in `viewer/README.md`, all six `examples/*.yaml`, `examples/corpus/README.md`, `LAYOUT.md`, `corpus.yaml`; `captures.yaml` even cites a wrong current id | **accepted** — all swept to flat ids; `hygiene.test.ts` now fails a run on any recurrence outside the history documents |
| 2 | `examples/survey-mixed.yaml` and `survey-gap.yaml` still carry the `limitations` field retired from surveys on 2026-08-23; `survey-closed.yaml` cites the retired requirement | **accepted** — bounds folded into each body per the retirement's own pattern; the hygiene suite now validates every standalone example against the defined field roster |
| 3 | `examples/corpus/README.md` says "Fifteen records", counts 5 atoms and 5 claims, and lists a Questions row — the question type was cut and the corpus holds 9 atoms, 6 claims | **accepted** — table corrected; the copying-changes list now honestly records the actor-id normalization too |
| 4 | Root `README.md`: "insertions take letter suffixes" contradicts the flatten; the disposition list omits `rejected`; the documents table has a broken row; the corpus description predates the shipped captures | **accepted** — all corrected |
| 5 | `viewer/README.md`'s "One thing the specification does not define" section claims normalization is undefined and describes a lowercasing the spec forbids — stale since the 2026-08-23 fixes | **accepted** — rewritten to state the current truth: `ERF-51` defines it, the viewer implements it verbatim, the case files are normative |
| 6 | `DESIGN-HISTORY.md` Part II cites the cut ship-gate requirement in the present tense ("the line ERF draws with ERF-6.13") | **accepted** — reworded as the historical fact it is |
| 7 | Four early corpus atoms write `by: claude-fable-5`, violating the spec's own `Actor` convention (`agent/claude-fable-5`) | **accepted** — normalized, and disclosed in the corpus README's changed-in-copying list |
| 8 | `ERF-17`'s SHOULD routed a corpus-transfer note through the standings ledger, where it would move the computed disposition (`ERF-41`) as a side effect | **accepted** — transfers stamp `last_modified` and explain themselves in working notes; the ledger holds stances only. (The external pass missed this one) |
| 9 | `ERF-43`'s "none of them retired" made conformance time-varying: a legal withdrawal elsewhere could put the corpus in violation of a MUST, where the sibling condition `ERF-49` is a computed flag | **accepted** — the retired-leaf condition is now a validator flag; the structural halves (termination, self-edges, acyclicity) stay MUST. (Also missed by the external pass) |
| 10 | `ERF-1` overlaps `ERF-50` (both say checks run against captures) | **rejected** — on inspection they bind different things: ERF-1 is capture-before-check on the producer side, ERF-50 is re-runnability and gate timing on the validator side. Kept separate |
| 11 | `ERF-59` and `ERF-64` both home `classification` with no precedence on disagreement | **accepted** — the registry governs; a validator flags the disagreement (overlaps external finding 7/8 territory) |
| 12 | `conformance/README.md`'s example output line was stale (63/24/21 against an actual 66/25/23) | **accepted** — updated and marked as a dated observation, not a promise |
| 13 | Nothing validated the standalone `examples/*.yaml` at all — the class of defect in finding 2 was invisible to every check | **accepted** — `hygiene.test.ts` closes it |
| 14 | The `::: {.cols ...}` pandoc wrappers in `SPEC.md` render as literal noise on GitHub | **accepted** — removed with the 3.1 trim (operator chose the field-to-requirement index) |

## What this pass concluded that is not a defect

The conformance suite earns its keep (it had already caught three real
defects and the coverage map is honest); the specification's length is
rationale, not bloat, and the rationale is what keeps reviews from
re-litigating settled questions; and the decision register worked exactly
as designed on the external pass — zero re-raised adjudications.
