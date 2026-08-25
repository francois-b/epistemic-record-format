---
id: B-46
kind: defect
status: open
priority: P1
priority_because: "An atom naming an undeclared corpus conforms today, so widening the obligation invalidates corpora that currently pass, which costs nothing before anyone holds one; provisional pending verification by someone other than the raiser."
basis: reported
raised: "backlog verification pass, 2026-08-25"
verified:
  by: "raised by the verification pass itself"
  on: 2026-08-25
  verdict: unverified
  note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-46 · An atom may name a corpus that was never declared

`ERF-17` reads "`corpus` MUST be written on every claim and MUST name a declared corpus", and section 3.1 cites it for surveys too. The atom table cites only `ERF-54`, which requires the field to exist but not to resolve. An atom naming an undeclared corpus is conforming today.

## Proposed resolution

Widen `ERF-17` to every record, or add the obligation where atoms are specified.
