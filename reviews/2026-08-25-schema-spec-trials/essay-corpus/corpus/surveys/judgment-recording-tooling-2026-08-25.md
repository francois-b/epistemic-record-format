---
id: "judgment-recording-tooling-2026-08-25"
type: "survey"
corpus: "epistemology-llm-era"
title: "Tooling for recording human judgment: decision records, rationale registries, and dated positions"
conducted:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
searches:
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "tooling for recording human judgment decisions rationale registry knowledge work beyond architecture decision records"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "9 result links returned; the instrument reports no total and no count"
    timestamp: "2026-08-25"
notable_results:
  - what: "Architecture decision records, from Nygard 2011 onward"
    note: "A fifteen-year-old practice with command-line tooling, a documented format family, templates in Confluence and Notion, and an explicit statement that the practice extends to any decision record. The essay's phrase does not survive it."
    atoms:
      - "ell-132"
      - "ell-133"
      - "ell-134"
      - "ell-135"
  - what: "Kialo's impact ratings"
    note: "Recorded judgment at claim grain, by many people, with the rating attached to the claim. Not dated per person and not withdrawable, which is where it falls short of what the essay proposes."
    atoms:
      - "ell-128"
  - what: "The gap the results themselves name"
    note: "One result observes that ADRs operate at architectural granularity and do not capture implementation-level decisions, which are more numerous and more often lost. That is the essay's point, made from inside the practice it says does not exist."
---

What was sought: any tooling for recording a person's judgment, which the
essay calls the newest practice on its list and says has next to no tooling.

What was found: a mature practice with a name, a founding text from 2011,
several open-source tools, a GitHub organization, format variants, and a
documented extension beyond architecture to any decision record.

What survives: the essay's proposal is narrower than the decision record
and the difference matters. An ADR records a decision once, in prose, and
nothing revisits it. What the essay proposes is a dated ledger of positions
on a claim, per person, in which withdrawal is an event rather than a
deletion. Nothing found does that. The essay's sentence is wrong about
tooling and right about the specific thing it wants.

Coverage bounds: a single act, English only, phrased in the essay's own
vocabulary rather than in the vocabulary of the fields most likely to hold
counterexamples: argumentation theory, evidence-based medicine's GRADE,
structured expert elicitation, prediction markets. Any absence read from
this survey would be an artefact of the phrasing.
