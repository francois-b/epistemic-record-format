---
id: F-027
raised:
  by: "the Bitter Lesson closed-loop trial, 2026-08-26"
  on: 2026-08-26
  observation: "every real disagreement in a 32-claim corpus was recorded as atoms_against under ERF-23, and conflicts-with was never the honest choice; the field may be doing no work"
basis: demonstrated
specified:
  by: "claude-fable-5, consolidation pass 2026-08-26"
  on: 2026-08-26
  requirement: "section 5 relations, ERF-44, ERF-23"
  claim: >
    The conflicts-with relation has a definition, a storage rule (ERF-44)
    and a conformance case, and no live corpus in the repository carries an
    instance of it, the one corpus built to exercise disagreement having
    routed every disagreement to atoms_against under ERF-23.
verifications: []
outcome: promoted
promoted_to: "B-65"
---

# F-027 · `conflicts-with` had no honest use once `atoms_against` existed

`ERF-23` routes evidence against a claim to `atoms_against` and reserves
`conflicts-with` for a rival claim. In a corpus built to search for the
opposite of each of 32 claims, with 18 claims carrying `atoms_against`, the
producer never once found `conflicts-with` the honest choice: every
disagreement was evidence, and writing a rival claim to carry it would have
been modelling evidence as a claim, which `ERF-23` forbids.

This is one corpus and one producer. It is raised because a field that is
never the right choice in a corpus designed to exercise disagreement is
worth a second look, not because one trial settles it.

## Candidate resolutions, none ruled

- Keep it; a rival claim is a real thing (two stood-on claims that cannot
  both hold), and a proposal-only corpus would not meet the case.
- Retire the edge and let two claims disagree through their evidence.
