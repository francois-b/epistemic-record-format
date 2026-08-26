---
id: B-41
kind: defect
status: contested
priority: P3
contested_because: >
  Stale at HEAD: ERF-73 is the number. Every shape obligation a trial
  cited a section for now cites one requirement.
priority_because: "Section 1 already binds the Record class to the data model, and ids append by design, so numbering later is free (both reviewers)."
basis: demonstrated
raised: "trial 5 (Rust), 2026-08-25"
verifications:
  - by: "claude-opus-5, independent verification of the nine"
    on: 2026-08-25
    verdict: accurate
    note: "confirmed: the Record class binds section 3 but no ERF number requires a field to be present, and the reference says so about itself in a comment."
  - by: "raised by the verification pass itself"
    on: 2026-08-25
    verdict: unverified
    note: "raised while verifying the queue; needs a check by someone who did not raise it"
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: stale
    note: >
      ERF-73 (2026-08-26) makes schema validation a numbered MUST, so a
      missing required field, a malformed actor and every other shape rule has
      a requirement number to cite.
---

# B-41 · Basic rules have no requirement number to cite

No numbered requirement covers a missing required field, and none covers the actor grammar, so roughly a third of trial 5's violations cite a section rather than a requirement. A reader auditing coverage by walking `ERF-1` through `ERF-72` would conclude the specification is fully covered while missing "every record has an `id`".

## Proposed resolution

Either number the data model's own obligations, or state in section 1 that the data model binds independently and section 3 is citable as such.

## Consolidation note (2026-08-26)

The entry's two examples were a missing required field and the actor
grammar. At HEAD both are the schema's, and `ERF-73` reads: "Every
document a corpus holds MUST validate against `erf.schema.json`, with its
body attached as `body` where the model has one ... This is the whole of
the format's shape". A validator reporting "every record has an `id`"
cites `ERF-73` and the definition (`Atom.required`), which is one number
and one pointer rather than a section. The alternative the entry offered,
"state in section 1 that the data model binds independently", is what
section 3 now says of the schema. Marked contested for disposal.
