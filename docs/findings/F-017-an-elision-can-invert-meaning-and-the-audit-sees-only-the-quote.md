---
id: F-017
raised:
  by: "Rust validator trial, 2026-08-25 schema-spec trials"
  on: 2026-08-25
  observation: "`The board did [...] approve the acquisition.` passes against `The board did not approve the acquisition.`; the mechanical check catches a fabricated string and cannot catch a fabricated meaning"
basis: demonstrated
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "ERF-52, ERF-11, ERF-24"
  claim: >
    ERF-52 assigns the judgment of whether an elision misleads to the
    audit, and neither ERF-11 nor ERF-24 requires the auditor of an atom
    whose quote carries `[...]` to read the elided span in the normalized
    text, so the only check that could catch a meaning-inverting elision
    is not obliged to look.
verifications: []
outcome: promoted
promoted_to: "B-59"
---

# F-017 · An elision can invert meaning, and the audit sees only the quote

## What was observed

`ERF-52` says the text between two spans is unbounded by design, and that
whether an elision misleads is a judgment for the audit. The trial built
the case the sentence contemplates: `The board did [...] approve` against a
source saying `The board did not approve`. Green.

## Why it may matter

The sentence hands the judgment to the audit, and `ERF-24`'s backing audit
judges the finding against the quote. An auditor who sees the quote and not
the normalized text cannot see that `[...]` hides `not`. Nothing in the
format requires the audit of an atom carrying an elision to consult the
source, so the one check that could catch this is not obliged to look.

## Candidate directions, none ruled

- `ERF-11` or `ERF-24`: an audit of an atom whose quote carries `[...]`
  MUST read the elided span in the normalized text, and its verdict covers
  what was removed.
- A validator flags every atom carrying an elision as needing a
  source-reading audit, so the obligation is visible.
- Leave it, on the argument that a misleading elision is a judgment
  failure attributable to the author like any other.
