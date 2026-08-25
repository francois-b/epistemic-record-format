---
id: B-54
kind: defect
status: open
priority: P3
priority_because: "Harmless until someone expects byte-identity, and B-40 is where that expectation would be settled."
basis: reported
raised: "independent verification of the nine, 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying other entries; needs a check by a hand that did not raise it"
---

# B-54 · Nothing states a key order for frontmatter

Two conforming producers writing the same record produce different files by default. This is not a defect on its own, since the records are equal, but it is what makes byte-identical round-tripping unreachable, and `B-40` does not name it.

## Proposed resolution

Decide whether byte-identity is ever a goal. If it is not, say so where `ERF-53` speaks of loss.
