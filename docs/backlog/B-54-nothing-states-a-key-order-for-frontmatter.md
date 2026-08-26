---
id: B-54
kind: defect
status: contested
priority: P3
contested_because: >
  Stale at HEAD: the decision the entry asked for, whether byte-identity
  is ever a goal, is taken in ERF-53, which defines equivalence for
  documents at the model and reserves byte identity for artifacts.
priority_because: "Harmless until someone expects byte-identity, and B-40 is where that expectation would be settled."
basis: reported
raised: "independent verification of the nine, 2026-08-25"
verifications:
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying other entries; needs a check by a hand that did not raise it"
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: stale
    note: >
      ERF-53 at HEAD: two forms are equivalent when they load to the same
      documents and the same bytes, documents through the model and artifacts
      byte for byte. Key order is not part of a document's identity.
---

# B-54 · Nothing states a key order for frontmatter

Two conforming producers writing the same record produce different files by default. This is not a defect on its own, since the records are equal, but it is what makes byte-identical round-tripping unreachable, and `B-40` does not name it.

## Proposed resolution

Decide whether byte-identity is ever a goal. If it is not, say so where `ERF-53` speaks of loss.

## Consolidation note (2026-08-26)

The entry asked: "Decide whether byte-identity is ever a goal. If it is
not, say so where `ERF-53` speaks of loss." `ERF-53` at HEAD does: "a
document through the model, an artifact byte for byte. Loss in a document
is any difference, after loading, in anything it carried ... Two forms
are equivalent when they load to the same documents and the same bytes".
Two producers writing the same record with different key order load to
the same document and are equivalent; byte identity is a goal only for
held raw and normalized files, which have no keys. The entry's premise,
that `B-40` did not name this, is also moot: `B-40` closed on 2026-08-25
with the definition that answers it.
