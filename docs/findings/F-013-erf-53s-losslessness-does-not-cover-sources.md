---
id: F-013
raised:
  by: "Protobuf trial, 2026-08-25 post-ruling trials"
  on: 2026-08-25
  observation: "ERF-53's round-trip guarantee is scoped to records, and sources, declarations and narratives are explicitly not records"
basis: demonstrated
priority_note: "ship-blocker for 0.9 — the provenance chain sits outside the only losslessness guarantee the format makes"
specified:
  by: "claude-opus-5, reading the requirement text against the trial's claim"
  on: 2026-08-25
  requirement: "ERF-53, ERF-8"
  claim: >
    ERF-53 permits any store shape 'provided every record round-trips
    through the interchange form without loss'. The format states that a
    source is not a record, a declaration is not a record, and a narrative
    MUST NOT be modelled as a record. The source list carries the digests,
    the licence judgments and the normalized-text paths.
verifications:
  - by: "claude-opus-5, executed against the reference implementation"
    on: 2026-08-25
    verdict: accurate
    note: >
      Confirmed in SPEC.md: ERF-53 reads 'every record round-trips'.
      Measured by the trial: `chapter-number: 36` returned `36.0` and
      `issued: 1494` returned `1494.0` through a store that claims ERF-53
      conformance, silently breaking the field ERF-8 calls canonical.
outcome: promoted
promoted_to: "ERF-53, ruled directly 2026-08-25"
---

# F-013 · `ERF-53`'s losslessness does not cover the source list

## The gap

`ERF-53` licenses a non-file store on one condition: every **record**
round-trips. The format is emphatic elsewhere that a source is not a record
("nobody asserts a source"), that a declaration is not one, and that a
narrative MUST NOT be modelled as one.

So the guarantee has a hole exactly where provenance lives. `ERF-1`,
`ERF-69`, `ERF-70` and `ERF-71` — the whole verifiability chain — hang off
source entries that nothing requires a store to return intact.

## Measured, not argued

A store round-tripping a citation returned `chapter-number: 36.0` for
`chapter-number: 36`. `ERF-8` says the citation block "MUST carry everything
the rendered `citation_text` string shows" and that `citation_text` "MUST be
rendered from it". That store has broken the canonical field and still
claims `ERF-53` conformance, correctly.

## Candidate resolution, not ruled

Widen `ERF-53` from "every record" to every file the corpus holds, which is
the same widening `ERF-54` already made for `type`. The two rulings would
then agree about what a corpus consists of.

## Resolution

Ruled 2026-08-25. `ERF-53` now reads "every file the corpus holds", the
same widening `ERF-54` made for `type`, and says why: the source list is
the verifiability chain and is not a record. Loss is defined against the
model instance rather than against YAML bytes, which closes `B-40` with the
same sentence and means no binding is the definition of equivalence.
