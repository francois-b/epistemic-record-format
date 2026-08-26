---
id: F-025
raised:
  by: "the Bitter Lesson closed-loop trial, 2026-08-26"
  on: 2026-08-26
  observation: "every essay assertion needed an atom saying the essay asserts it, ERF-10 grades such a discourse atom high, and at the claim level one high atom for and nine against reads as a contest when the one for is only evidence that the author said it"
basis: demonstrated
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "ERF-10, ERF-23, schema Narrative"
  claim: >
    ERF-10 correctly grades a recorded identified utterance high, and
    nothing in the model can mark an atom as the proponent's own statement
    or flag a claim whose only atoms for quote the narrative's source,
    because no field says which source that is.
verifications: []
outcome: closed
resolution_note: >
  Absorbed into B-61 with F-021. The flag this finding asks for (a claim
  whose every atom for comes from the narrative's own source) is decidable
  only once a narrative can name its source, which is F-021's gap; the two
  are one missing field seen from two sides, and the craft-guidance
  fallback this finding also offers is recorded in B-61 as the alternative.
  Checked at HEAD before closing: the Narrative definition carries `type`,
  `title`, `corpus`, `created`, `body` and nothing relating it to a source.
---

# F-025 · An atom recording the proponent's own assertion reads as backing

A top-down corpus over an essay binds the essay's passages to claims. Each
claim then wants an atom that records the essay asserting it, otherwise the
binding points at a claim with no trace of its origin. `ERF-10` says a
finding whose subject is discourse must say so, and the utterance is then
the substance: a recorded identified utterance is direct and accountable,
so all 27 atoms quoting Sutton are `high`, correctly.

At the claim level the arithmetic misleads. The claim that Deep Blue was
simpler than its knowledge-based rivals shows one `high` atom for and nine
against, four of them `high`. The one for is high-grade evidence that
Sutton said it and no evidence that it is true. Nothing in the model marks
an atom as "the proponent's own statement", and nothing flags a claim whose
only atoms for quote the source the claim was read out of.

## Candidate resolutions, none ruled

- Craft guidance only: a discourse atom's finding must say "X asserts",
  and a reader is expected to read findings, not count grades.
- A computed flag: a claim whose every atom for comes from the narrative's
  own source. Decidable once a narrative names its source, which it does
  not today (F-021).
