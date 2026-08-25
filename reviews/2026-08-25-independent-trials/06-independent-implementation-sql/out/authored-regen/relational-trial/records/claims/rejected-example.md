---
id: path-carries-corpus-membership
type: claim
corpus: relational-trial
title: "A record's corpus membership can be recovered from the directory it sits in, so the corpus field is redundant"
epistemic_kind: observation
created: {timestamp: "2026-08-21", by: agent/claude-fable-5}
families: [interchange]
atoms_against: [rt-005]
standings:
  - timestamp: "2026-08-24T18:20:00Z"
    stance: against
    by: human:trial-operator
    why: "The loader had to report a record whose frontmatter named a corpus other than the directory it was found under, and the record won. Membership is stated, not located."
    evidence_at_stance: {atoms_against: [rt-005]}
x_trial_note: "kept deliberately unbacked on the for side, to exercise the ERF-49 flag"
---
A record's corpus membership can be recovered from the directory it sits in, so the corpus field is redundant.

## Working notes

Rejected on record rather than deleted.
