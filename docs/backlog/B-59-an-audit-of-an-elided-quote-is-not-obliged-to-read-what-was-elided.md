---
id: B-59
kind: defect
status: open
priority: P2
priority_because: "The one check that could catch a meaning-inverting elision is not required to look, and the format's own text hands it that judgment. The fix is an auditor duty under ERF-11 or ERF-24, non-breaking: no record changes, no verdict already on file is invalidated, and audits under a new protocol version are not read as like for like anyway."
basis: demonstrated
raised: "F-017, the cold Rust validator trial, 2026-08-25: `The board did [...] approve the acquisition.` passes against `The board did not approve the acquisition.`; verified against the reference and listed in rust-triage.md as the one fabrication of twenty-one that is neither stopped nor by design"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-017; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-59 · An audit of an elided quote is not obliged to read what was elided

`ERF-52` (the elision marker) says the text between two spans is unbounded
by design and that "whether the removal misleads is a judgment for the
audit, not a distance a validator can measure". The trial built the case
that sentence contemplates: `The board did [...] approve` against a source
saying `The board did not approve`. Every mechanical condition holds and
the check is green.

The sentence hands the judgment to the audit, and neither `ERF-11` (the
finding audit asks whether the quote, in context, supports the finding)
nor `ERF-24` (the backing audit) requires the auditor of an atom carrying
`[...]` to read the elided span in the normalized text. An auditor shown
the quote and the finding alone cannot see that the marker hides `not`,
and the protocol that produced the verdict is not required to have shown
more. The one check that could catch a fabricated meaning is not obliged
to look.

## Proposed resolution

One of:

- `ERF-11` or `ERF-24`: an audit of an atom whose quote carries `[...]`
  MUST read the elided span in the normalized text, and its verdict covers
  what was removed. The protocol version records that it did.
- A validator flags every atom carrying an elision as needing a
  source-reading audit, so the obligation is visible without being a rule
  on the auditor.
- Leave it, on the argument that a misleading elision is a judgment
  failure attributable to the author like any other.

Related: `B-57` (an elision that steps over apparatus asserts nothing).
