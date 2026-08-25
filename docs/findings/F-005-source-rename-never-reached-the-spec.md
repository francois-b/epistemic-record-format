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
outcome: closed
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

## Resolution

Closed 2026-08-25. The repair landed when the finding was raised; the gate
landed with this note.

`tools/lint-field-names.py` asserts that every field declared in a normative
interface in `types/erf.ts` is named somewhere in `SPEC.md`, counting both
backticked prose and the specification's own embedded interface and YAML
blocks. Eighty-three fields, and it was verified against the defect it
exists for: renaming `received` back to `fetched` in `SPEC.md` makes it
exit 1 naming `Source.received`.

Only that direction is checked. The reverse would fire on field names the
specification legitimately discusses without defining, such as `x_`
extensions and fields named in prose about why they were retired.

**And the gate that was missing under the missing gate.** Neither linter ran
anywhere. `lint-spec-style.py` had existed for days as a command someone had
to remember, and this one would have joined it. Both are now invoked by the
conformance suite, so `npx tsx conformance/run.ts` is the single gate and a
check that does not run cannot masquerade as one. That was the actual
finding: three separate checks reported on something they did not read
(`F-005`, the loader's silent skip, `backlog-index.py`'s hand-rolled
parser), and a fourth was not read by anything at all.
