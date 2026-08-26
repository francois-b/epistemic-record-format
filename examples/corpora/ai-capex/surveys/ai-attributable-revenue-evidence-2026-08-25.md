---
id: ai-attributable-revenue-evidence-2026-08-25
type: survey
corpus: ai-capex
title: "Which corpus sources report AI-attributable revenue figures, as distinct from AI capex, cloud/segment revenue, remaining performance obligations, or revenue-need methodology"
conducted: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
searches:
  - tool: "grep -liE (BSD grep, macOS)"
    query: "revenue"
    scope: "corpus/atoms/*.md, finding field; 151 atom files"
    hits_reported: "31 files"
  - tool: "grep -niE (BSD grep, macOS)"
    query: "AI revenue|AI-specific revenue|AI semiconductor revenue|AI-attributable revenue"
    scope: "corpus/atoms/*.md"
    hits_reported: "6 lines across 5 files (acx-18, acx-19, acx-21, acx-22, acx-38)"
  - tool: "manual review, read in full"
    query: "each of the 31 revenue-bearing atoms from act 1, classified as: AI-attributable revenue figure / cloud-or-segment revenue / remaining performance obligation / revenue-need or gap methodology / unrelated"
    scope: "the 31 atoms surfaced by act 1"
    hits_reported: "5 of 31 name a dollar figure explicitly as AI-attributable revenue (acx-18, acx-19, acx-21, acx-22, acx-38); of those, 2 (acx-18, acx-19) are David Cahn's revenue-NEED figures rather than realized actuals, 2 (acx-21, acx-22) are Ed Zitron's own tally and a thirdhand Microsoft figure relayed via The Information, and 1 (acx-38) is Broadcom's own earnings-release framing. The remaining 26 are cloud/segment revenue (11: acx-62, acx-70, acx-72, acx-74, acx-88, acx-89, acx-92, acx-93, acx-135, acx-136, acx-146 -- upstream chip and cloud revenue, not broken out as AI-specific), RPO/commitment figures (4: acx-3, acx-5, acx-37, acx-148), revenue-need/valuation-math figures (4: acx-20, acx-45, acx-48, acx-55 -- Cahn's, Damodaran's, and Bain's methodology outputs), or unrelated to the AI-revenue question (7: acx-2, acx-66, acx-86, acx-87, acx-98, acx-114, acx-140)."
notable_results:
  - what: "acx-38, Broadcom's Q2 FY2026 'AI semiconductor revenue' ($10.8B, +143% YoY, guided to $16.0B in Q3)"
    note: "The corpus's one first-party, company-disclosed dollar figure that names itself 'AI revenue' directly, in an earnings release rather than a filing. Its own limitations field (recorded at mint time by a prior author) flags that the release does not detail how the figure is defined or reconciled to segment financials -- so even the best case in the corpus is a management-chosen framing, not an audited line item."
  - what: "acx-22, Zitron/The Information's '$13 billion Microsoft AI revenue, ~$3 billion non-OpenAI' figure"
    note: "Thirdhand: Zitron citing The Information citing unnamed sourcing. No primary Microsoft filing or earnings-call statement anywhere in the corpus's atoms from Microsoft-sourced captures (10-K, 10-Q, or FY26Q4 earnings call) uses an 'AI revenue' framing or breaks out a comparable figure -- Microsoft's own disclosures top out at cloud revenue ($214B+ FY26, acx-62) and RPO ($678B, acx-3), never an AI-specific revenue line."
  - what: "acx-140, Anthropic's large-account run-rate metric ($100K+ run-rate customers grew ~7x)"
    note: "Near-miss: a growth-rate metric for one customer-size segment, not a total AI revenue figure -- and a run rate, not realized revenue."
  - what: "acx-66, Andy Jassy's 'reportedly approaching $30 billion' run-rate for OpenAI and Anthropic combined"
    note: "Near-miss: explicitly hedged ('reportedly'), a run rate rather than realized revenue, and secondhand even inside Amazon's own shareholder letter."
---
Sought: every corpus source that reports a dollar figure specifically as AI-attributable revenue -- money already earned that is identified, by the company or by a named analyst working from company disclosures, as coming from AI products or services -- as distinct from total capex, cloud or hardware-segment revenue that merely correlates with AI demand, remaining performance obligations (contracted, not yet recognized), or a revenue-*need* figure computed backward from a capex or valuation assumption. This is the corpus's known thin spot: several bear-side claims (`cahn-revenue-gap-methodology-and-figures`, `zitron-capex-vs-ai-revenue-gap-2024-2025`) build directly on how little of this kind of evidence exists, and a claim asserting revenue-evidence scarcity as such could cite this survey's coverage rather than re-deriving it.

What surprised me: given how richly the bull-side sources are represented in this corpus -- 25 bull-tagged sources, ten-plus full 10-K/10-Q/earnings-call captures from Microsoft, Amazon, Alphabet, Meta, NVIDIA, Oracle, CoreWeave, Broadcom -- I expected at least a handful of first-party "AI revenue" disclosures buried in that volume. There is exactly one (acx-38, Broadcom), and it is an earnings-release CEO framing, not a filing-level breakout. Every hyperscaler capex/RPO/cloud-revenue atom in the corpus stops short of naming an AI-specific revenue figure; Microsoft's FY26 10-K instead states, as a risk factor, that its AI and cloud investments are being made "in advance of fully developed revenue streams" (acx-2) -- the companies spending the most are the ones declining to report the number this survey went looking for.

Coverage bounds: this survey's universe is the corpus's 151 minted atoms, a closed set, so the "31 → 5" narrowing in act 3 is a complete search of that set and its absence reading (26 of 31 revenue-bearing atoms are not AI-attributable revenue) is conclusive within it. It does not cover the raw source captures directly -- an atom is a curated excerpt, not the full source text, so a revenue figure could in principle exist in a capture without ever having been minted into an atom. That gap is exactly what the re-run (`ai-attributable-revenue-evidence-rerun-2026-08-25`, chained via `prior_survey`) goes looking for with a differently scoped act, and it finds one: see that survey's notable_results.

What I would search differently next time: run the capture-level pass as part of the same sitting rather than as a separate re-run, since the gap between "what got atomized" and "what the raw source actually says" turned out to matter. I split it into a re-run here mainly to exercise the re-run linkage explicitly per this closing pass's brief, but a future first-pass survey on this question should search captures from the start.
