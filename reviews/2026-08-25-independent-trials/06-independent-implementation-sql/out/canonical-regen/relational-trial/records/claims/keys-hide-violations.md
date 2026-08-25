---
id: keys-swallow-the-violations-they-enforce
type: claim
corpus: relational-trial
title: "Enforcing an invariant as a database key removes a validator's ability to report violations of it, because a violating corpus cannot be stored"
epistemic_kind: argument
created: {timestamp: "2026-08-23", by: agent/claude-fable-5}
families: [schema-expressiveness, validation]
edges:
  - {to: constraints-cannot-see-transitions, relation: assumes}
  - {to: append-only-needs-triggers, relation: conflicts-with}
standings:
  - timestamp: "2026-08-24T17:10:00Z"
    stance: for
    by: human:trial-operator
    why: "Demonstrated in this trial: the loader aborts on a duplicate id instead of producing the report ERF-38 asks a validator for."
evidence_audit:
  - {auditor: fixture-auditor-a, verdict: SUPPORTED, timestamp: "2026-08-24", protocol: evidence-audit-v1}
semantic_query: primary key uniqueness validator report unstorable violation
---
Enforcing an invariant as a database key removes a validator's ability to report violations of it, because a violating corpus cannot be stored.

## Working notes

Premise on the graph: `constraints-cannot-see-transitions` by an outgoing
`assumes` edge. The `conflicts-with` edge to `append-only-needs-triggers`
records tension rather than a premise.
