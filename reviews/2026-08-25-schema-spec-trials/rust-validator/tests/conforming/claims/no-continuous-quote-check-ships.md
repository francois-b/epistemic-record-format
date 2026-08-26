---
id: no-continuous-quote-check-ships
type: claim
corpus: ledger-discipline
title: "No shipped knowledge-management tool re-runs a verbatim quote check
  against a held copy of the source on every read."
epistemic_kind: observation
created: {timestamp: "2026-08-22", by: "human:fb"}
surveys: [continuous-quote-check-2026-08-22]
edges:
  - {to: vendor-reconciliation-is-sound, relation: conflicts-with}
standings:
  - timestamp: "2026-08-23T08:02:00-05:00"
    stance: for
    by: "human:fb"
    why: "Read as scoped, not as proved: the survey's two acts cover the
      indexes named there and nothing wider, and within that scope the yield
      was nil."
    evidence_at_stance: {atoms_for: [led-003]}
  - timestamp: "2026-08-23T11:40:00-05:00"
    stance: against
    by: "human:mn"
    why: "The scope is a private working collection, so an absence in it says
      something about its curation and close to nothing about the world. I
      do not think the claim as titled is carried."
    evidence_at_stance: {atoms_for: [led-003]}
evidence_audit:
  - {auditor: deepseek-v4-pro, verdict: PARTIAL, timestamp: "2026-08-23",
     protocol: backing-audit-v1}
---
No shipped knowledge-management tool re-runs a verbatim quote check against a held copy of the source on every read.

## Working notes

A universal negative, so it is audited as scoped rather than as proved
(`ERF-25`). The survey record carries the coverage bounds; the title does
not, which is the objection the `against` standing makes.
