---
id: B-34
kind: defect
status: closed
priority: closed
priority_because: "Whether an anchor matches raw or reflowed text decides whether a consumer MUST report a binding as broken under `ERF-33`, so two conforming tools reach opposite conclusions about the same narrative."
basis: demonstrated
raised: "trial 2, 2026-08-25 (S13)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
    basis_corrected: "an anchor actually broke and a later trial changed how it wrote files to avoid it"
---

# B-34 · The narrative anchor does not say raw or reflowed

`ERF-31`'s anchor is a "verbatim substring" of the passage, against raw bytes or reflowed text unstated. A hand-wrapped paragraph broke an anchor across a line-wrap.

## Proposed resolution

One sentence.

## Resolution

Ruled 2026-08-25, and the entry's own framing was the first thing to go.
It offered a choice between raw bytes and "soft-line-reflowed text", and
the second option should not exist. Two different things were being called
reflow: the layout repair cut from `ERF-51` (un-hyphenating, rejoining
sentences a PDF extractor broke, removed because normalization was
repairing damage a deterministic extractor should never produce), and a
newline inside a markdown paragraph, which is not damage at all. CommonMark
says it is a space, and the trial author had hand-wrapped their prose
correctly.

The option collapses anyway, because `ERF-51` step 3 already settles it: a
newline is whitespace, whitespace runs collapse, and an anchor that reads
as one phrase matches as one phrase. No reflow concept is needed to fix
the case that raised the entry.

So the live question was only raw bytes or `ERF-51`, and the answer is
`ERF-51`: **this format answers "does this string occur in that text"
exactly once.** Two occurrence tests would be two verdicts for one
question, which is the thing `ERF-51`'s own preamble exists to prevent.

Conformance asks only whether the anchor occurs, which is a boolean. Where
a consumer highlights the passage it must map a match in folded space back
to the raw text, but highlighting is a rendering nicety this format never
requires, so that cost falls only on renderers that want it.

Fixture `valid/anchor-spans-a-line-wrap` is the raising case, asserted to
match rather than merely to load.
