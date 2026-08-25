---
id: B-25
kind: defect
status: open
priority: P1
priority_because: "Two implementations return opposite verdicts on the same faithful atom, which is exactly the divergence the normalization sequence exists to prevent."
basis: demonstrated
raised: "predicted by trial 1 (A8), proved by capex atom `acx-110`, 2026-08-25 (S7)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
---

# B-25 · `ERF-51` step f is under-specified, and it changes verdicts

"A space before punctuation": the reference reads it as one literal space, a batch author's from-prose implementation read it as whitespace generally. A quote whose capture line-wraps before a bare source ellipsis normalizes differently on each side, and the two implementations return opposite verdicts on a faithful atom. `acx-110` is kept failing in the capex corpus as the exhibit.

## Proposed resolution

State that step f covers any whitespace run before the punctuation mark; add a conformance case pinning the line-wrapped pair; move the reference and the case file together.
