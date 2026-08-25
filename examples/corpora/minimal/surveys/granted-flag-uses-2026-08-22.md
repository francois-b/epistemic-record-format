---
id: granted-flag-uses-2026-08-22
type: survey
corpus: erf-example
title: "Current uses of the granted field across the registered corpora"
conducted: {timestamp: 2026-08-22, by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rnE (BSD grep, macOS)"
    query: "^granted:|^  granted:"
    scope: "every claim and question file in a private working collection
      of corpora"
    hits_reported: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "granted (word-level, --include=*.md)"
    scope: "the same claim and question files"
    hits_reported: "4 lines in 3 files; none a field use"
  - tool: "grep -l (BSD grep, macOS)"
    query: "granted"
    scope: "every atom record in the same collection"
    hits_reported: "0 files"
notable_results:
  - what: "A doc-class granted dimension in a corpus's own documentation"
    note: "One corpus's own documentation describes a document-class field
      `granted: true`; a render-layer dimension of that document class, and
      the word's nearest live relative."
  - what: "A grant rationale surviving as prose"
    note: "One claim's working notes carry a grant rationale in prose
      ('hence granted, burden on the challenger'); the field itself no
      longer appears on any record."
  - what: "Ordinary English"
    note: "One record uses the word in its everyday sense
      ('access granted'); not a field."
---

Current uses of the granted field across the registered corpora: zero. The
key-position probe over every claim and question file returns no hits; the
word-level probe returns four lines in three files, each a documentation
mention, a prose rationale, or ordinary English rather than a field use;
the atom records contain the word nowhere.

**Coverage bounds.** None exist, and correctly so: the searched universe is
the claim's universe (the registered corpora themselves), and the probes are
complete over it. Absence here is conclusive, not
defeasible. Anyone holding the corpus can re-run the three probes and
falsify this record.
