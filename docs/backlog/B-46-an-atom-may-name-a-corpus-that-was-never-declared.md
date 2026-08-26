---
id: B-46
kind: defect
status: closed
priority: closed
contested_because: >
  Stale at HEAD: ERF-17 was widened from every claim to a record's corpus
  in the 2026-08-26 trim, which is the one-word fix the entry asked for.
priority_because: "Fable: a one-word widening of ERF-17 that invalidates only corpora no real practice produces."
basis: reported
raised: "backlog verification pass, 2026-08-25"
verifications:
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: accurate
    note: >
      confirmed, and strengthened: section 3.1 cites ERF-17 for surveys
      while ERF-17 says "every claim", so the index and the requirement
      already disagree.
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: stale
    note: >
      ERF-17 at HEAD opens "A record's `corpus` MUST name the corpus the
      deployment declares"; an atom is a record (section 2), so the obligation
      reaches it.
---

# B-46 · An atom may name a corpus that was never declared

`ERF-17` reads "`corpus` MUST be written on every claim and MUST name a declared corpus", and section 3.1 cites it for surveys too. The atom table cites only `ERF-54`, which requires the field to exist but not to resolve. An atom naming an undeclared corpus is conforming today.

## Proposed resolution

Widen `ERF-17` to every record, or add the obligation where atoms are specified.

## Consolidation note (2026-08-26)

The entry asked to "widen `ERF-17` to every record". At HEAD `ERF-17`
reads: "A record's `corpus` MUST name the corpus the deployment declares."
Section 2 defines a record as "one atom, claim, or survey". `ERF-54`
separately requires every record to carry the field. One residue: the
section 3.1 atom table still cites `ERF-54` alone for `type`, `corpus`
while the claim and survey tables cite `ERF-17`, an index inconsistency
of the kind the 2026-08-25 verifier noted, and not an obligation gap.
That is a one-cell edit to the field reference, not a ruling.

## Resolution

Closed 2026-08-26, ruled by the operator on the consolidation pass's verdict: `ERF-17` reads "A record's `corpus` MUST resolve to a declared corpus" and the loader reports an undeclared one.
