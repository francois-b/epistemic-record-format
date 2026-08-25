---
id: granted-flag-uses-2026-08-24
type: survey
corpus: erfx-v5
title: "Uses of a standalone x_embargo_until field across the seven
  registered corpora's declarations"
conducted: {timestamp: 2026-08-24, by: "agent/claude-fable-5"}
searches:
  - tool: "grep -rn (BSD grep, macOS)"
    query: "^x_embargo_until:"
    scope: "all declaration.yaml files across the seven registered
      corpora; 7 files"
    hits_reported: "0"
  - tool: "grep -rn (BSD grep, macOS)"
    query: "embargo (word-level, --include=*.yaml)"
    scope: "same seven declaration.yaml files, whole-file text search"
    hits_reported: "0"
---
Checked whether any of the seven registered corpora had already
adopted an embargo-style extension field on their declarations, under
either the exact key or the bare word. Neither search returned
anything; the corpus is closed (seven declared corpora, fully
enumerable), so absence here is conclusive per the closed-corpus
reading and there is nothing further to state about coverage bounds.
`notable_results` is correctly omitted (ERF-55): the yield was empty at
every act.
