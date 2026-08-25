---
id: survey-with-no-date-suffix
type: survey
corpus: broken-corpus
title: "A survey whose acts state precision the instrument did not give"
conducted: {timestamp: "2026-05-04", by: "agent/claude-fable-5"}
prior_survey: brk-001
searches:
  - query: "an act with no instrument named"
    hits_reported: 0
  - tool: "grep -rn (BSD grep, macOS)"
    query: "controls"
    hits_reported: "4 lines in 3 files"
    timestamp: "2026-05-04"
notable_results:
  - what: "A near miss"
    note: "Fell short because it quotes a summary, not the source."
    atoms: [brk-999]
---
