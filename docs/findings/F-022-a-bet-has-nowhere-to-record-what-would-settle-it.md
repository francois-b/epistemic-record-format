---
id: F-022
raised:
  by: "the top-down essay corpus trial, 2026-08-25"
  on: 2026-08-25
  observation: "Section 4.3 puts a bet's resolution criterion in the why of a standing, and a corpus that takes no standings, which is what ERF-21 requires of an LLM building for a person, has no slot for it"
basis: demonstrated
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "section 4.3 (ERF-21 is retired; the human-only stance is the schema's StandingEntry.by)"
  claim: >
    Section 4.3 names a home for a bet's decision and outcome (the `why` of
    two standings) and none for its resolution criterion, and the home it
    names is a standing, which the schema restricts to a human, so a
    proposal-only corpus has no slot for what would settle a bet.
verifications: []
outcome: promoted
promoted_to: "B-62"
---

# F-022 · A bet has nowhere to record what would settle it

Section 4.3: the decision a bet licenses goes in the `why` of the `for`
entry that backs it, and the outcome in the `why` of the `withdrawn` entry
that ends it. Both are standings, and `ERF-21` forbids the LLM that built
the corpus from writing one. The essay's four bets are the claims whose
value depends on a resolution criterion, and the trial put each criterion
in working notes, where no requirement makes anyone look.

## Candidate resolution, not ruled

A bet carries `settles_by` (a date) and `settled_when` (prose) on the
record, written at minting, so the criterion exists before anyone stands.
