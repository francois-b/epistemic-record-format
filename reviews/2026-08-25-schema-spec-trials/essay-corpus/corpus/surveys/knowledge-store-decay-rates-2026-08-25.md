---
id: "knowledge-store-decay-rates-2026-08-25"
type: "survey"
corpus: "epistemology-llm-era"
title: "Measured decay rates for CRMs and enterprise knowledge stores, and what causes the decay"
conducted:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
searches:
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "CRM data decay rate per year contact records go stale study"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "10 result links returned; the instrument reports no total and no count; 9 of the 10 are pages published by companies selling data enrichment or CRM hygiene services"
    timestamp: "2026-08-25"
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "Guru card verification knowledge management trust verified expire"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "8 result links returned; the instrument reports no total and no count"
    timestamp: "2026-08-25"
notable_results:
  - what: "Decay figures exist and every one of them is published by an interested party"
    note: "The range returned spans 22.5 to 70 percent a year and the spread is explained by field type. Not one figure in the results came from a disinterested source; the survey is therefore evidence that the number is unestablished rather than evidence for any number in it."
    atoms:
      - "ell-162"
  - what: "The cause given is the world moving, not the operator failing to type"
    note: "Cuts against the essay's diagnosis. The decay literature attributes contact-record decay to job changes and email churn, that is, to facts about the world changing under a record that was correct when written."
    atoms:
      - "ell-163"
  - what: "Guru's own figure for verification reach"
    note: "Manual verification typically reaches 8 to 12 percent of organizational content, per the vendor. If true it is strong support for the essay's staleness claim about enterprise knowledge stores, and it is a vendor's own number for the problem it sells against."
    atoms:
      - "ell-164"
      - "ell-165"
---

What was sought: measured decay rates for CRMs and enterprise knowledge
stores, and the mechanism behind the decay, against the essay's claim that
both decay because they must be maintained by hand.

What was found: figures in abundance and disinterested figures nowhere. The
mechanism the sources give for CRM decay is not the one the essay gives:
records go wrong because people change jobs and email addresses, which is
the world moving under a record that was correct when written. Hand
maintenance is the remedy those sources describe, not the cause.

For enterprise knowledge stores the essay fares better. Guru's own
documentation says manual verification reaches a tenth of organizational
content, and both Guru and Notion have built expiry-and-renotify machinery,
which is what a vendor builds when staleness is the default.

Coverage bounds: two acts, no academic search, no analyst report, and a
result set dominated by parties selling the remedy. This survey should be
read as a map of who is talking rather than as a measurement.
