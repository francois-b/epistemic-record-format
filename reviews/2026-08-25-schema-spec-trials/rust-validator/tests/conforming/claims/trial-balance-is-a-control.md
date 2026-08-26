---
id: trial-balance-is-a-control
type: claim
corpus: ledger-discipline
title: "The trial balance is a control and not a proof: it establishes that
  the books are internally consistent, never that they are true."
epistemic_kind: argument
created: {timestamp: "2026-08-20", by: "human:fb"}
edges:
  - {to: every-entry-is-made-twice, relation: assumes}
standings:
  - timestamp: "2026-08-21T09:31:00-05:00"
    stance: for
    by: "human:fb"
    why: "Granting both premises, the conclusion follows: a check that both
      sides agree cannot distinguish two compensating errors from none."
    evidence_at_stance: {atoms_for: [led-001, led-002, led-003]}
---
The trial balance is a control and not a proof: it establishes that the books are internally consistent, never that they are true.

## Working notes

Premises arrive from both sides of the graph: this claim assumes the
double-entry rule, and `ledger-parity-detects-error` supports it. Both are
observations, so the closure terminates in non-argument leaves.
