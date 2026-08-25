---
id: brk-graph-a
type: claim
corpus: broken-corpus
title: "The first claim in a cycle"
epistemic_kind: argument
created: {timestamp: "2026-05-04", by: "agent/claude-fable-5"}
edges:
  - {to: brk-graph-b, relation: assumes}
  - {to: brk-graph-a, relation: supports}
  - {to: brk-graph-retired, relation: assumes}
  - {to: brk-graph-b, relation: conflicts-with}
  - {to: records/claim-graph-b.md, relation: supports}
  - {to: brk-001, relation: assumes}
standings:
  - timestamp: "2026-05-06T09:00:00Z"
    stance: for
    by: "human:fbouet"
    why: "Stood on so ERF-49 and ERF-43 both have something to look at."
---
The first claim in a cycle.
