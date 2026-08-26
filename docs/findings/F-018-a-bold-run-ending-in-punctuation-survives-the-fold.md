---
id: F-018
raised:
  by: "the top-down essay corpus trial, 2026-08-25"
  on: 2026-08-25
  observation: "A closing emphasis run between a full stop and a space has no word character on either side, so step 2 keeps it and an honest quote copied from the rendered essay fails"
basis: demonstrated
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "ERF-51"
  claim: >
    ERF-51's marker rule, as it stood on 2026-08-25, kept an emphasis run
    flanked by punctuation and a space, so an honest quote copied from the
    rendered text failed the fold.
verifications: []
outcome: closed
resolution_note: >
  Stale at HEAD (closed at the consolidation pass, claude-fable-5,
  2026-08-26). The finding records its own ruling of 2026-08-25 (the run is
  a delimiter when whitespace or a text boundary sits on exactly one side),
  and that ruling was itself superseded on 2026-08-26 when the marker rule
  was removed altogether. ERF-51 step 1 at HEAD: "Render the text as
  CommonMark (`ERF-1`, `ERF-67`) to its plain text: the literal content of
  every text and code node", with the rationale "CommonMark decides what is
  markup exactly, where every approximation in prose failed an honest
  quote". A closing `**` before a full stop is emphasis under CommonMark and
  is not text, so the raising case passes by the standard rather than by a
  rule of this format's. The outcome was left open by oversight when the
  ruling was written into the body.
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
