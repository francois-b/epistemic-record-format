---
id: F-019
raised:
  by: "the top-down essay corpus trial, 2026-08-25"
  on: 2026-08-25
  observation: "ERF-69's fidelity check requires the normalized text to occur in the whole extracted source, which a two-passage excerpt never does, so every excerpt is silently one contiguous span"
basis: demonstrated
specified:
  by: null
  on: null
  requirement: "ERF-69, ERF-3"
  claim: null
verifications: []
outcome: open
---

# F-019 · An excerpt must be one contiguous passage, and nothing says so

`ERF-69` permits an excerpt and then requires it to occur, folded, in the
normalization of the whole extracted source. Two passages from different
parts of a work occur nowhere as one string. So an excerpt is one
contiguous span, `ERF-3` forbids two sources over one work, and a reader
wanting paragraph 3 and paragraph 40 must hold the span between them. The
trial's excerpt tool was rewritten to accept exactly one range, and one
source holds 8 KB for two paragraphs.

## Candidate resolutions, none ruled

- Say it: an excerpt is one contiguous passage.
- Define fidelity per passage, with an excerpt allowed to be a sequence of
  passages each of which occurs, in order.
