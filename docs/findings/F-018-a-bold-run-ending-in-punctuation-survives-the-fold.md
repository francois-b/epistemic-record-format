---
id: F-018
raised:
  by: "the top-down essay corpus trial, 2026-08-25"
  on: 2026-08-25
  observation: "A closing emphasis run between a full stop and a space has no word character on either side, so step 2 keeps it and an honest quote copied from the rendered essay fails"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: "ERF-51"
  claim: null
verifications: []
outcome: open
---

# F-018 · A bold run ending in punctuation survived the fold

`- **Epistemic types for text.** Mainstream tools file text by subject`
folded to `Epistemic types for text.** Mainstream tools`, and the quote
`Epistemic types for text. Mainstream tools file text by subject`, copied
from the rendered page, returned VIOLATION with a diagnostic that never
mentioned emphasis. The rule flanked on word characters; the closing run
sits between `.` and a space. Verified against the reference.

## Resolution

Ruled 2026-08-25: the run is a delimiter when whitespace or a text boundary
sits on exactly one side, and text when non-whitespace sits on both
(`MAX_LEN`, `3*4`, `12*.*5`) or whitespace on both (`a * b`). Measured
before committing across every corpus. Two cases pin it.
