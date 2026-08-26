---
id: B-07
kind: capability
status: contested
priority: P3
contested_because: >
  Stale at HEAD: the part the entry said remained, whether a corpus can
  prove which normalized text it holds, is answered by `normalized_digest`
  and ERF-71's MUST. Needs disposal, not a trigger.
priority_because: "A capability partly overtaken by `ERF-71` and otherwise waiting on a capture reorganization or a corpus actually being shared."
basis: anticipated
raised: "design period; sharpened 2026-08-24 when captures gained `fetched.digest`"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: stale
    note: >
      The remaining question was answered on 2026-08-25 when `normalized_digest`
      joined the Source shape and ERF-71 made a recorded digest a MUST against
      the held file; see the note below.
trigger: "A captures reorganization, a same-URL revision collision, or any corpus sharing."
---

# B-07 · A capture manifest with content-hash identity

Partly overtaken: `ERF-71` now pins the fetched artifact by digest. What remains unaddressed is the capture file itself, and whether a corpus can prove which capture it holds.

## Consolidation note (2026-08-26)

The entry's own text says it was partly overtaken by `ERF-71` (the
received artifact's digest) and that what remained was "the capture file
itself, and whether a corpus can prove which capture it holds". At HEAD
the capture is the normalized text, the schema's `Source` carries
`normalized_digest`, and `ERF-71` reads: "Where the corpus holds the
artifact, a recorded `received.digest` MUST match it, and a recorded
`normalized_digest` MUST match the normalized text; a digest is a
statement about bytes the validator can read." The reference checks it
(`fixtures/invalid/digest-mismatch`). Of the trigger's three events, a
same-URL revision is `ERF-2`'s (a revision is a new source) and the other
two name nothing a digest per source does not already give. A manifest as
a separate artifact would be a fifth document kind with no forcing
instance. Marked contested for disposal rather than a ruling.
