---
id: erfx-v6-2c
type: claim
corpus: erfx-v6
title: "A survey enumerating an extension field's use across every
  registered corpus, as in erfx-v5-1s, counts as a complete
  closed-corpus search"
epistemic_kind: argument
created: {timestamp: 2026-08-24, by: "agent/claude-fable-5"}
edges:
  - to: erfx-v6-1c
    relation: assumes
---
A survey enumerating an extension field's use across every registered
corpus, as in erfx-v5-1s, counts as a complete closed-corpus search.

## Working notes

This argument owes no atoms of its own (`atoms_for`/`atoms_against`
correctly absent): per ERF-24, an argument's backing is the premises
reached through its own outgoing `assumes` edges plus any incoming
`supports` edges, not a direct evidence list. Its one premise is
`erfx-v6-1c`, a non-argument (`observation`) leaf, so the closure
(ERF-43) terminates in a non-argument leaf after a single hop: no
cycle, no self-edge, and the leaf's disposition is not `retired` (it
has no standings at all yet, so it reads as `proposal`), so ERF-43's
retired-leaf flag does not apply either.
