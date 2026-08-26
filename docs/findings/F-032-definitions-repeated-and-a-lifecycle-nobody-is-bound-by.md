---
id: F-032
raised:
  by: "the four-reader rubric review (Opus, Gemini 3.1 Pro, Gemini 3.5 Flash, GPT-5.6 Sol), 2026-08-26, collated by the session"
  on: 2026-08-26
  observation: "the same definition appears under two or three numbers, and one rule carries a lifecycle clause with no party bound by it"
basis: reported
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "ERF-24, ERF-43, ERF-9, ERF-10, ERF-28, ERF-47, ERF-48, ERF-72, ERF-57"
  claim: >
    The premise definition is stated in three places, ERF-10 restates half
    of ERF-9, ERF-28 restates ERF-47 and ERF-48, ERF-57 restates the
    Consumer class, and ERF-72 carries a lifecycle clause that binds no
    party the format defines; all five are present at HEAD.
verifications: []
outcome: promoted
promoted_to: "B-69"
---

# F-032 · Definitions repeated, and a lifecycle nobody is bound by

- The premise definition (`assumes` out, `supports` in) appears in
  `ERF-24`, again in `ERF-43`, and a third time in section 5's argument
  bullet.
- `ERF-10` is the second half of `ERF-9`'s grading definition under its
  own number (Opus: merge).
- `ERF-28` restates `ERF-47` (staleness computed, never stored) and
  `ERF-48` (an edit stamps `last_modified`).
- `ERF-72` carries a "graduates" lifecycle for `x_` fields that binds no
  producer, validator or consumer; it is advice to a future editor of the
  specification.
- `ERF-57` restates the Consumer conformance class (Opus alone).

Separately, Opus applied the sentence test to the section prose and found
34 paragraphs that assert without a subject, a MUST, or a definition. That
is a prose pass, not a rule change, and is noted here so it is not lost.

## Candidate resolutions, none ruled

State each definition once and cite it; merge `ERF-10` into `ERF-9`; cut
`ERF-28` to what is its own; move `ERF-72`'s lifecycle sentence to change
control; decide whether `ERF-57` says anything the class does not.
