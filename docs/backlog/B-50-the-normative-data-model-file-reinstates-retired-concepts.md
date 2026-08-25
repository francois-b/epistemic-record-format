---
id: B-50
kind: defect
status: closed
priority: closed
priority_because: "The artifact the specification defers to currently reinstates a concept the specification removed, so the governing text and the governed text disagree about what the format is."
basis: demonstrated
raised: "claude-fable-5 backlog review, 2026-08-25, via finding F-002"
verifications:
  - by: "claude-opus-5, read the artifact directly"
    on: 2026-08-25
    verdict: accurate
---

# B-50 · The normative data model file reinstates retired concepts

Section 3 says `types/erf.ts` governs where it and the inline mirror differ. That file still dates itself `v1.0, 2026-08-24` against a `0.9.0` specification, still comments a claim's `corpus` as a "Confidentiality tier", and still says that where the declaration and **the corpus registry** disagree about classification, the registry governs. The registry was retired with `ERF-64` on 2026-08-24. Verified by reading the file directly.

## Proposed resolution

Bring the file to 0.9.0 and strike the retired concepts. Then decide whether the mirror-versus-file precedence rule is worth keeping at all, given that it is what makes a stale comment normative.

## Resolution

Closed 2026-08-25: types/erf.ts now dates itself 0.9.0, its corpus comment no longer says confidentiality tier, and the declaration comment no longer names the retired registry.
