---
id: mixed-precision-is-unorderable
type: claim
corpus: relational-trial
title: "Two timestamps recorded at different precisions on the same day cannot be ordered, so a format that permits both must say which way the comparison fails"
epistemic_kind: observation
created: {timestamp: "2026-07-30", by: agent/claude-fable-5}
families: [time]
atoms_for: [rt-006]
standings:
  - timestamp: "2026-08-23T10:05:00Z"
    stance: for
    by: human:trial-reviewer
    why: "Straightforward from the atom, and the format already agrees with it in one place by resolving the ambiguous case to stale."
    evidence_at_stance: {atoms_for: [rt-006]}
semantic_query: timestamp precision date instant same day ordering ambiguity
---
Two timestamps recorded at different precisions on the same day cannot be ordered, so a format that permits both must say which way the comparison fails.

## Working notes

The format resolves it for staleness and leaves it open for the ordering of a
standings ledger, which is why the ledger is the one place a full instant is
mandatory.
