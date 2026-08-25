---
id: constraints-cannot-see-transitions
type: claim
corpus: relational-trial
title: A declarative constraint can express a constraint on a state and cannot express a constraint on a transition between states
epistemic_kind: observation
created: {timestamp: "2026-08-20", by: agent/claude-fable-5}
short_name: state-not-transition
families: [schema-expressiveness]
atoms_for: [rt-001, rt-002]
edges:
  - {to: append-only-needs-triggers, relation: supports}
standings:
  - timestamp: "2026-08-23T09:20:00Z"
    stance: for
    by: human:trial-operator
    why: "The two fixture atoms state it directly and nothing in the corpus cuts against it; the distinction also matched what the schema forced when ERF-19 and ERF-40 had to be written as triggers."
    evidence_at_stance: {atoms_for: [rt-001, rt-002]}
evidence_audit:
  - {auditor: fixture-auditor-a, verdict: SUPPORTED, timestamp: "2026-08-23", protocol: evidence-audit-v1}
semantic_query: declarative constraint state transition prior value not in scope
---
A declarative constraint can express a constraint on a state and cannot express a constraint on a transition between states.

## Working notes

The forcing instance was ERF-19. Append-only is stated as a property of the
ledger, but nothing about a single standing entry is wrong; what is wrong is
the second version of it. A CHECK evaluates one row and cannot see that there
was a first version, so the rule leaves the type system entirely.
