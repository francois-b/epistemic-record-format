---
id: F-005
raised:
  by: "claude-opus-5, reading ERF-55 and section 3 for the B-51 ruling"
  on: 2026-08-25
  observation: "The source rework renamed fetched to received and cleanup to normalization in types/erf.ts; SPEC.md still used the old names, including in its one normative Source example"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: "section 3, ERF-7, ERF-71"
  claim: null
verifications: []
outcome: open
---

# F-005 · The source rename never reached the specification

## What was observed

`received` appeared **zero times** in `SPEC.md`. `fetched` appeared three
times, `cleanup` once, and the section 3 example wrote `excerpt: true` where
the model types `Excerpt {by, on}`. Both `SPEC.md` and `types/erf.ts` are
normative, and on the name of a field they disagreed.

Two implementers reading the two normative documents build incompatible
Source shapes, and neither has done anything wrong.

Fixed in the same pass, since the rename itself was already ruled and this
was only its propagation: `fetched` → `received` at `ERF-7` (twice),
`ERF-71` (twice) and section 3; `cleanup:` → `normalization:`,
`excerpt: true` → `excerpt: {by, on}`, plus the `received.path`,
`received.on` and `normalized_digest` lines the reworked shape defines, in
the example.

## Why it was raised anyway

The fix is mechanical. The finding is not, and it is about process rather
than about any requirement.

A ruling was applied to the data model, to the loader, to the viewer and to
the fixtures, and stopped short of the document the whole format is. No gate
caught it: the style linter checks prose, the conformance suite checks
behaviour against the reference implementation, and nothing checks that
`SPEC.md` and `types/erf.ts` name the same fields. Every corpus, every
implementation and every test agreed with each other and disagreed with the
specification, which is the one artifact a stranger actually reads.

Two things are worth deciding separately from the repair:

**A gate.** A check that every field named in `types/erf.ts` appears in
`SPEC.md` and vice versa is a dozen lines and would have caught this the
moment it happened. Its absence is why a day passed.

**A count.** This is the second stale-vocabulary defect found in two days
(`F-002`, `types/erf.ts` reinstating retired concepts, is the first, and it
points the other way). The question that answer suggests is not "is the
spec stale" but "what keeps the four normative surfaces (`SPEC.md`,
`types/erf.ts`, the fixtures, the reference implementation) from drifting."
