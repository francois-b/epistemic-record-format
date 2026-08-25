---
id: B-29
kind: defect
status: open
priority: P1
priority_because: "The specification contradicts itself, `bound-at` being a MUST in `ERF-32` and optional in the grammar beside it, so the same narrative binding is both conforming and not."
basis: reported
raised: "trial 1 ambiguity A1, 2026-08-25 (S4)"
verified:
  by: "agent/claude-opus-5, verification pass"
  on: 2026-08-25
  verdict: accurate
---

# B-29 · `ERF-32` requires what the `ERF-31` grammar makes optional

`bound-at` is a MUST in `ERF-32`, is optional in `ERF-31`'s stated grammar, and `ERF-32` then defines the handling of its own violation state (staleness `indeterminate`).

## Proposed resolution

Reconcile, or say plainly that the grammar admits what `ERF-32` then reports.
