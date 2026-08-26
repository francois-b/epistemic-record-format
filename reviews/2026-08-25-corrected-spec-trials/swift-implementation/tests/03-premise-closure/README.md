# 03-premise-closure

Exercises **ERF-43** (premise closure, cycle prohibition over the oriented
premise relation, self-edges, non-argument leaves, retired leaves, termination)
and **ERF-49** (unbacked flags).

| case | shape | expected |
|:--|:--|:--|
| `c1-*` | argument assumes an observation | clean |
| `c2-*` | `X assumes Y`, `Y supports X` -- the literal configuration ERF-43's cycle clause names | **not a cycle** under ERF-24's orientation: two edges asserting the same premise. See ambiguities.md ERF-43 #1 |
| `c2b-*` | `M assumes N`, `N assumes M` | ERF-43 violation: a real cycle |
| `c3-*` | `P supports Q`, `Q supports P` | ERF-43 violation: the named runaway-traversal case |
| `c4-self` | `S assumes S` | ERF-43 violation: self-edge (and a cycle) |
| `c5-*` | closure ends in an argument with no premises | ERF-43 violation: leaf is an argument |
| `c6-*` | closure ends in a leaf whose disposition is `retired` | ERF-43 **flag**, not violation |
| `c7-*` | `decomposes-into` cycle | ERF-43 violation |
| `c8-*` | diamond | clean; proves the visited-set terminates without false cycles |
| `c9-*` | a premise cycle between two **observations**, reached by no argument | reading-dependent, see ambiguities.md ERF-43 #2 |
| `c10-bare` | argument with no premises | clean under ERF-43 (empty closure), no ERF-49 flag since nobody stands on it |
