---
id: B-30
kind: defect
status: open
priority: unassessed
basis: reported
raised: "trial 1 ambiguity A3 and trial 4 undecidable 4, 2026-08-25 (S5)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-30 · `ERF-43` and `ERF-49` collide at the flag boundary

A premise-less argument is a flag under `ERF-49` and a violation under `ERF-43` when reached as a closure leaf. Whether a closure includes its own root is unstated and decides which fires. Separately, whether a flag-only corpus is still in the loads-clean class has no answer.

## Proposed resolution

State whether the closure includes its root, and state what a flag means for conformance.
