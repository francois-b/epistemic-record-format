---
id: granted-flag-uses-2026-08-22
type: survey
corpus: erf-example
title: "Current uses of the granted field across the seven registered
  corpora"
conducted: {timestamp: 2026-08-22, by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rnE (BSD grep, macOS)"
    query: "^granted:|^  granted:"
    scope: "all *.md under the seven registered corpus [private claims dir]/ homes
      ([private registry]); 305 claim and question files"
    hits_reported: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "granted (word-level, --include=*.md)"
    scope: "same seven [private claims dir]/ homes"
    hits_reported: "4 lines in 3 files; none a field use"
  - tool: "grep -l (BSD grep, macOS)"
    query: "granted"
    scope: "the eight registered atom registries ([private registry]);
      741 atoms"
    hits_reported: "0 files"
notable_results:
  - what: "The claims-tree doc-class granted dimension"
    note: "One internal corpus's _claims README documents the doc-class
      field `granted: true` (operator-ratified 2026-08-09); a render-layer
      dimension of that document class, and the word's nearest live
      relative."
  - what: "A grant rationale surviving as prose"
    note: "One internal-corpus claim's working notes carry a grant
      rationale in prose ('hence granted, burden on the challenger'); the
      field itself no longer appears on any record."
  - what: "Ordinary English"
    note: "One confidential-corpus record uses the word in its everyday
      sense ('access granted'); not a field."
---

Current uses of the granted field across the seven registered corpora:
zero. The key-position probe over all 305 claim and question files returns
no hits; the word-level probe returns four lines in three files, each a
documentation mention, a prose rationale, or ordinary English rather than
a field use; the eight atom registries (741 atoms) contain the word
nowhere.

No limitations are recorded, and correctly none exist: the searched
universe is the claim's universe (the registered corpora themselves), and
the probes are complete over it. Absence here is conclusive, not
defeasible. Anyone holding the corpus can re-run the three probes and
falsify this record.
