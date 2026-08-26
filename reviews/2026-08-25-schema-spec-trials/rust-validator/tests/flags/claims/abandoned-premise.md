---
id: abandoned-premise
type: claim
corpus: flagged
title: "A premise every holder has withdrawn from."
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: "human:fb"}
atoms_for: [thin-001]
standings:
  - timestamp: "2026-08-20T09:00:00-05:00"
    stance: for
    by: "human:fb"
    why: "Held at the time."
    evidence_at_stance: {atoms_for: [thin-001], atoms_against: [led-404]}
  - timestamp: "2026-08-24T09:00:00-05:00"
    stance: withdrawn
    by: "human:fb"
    why: "Left it. Not because it was shown false."
    evidence_at_stance: {atoms_for: [thin-001]}
---
A premise every holder has withdrawn from.

## Working notes

`led-404` in the first entry's `evidence_at_stance` resolves to nothing: a
past state, so a flag and not a violation (ERF-35).
