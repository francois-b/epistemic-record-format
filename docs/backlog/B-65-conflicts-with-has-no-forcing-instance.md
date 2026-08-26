---
id: B-65
kind: defect
status: open
priority: P2
priority_because: "If the ruling retires the relation, that is a breaking change to the vocabulary, free before publication and a migration after, which is the README's P1 test; one corpus and one producer are a thin basis for retiring anything, which is why it is not P1. Ruling it before the push costs a look; ruling it after costs a major."
basis: demonstrated
raised: "F-027, the Bitter Lesson closed-loop trial, 2026-08-26: 32 claims built to search for the opposite of each, 18 carrying atoms_against, and conflicts-with never once the honest choice"
verifications:
  - by: "none yet; specified at gate 2 by claude-fable-5, consolidation pass 2026-08-26"
    on: 2026-08-26
    verdict: unverified
    note: "promoted from F-027; needs a check by a hand that neither raised nor specified it"
generated: 2026-08-26
model: claude-fable-5
---

# B-65 · `conflicts-with` has no forcing instance

`ERF-23` routes evidence against a claim to `atoms_against` and forbids
modelling it as a rival claim; section 5 reserves `conflicts-with` for
"mutual tension; both stand"; `ERF-44` says it is stored once per pair.
In a corpus built to exercise disagreement, every disagreement was
evidence and none was a rival claim, so the edge was never written.

Checked at HEAD: no live corpus in this repository (the example corpus,
the capex and essay corpora, the Bitter Lesson corpus) carries a
`conflicts-with` edge; the only occurrences are validator test fixtures
built to exercise `ERF-44`. The backlog's own rule is that a field earns
its place by a demonstrated need. This one has a definition, a storage
rule and a conformance case, and no instance.

The finding's own caution stands: one corpus and one producer do not
settle it, and the case the relation was written for (two stood-on claims
that cannot both hold, in a corpus with standings) is one a proposal-only
corpus cannot meet. It is raised so the question is on record before the
vocabulary is published, not because the answer is known.

## Proposed resolution

Either keep it and say in section 5 what a rival claim is that evidence
against is not, so a producer can tell when it is the honest choice; or
retire the relation and let two claims disagree through their evidence,
which is a vocabulary change and belongs before 0.9.0 ships if it happens
at all.
