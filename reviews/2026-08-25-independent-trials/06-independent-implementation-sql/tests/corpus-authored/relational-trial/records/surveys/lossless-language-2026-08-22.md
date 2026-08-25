---
id: lossless-language-2026-08-22
type: survey
corpus: relational-trial
title: "First pass over the specification's language about storage substrates and losslessness"
conducted: {timestamp: "2026-08-22", by: "agent/claude-fable-5"}
searches:
  - tool: "grep -n (BSD grep, macOS 15)"
    query: "database"
    scope: "SPEC.md, whole file"
    hits_reported: "4"
notable_results:
  - what: "ERF-63"
    note: "States that a record's body is one more field in a database, which is the only guidance the format gives a relational implementer."
---
A first pass, superseded by `round-trip-equivalence-2026-08-24`.
