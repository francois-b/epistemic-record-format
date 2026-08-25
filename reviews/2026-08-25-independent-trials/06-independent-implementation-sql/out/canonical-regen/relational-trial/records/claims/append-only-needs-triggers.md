---
id: append-only-needs-triggers
type: claim
corpus: relational-trial
title: "An append-only rule can only be enforced in a relational store by refusing UPDATE and DELETE procedurally, never by a column type or a check"
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: agent/claude-fable-5}
families: [schema-expressiveness, append-only]
atoms_for: [rt-002]
atoms_against: [rt-007]
standings:
  - timestamp: "2026-08-23T09:25:00Z"
    stance: for
    by: human:trial-operator
    why: "Writing the schema produced the evidence: every append-only rule in the format became a BEFORE UPDATE trigger and none of them could be stated as a constraint."
    evidence_at_stance: {atoms_for: [rt-002], atoms_against: [rt-007]}
  - timestamp: "2026-08-24T11:00:00Z"
    stance: against
    by: human:trial-reviewer
    why: "Too strong as stated. A generated column over a history table, or a view with an INSTEAD OF trigger, moves the enforcement without making it procedural in the sense the title implies."
    evidence_at_stance: {atoms_for: [rt-002], atoms_against: [rt-007]}
evidence_audit:
  - {auditor: fixture-auditor-a, verdict: PARTIAL, timestamp: "2026-08-24", protocol: evidence-audit-v1}
semantic_query: append only enforcement trigger update delete refuse relational
---
An append-only rule can only be enforced in a relational store by refusing UPDATE and DELETE procedurally, never by a column type or a check.

## Working notes

Recorded as contested on purpose: the reviewer's objection is on record and
the disposition reads `contested` rather than being resolved by counting.
