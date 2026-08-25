---
id: ai-gpu-assets-may-depreciate-faster-than-industry-schedules-assume
type: claim
corpus: ai-capex
title: "Real-world evidence on AI-infrastructure hardware depreciation suggests at least some AI infrastructure vehicles are consuming their assets' economic life faster than the long useful-life assumptions common in industry accounting, undermining the economics of a long-lived-asset framing"
epistemic_kind: argument
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
families: [financing-risk]
atoms_for: [acx-29]
atoms_against: [acx-4]
edges:
  - {to: coreweave-depreciation-growth-2026, relation: assumes}
  - {to: msft-datacenter-useful-life-extension-flatters-near-term-earnings, relation: conflicts-with}
---
Real-world evidence on AI-infrastructure hardware depreciation suggests at least some AI infrastructure vehicles are consuming their assets' economic life faster than the long useful-life assumptions common in industry accounting, undermining the economics of a long-lived-asset framing

## Working notes

Real-world evidence on AI-infrastructure hardware depreciation suggests at least some AI infrastructure vehicles are consuming their assets' economic life faster than the long useful-life assumptions common in industry accounting, undermining the economics of a long-lived-asset framing.

This is Michael Burry's argument (acx-29: CoreWeave as a 'designed to lose money' off-balance-sheet vehicle whose infrastructure depreciates faster than dot-com-era Level 3 Communications' did), reasoned from the premise that CoreWeave's own D&A is growing fast (coreweave-depreciation-growth-2026). Graded as an argument, not an observation, because the load-bearing move is inferential: nobody has directly measured 'true' GPU economic life in this corpus, and Burry is a named, interested party (short seller) rather than a neutral data source -- exactly the kind of reasoning-over-premises case epistemic_kind=argument exists for. Marked conflicts-with against msft-datacenter-useful-life-extension-flatters-near-term-earnings on the judgment that the two represent opposing readings of how long AI-era infrastructure assets actually last; see claimsA-friction.md for the caveat that the asset classes differ (MSFT's extension covers datacenter buildings and office buildings, not GPUs specifically) so the conflict is thematic rather than a strict logical contradiction over the same asset.
