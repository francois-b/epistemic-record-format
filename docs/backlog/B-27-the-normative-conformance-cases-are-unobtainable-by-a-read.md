---
id: B-27
kind: defect
status: open
priority: unassessed
basis: reported
raised: "trial 1 friction 31, 2026-08-25 (S6)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-27 · The normative conformance cases are unobtainable by a reader of the specification alone

`ERF-51` declares the conformance case files normative where prose and case disagree, but they live in the repository, not the document. Every trial that implemented normalization had to do so blind and then reimplement the sequence to self-check.

## Proposed resolution

Say where the normative cases live, and decide what ships with a published specification.
