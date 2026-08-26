---
id: continuous-quote-check-2026-08-22
type: survey
corpus: ledger-discipline
title: "Shipped tools that re-run a verbatim quote check against a held copy
  of the source"
conducted: {timestamp: "2026-08-22", by: "human:fb"}
searches:
  - tool: "rg 13.0.0 (ripgrep, macOS)"
    query: "quote.?check|verbatim.?check|source.?fidelity"
    scope: "a private working collection of forty-one knowledge-management
      repositories held locally"
    hits_reported: "0"
    timestamp: "2026-08-22"
  - tool: "manual review of vendor documentation pages, one reader"
    query: "the documentation sites of nine knowledge-management vendors,
      read in full for any check that runs against a stored source text"
    hits_reported: "3 pages mentioning citation checking; none re-running a
      check against a held copy"
    timestamp: "2026-08-22"
notable_results:
  - what: "One vendor's citation linter"
    note: "Checks that a citation resolves to a reachable URL, which is a
      liveness check on the locator and not a fidelity check on the text.
      A near miss: it is the check this claim says nobody ships, run against
      the wrong thing."
---
What was sought: a shipped tool that holds a copy of a source and re-checks
quoted text against it, rather than checking that a link still resolves.

Coverage bounds. The first act searched a private local collection, so an
absence in it says something about that collection's curation and close to
nothing about the world. The second act read nine vendors' public
documentation, which is what those vendors chose to publish and not what
their products do. Neither act touched a shipped binary.

What surprised me: every hit was a liveness check. Nobody in this sample
treats the source text as the thing to be checked.

What I would search differently: the release notes rather than the marketing
documentation, and the issue trackers rather than either.
