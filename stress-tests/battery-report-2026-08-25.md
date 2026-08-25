---
title: "The v0.9 stress-battery report"
purpose: "Consolidated result of the four-lane battery: what held, what broke, what waits on the operator. The 1.0 call reads from here."
generated: 2026-08-25
model: claude-opus-5[1m]
---

# The v0.9 stress-battery report

Eleven agent runs across four lanes, all behind the purity boundary
(SPEC.md and lane materials only, never the fixtures, viewer, examples, or
the spec's history), executed 2026-08-25 per
`stress-test-battery-v0.9.md`. Full findings with evidence:
`findings-2026-08-25.md`. This is the read.

## Verdict

**The core holds.** The record shapes, vocabularies, graph invariants, and
above all the normalization and quote-check machinery survived seven
independent from-prose implementations essentially intact. **The edges
leak.** Nearly every defect found is packaging: filenames the spec never
anchors, a file grammar shown only by example, field formats and types
left unstated, silent drops where reports were owed. All are small text
fixes; none touches the data model. The battery found two reference
implementation bugs (both fixed same-day) and twenty-two findings, of
which roughly a dozen are errata needing an operator ruling.

## The numbers

- **Cross-implementation agreement**: lane 1's from-prose Python validator
  vs the reference, over the reference's 21 fixtures: 19 exact, 2 partial
  with defensible readings. Lane 4's 22 adversarial fixtures vs the
  reference: 22/22 after the two reference fixes. Quote checks across
  every corpus authored: **185 of 187 agree** (9/9 Buffon, 150/151 capex
  with the one failure kept deliberately as erratum S7's exhibit, 26/27
  spot totals in fixtures), and the single genuine divergence is itself a
  spec finding, not an error.
- **The ai-capex corpus**, built to the operator's scale floor by seven
  sequential cold authors: 71 sources, 69 captures, **151 atoms, 53
  claims** (42 observation, 10 argument, 1 bet), 46 edges, 6 surveys with
  a chained re-run, 3 narratives with 15 verified bindings, 31 atoms
  audited by two non-Claude vendors (62 verdicts: 58 SUPPORTED, 2
  PARTIAL, both single-vendor dissents — the 4.4 jury caveat in record
  form). Reference validator: zero findings throughout.
- **Self-checking works in other hands**: every authoring agent
  independently rebuilt the normalization sequence as a pre-ship gate and
  caught real defects with it — five invented-punctuation errors, one
  near-reversed finding, two step-7 near-misses. The format's most
  technical section is its most effective quality mechanism in practice.

## What each lane established

1. **Validator build**: the spec is implementable cold (~1,100-line
   Python validator, 54 of 66 requirements as machine checks, boundary of
   checkability matching the reference's untestable-by-design list). Its
   ten ambiguities seeded half the errata sheet.
2. **Buffon corpus**: the spec is authorable cold at small scale; fully
   green under both validators after two mechanical shims whose necessity
   is itself the finding (file grammar, layout anchoring).
3. **ai-capex corpus**: authorable at real scale by multiple writers; the
   drift that emerges (as_of_date conventions, grading philosophy,
   limitations breadth) is convention-shaped, not comprehension-shaped,
   and each instance is now a named erratum or a report note.
4. **Adversarial fixtures**: the reference's own fixtures encode their
   author's readings; the cold set caught two reference bugs the suite
   could not see, and its five undecidables are spec findings.

## The findings register, compressed

- **Fixed same-day**: R1 (ERF-19 checked flow-style YAML only), R2 (held
  conflated with shippable, against ERF-50).
- **Demonstrated live, ruling owed**: S1 layout anchoring (three
  independent manifestations), S2 as_of_date format and semantics (three
  authors), S7 step-f whitespace (acx-110, kept failing as the exhibit),
  S14 file grammar, S16 same-model authors indistinguishable.
- **Named from friction, ruling owed**: S3-S6, S8-S13, S15, S18
  (decomposes-into blocks a second author), S20 (anchor quote-escape,
  silent breakage), S21 (narrative fields untyped), S10/ERF-34
  (person-authored vs LLM-drafted, flagged three times).
- **For the record, no rule needed**: S17 (behavioral observations at
  scale), S19 (jury behavior), S22 (the survey machinery and the re-run
  chain working as the parked standing-watch concept predicted).

## What was not exercised

Standings and dispositions beyond `proposal` (human-only by ERF-21 —
deliberately reserved for the operator's Phase 6 pass), the extension
namespace (no author reached for `x_` unprompted), multi-realm anything
(cut in the pare-down), and `evidence_audit` on claims (the backing audit
ran on no claim; a natural next exercise).

## Recommendation

Rule on the errata (a single sitting; almost all are one-to-three
sentence fixes), adopt lane 4's fixture set and lane 1's smoke corpora
into the conformance suite, fold the S12 artifacts into the normalization
cases, then perform the standings pass on the capex corpus — the first
human act in a corpus built entirely by machine authors under this
specification, and the last machinery v0.9 has never run. After that, the
1.0 question is genuinely open rather than hopeful: the spec has now been
implemented twice, authored against nine times, and adversarially fixtured
once, all cold.
