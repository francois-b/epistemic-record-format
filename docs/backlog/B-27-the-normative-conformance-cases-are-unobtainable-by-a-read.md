---
id: B-27
kind: defect
status: contested
priority: P3
contested_because: >
  Stale at HEAD: the case files are no longer normative, so a reader of
  the specification alone is not missing anything that binds. What remains
  is the publication-checklist line the entry's own priority_because named.
priority_because: "Publishing the repository ships the normative case files by construction; what remains is a publication-checklist line, not a spec defect (both reviewers)."
basis: reported
raised: "trial 1 friction 31, 2026-08-25 (S6)"
verifications:
  - by: "agent/claude-opus-5, verification pass"
    on: 2026-08-25
    verdict: accurate
  - by: "claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: stale
    note: >
      The clause that made the case files normative where prose and case
      disagree was removed on 2026-08-26; the preamble closes the normative
      surface at three documents and names the suite as an instrument.
---

# B-27 · The normative conformance cases are unobtainable by a reader of the specification alone

`ERF-51` declares the conformance case files normative where prose and case disagree, but they live in the repository, not the document. Every trial that implemented normalization had to do so blind and then reimplement the sequence to self-check.

## Proposed resolution

Say where the normative cases live, and decide what ships with a published specification.

## Consolidation note (2026-08-26)

The defect was that `ERF-51` declared repository files normative and a
reader of the document could not obtain them. At HEAD the preamble reads:
"What is normative. Three things, and nothing else: this document; the
data model, `erf.schema.json`; and a binding document", and "the
conformance suite and its case files ... is an instrument or a record and
binds nothing." `ERF-51` now says: "The conformance suite carries case
files for this sequence; they test an implementation and bind nothing,
since the standards named here do." A reader implementing the fold from
the document alone has the four cited standards, which is the whole rule.
Whether the case files ship beside a published specification is a
publication decision, as the entry's own priority note already said, and
not a defect in the text.
