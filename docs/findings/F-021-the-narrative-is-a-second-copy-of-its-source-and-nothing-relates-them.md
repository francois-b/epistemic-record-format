---
id: F-021
raised:
  by: "the top-down essay corpus trial, 2026-08-25"
  on: 2026-08-25
  observation: "In a corpus whose subject is one document, the narrative holds the essay's prose and the source list holds the same prose as normalized text; no rule relates the two, so the narrative can drift from the source it was minted from"
basis: demonstrated
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "schema Narrative (ERF-34 is retired), ERF-32, ERF-1"
  claim: >
    The Narrative definition has no field relating a narrative to a source,
    so in a corpus whose narrative is copied from a source's normalized
    text nothing can detect the two diverging, and nothing can tell an atom
    quoting the narrative's own source from independent backing.
verifications: []
outcome: promoted
promoted_to: "B-61"
---

# F-021 · The narrative is a second copy of its source, and nothing relates them

The quote check runs against the normalized text; the anchor check runs
against the narrative; `ERF-32` detects a claim moving under a binding.
Nothing detects the narrative drifting from the source it was written
from, which in the top-down case is the same text held twice. The trial
generated the narrative byte-for-byte from the normalized text, a tool
discipline the format does not require.

## Candidate resolutions, none ruled

- A narrative MAY declare a source it is a copy of, and a validator flags
  divergence under the fold.
- Say that in the top-down case the narrative is the source, and hold it
  once.
