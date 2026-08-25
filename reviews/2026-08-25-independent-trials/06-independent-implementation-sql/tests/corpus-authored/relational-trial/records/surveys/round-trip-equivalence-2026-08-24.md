---
id: round-trip-equivalence-2026-08-24
type: survey
corpus: relational-trial
title: "Whether the specification anywhere states the equivalence relation under which a record round-trips without loss"
conducted: {timestamp: "2026-08-24", by: "agent/claude-fable-5"}
searches:
  - tool: "grep -nE (BSD grep, macOS 15)"
    query: "round-trip|round trip|without loss|lossless"
    scope: "SPEC.md, whole file, 1292 lines"
    hits_reported: "3 lines; one normative (ERF-53), two in prose about substrates"
  - tool: "grep -nE (BSD grep, macOS 15)"
    query: "byte-identical|byte identity|canonical form|equivalence"
    scope: "SPEC.md, whole file"
    hits_reported: "0 for the first three; 'canonical' occurs 4 times, always of the interchange form or of a citation block"
    timestamp: "2026-08-24"
  - tool: "manual reading"
    query: "sections 7 and 8 read end to end for a definition of loss"
    scope: "SPEC.md lines 1101-1206"
    hits_reported: "no definition found"
notable_results:
  - what: "ERF-53's proviso"
    note: "The only place the property is asserted. It names the interchange form but not what it means for two files to carry the same record."
    atoms: [rt-005]
  - what: "ERF-55 and ERF-56 together"
    note: "The nearest thing to an equivalence: an omitted list and an empty list are the same record. Stated for lists only, and never generalized."
prior_survey: lossless-language-2026-08-22
---
The survey was run to find out whether ERF-53's proviso is checkable as
written. It is not, in the sense that nothing states which of the three
candidate equivalences applies.

## Coverage bounds

The universe is one document, searched completely, so the absence is
conclusive for that universe and says nothing about the companion documents
(`DESIGN-HISTORY.md`, `CHANGELOG.md`) which were not held.
