---
id: B-48
kind: defect
status: open
priority: P1
priority_because: "The Validator class does not bind `ERF-6`, `ERF-12`, or `ERF-19`, so two conforming validators can differ on whether a quote is verbatim, and widening a conformance class after anyone claims it is a breaking change; provisional pending verification by someone other than the raiser."
basis: reported
raised: "backlog verification pass, 2026-08-25"
verified:
  by: "raised by the verification pass itself"
  on: 2026-08-25
  verdict: unverified
  note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-48 · The Validator conformance class omits section 4

Section 1 binds a validator to "section 6 in full, the serialization rules of section 7, and the declaration and source list", leaving `ERF-6` (verbatim quote), `ERF-12`'s closed verdict set and `ERF-19`'s precision outside a validator's declared duty, though all three are machine-checkable and the reference checks them. Trial 4's fixture i01 and reference bug R1 both landed in that unbound area.

## Proposed resolution

Widen the Validator class to every machine-checkable MUST wherever it sits.
