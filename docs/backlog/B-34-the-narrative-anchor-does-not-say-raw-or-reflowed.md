---
id: B-34
kind: defect
status: open
basis: demonstrated
raised: "trial 2, 2026-08-25 (S13)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
  basis_corrected: "an anchor actually broke and a later trial changed how it wrote files to avoid it"
---

# B-34 · The narrative anchor does not say raw or reflowed

`ERF-31`'s anchor is a "verbatim substring" of the passage, against raw bytes or reflowed text unstated. A hand-wrapped paragraph broke an anchor across a line-wrap.

## Proposed resolution

One sentence.
