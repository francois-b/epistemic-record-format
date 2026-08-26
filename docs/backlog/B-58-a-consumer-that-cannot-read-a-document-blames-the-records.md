---
id: B-58
kind: defect
status: open
priority: P2
priority_because: "A fidelity rule on what a consumer reports, non-breaking to add, and the format states three narrower instances of it already (ERF-31, ERF-33, ERF-57). It does not block publication: no record changes and no two implementations disagree about conformance, only about how they report one unreadable file."
basis: demonstrated
raised: "F-006, split from F-003 on the specify gate's advice, 2026-08-25: the reference loader before its fix and the cold Rust validator both reported one unreadable source list as 151 atoms naming sources that do not exist"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-006; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-58 · A consumer that cannot read a document reports its failure as findings against the records that depend on it

Twice on 2026-08-25 an implementation failed to make sense of one
structural document and reported the failure as hundreds of defects in
unrelated records. The reference loader, before it was fixed, skipped a
source list carrying no `type` and reported 151 atoms as naming sources
the corpus does not hold. The cold Rust validator, reading the same corpus
after `type: sources` was added, reported the source list as two malformed
entries and then the same 151 atoms the same way. One file was wrong; 151
correct records were accused.

The nesting ambiguity that produced the first instance is gone (schema
`SourceList`, binding section 1). The failure mode is not about nesting.
A reader given 151 findings does not look for one unreadable file.

Section 1 says what a consumer rule may say: "do not misrepresent what a
record says" is in scope. The format states this shape three times without
generalizing it: `ERF-31` (a candidate failing the binding grammar is
reported, not skipped), `ERF-33` (a binding whose id resolves to nothing
is reported, never dropped), `ERF-57` (unknown content is preserved and
reported). Each says: report the thing you could not handle, at the thing
you could not handle. Nothing says it for a document a consumer recognizes
by `type` and cannot interpret.

## Proposed resolution

A fourth instance, as one sentence under `ERF-54` or `ERF-57`: a consumer
that cannot interpret a document it recognizes MUST report that document,
and MUST NOT report its own failure as findings against the records that
depend on it. Whether it earns a number or sits as guidance under section
1 is the ruling.
