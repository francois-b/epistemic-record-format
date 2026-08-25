---
id: B-46
kind: defect
status: open
priority: P2
priority_because: "Fable: a one-word widening of ERF-17 that invalidates only corpora no real practice produces."
basis: reported
raised: "backlog verification pass, 2026-08-25"
verifications:
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: accurate
    note: "confirmed, and strengthened: section 3.1 cites ERF-17 for surveys while ERF-17 says "every claim", so the index and the requirement already disagree."
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
---

# B-46 · An atom may name a corpus that was never declared

`ERF-17` reads "`corpus` MUST be written on every claim and MUST name a declared corpus", and section 3.1 cites it for surveys too. The atom table cites only `ERF-54`, which requires the field to exist but not to resolve. An atom naming an undeclared corpus is conforming today.

## Proposed resolution

Widen `ERF-17` to every record, or add the obligation where atoms are specified.
