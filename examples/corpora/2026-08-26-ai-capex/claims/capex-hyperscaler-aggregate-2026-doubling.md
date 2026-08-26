---
id: capex-hyperscaler-aggregate-2026-doubling
type: claim
corpus: ai-capex
title: "Aggregate 2026 capital expenditure among the five largest U.S. hyperscalers roughly doubled year-over-year, reaching an estimated $660-700 billion, up from roughly $380 billion in 2025"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
short_name: "hyperscaler capex doubling 2026"
families: [capex-figures]
atoms_for: [acx-44, acx-42, acx-1, acx-30, acx-32, acx-68, acx-33]
atoms_against: [acx-49]
edges:
  - {to: msft-capex-and-rpo-growth-2026, relation: decomposes-into}
  - {to: oracle-capex-rpo-and-cashflow-divergence-2026, relation: decomposes-into}
semantic_query: "2026 hyperscaler AI capital expenditure total aggregate estimate"
---
Aggregate 2026 capital expenditure among the five largest U.S. hyperscalers roughly doubled year-over-year, reaching an estimated $660-700 billion, up from roughly $380 billion in 2025

## Working notes

Aggregate 2026 capital expenditure among the five largest U.S. hyperscalers roughly doubled year-over-year, reaching an estimated $660-700 billion, up from roughly $380 billion in 2025.

Backed by individual company filings (Microsoft, Alphabet, Meta, Amazon) plus two independent analyst aggregations (Futurum's $380B->$660-690B and J.P. Morgan's $697B estimate, up $173B from JPM's own start-of-year number). The two analyst aggregates (acx-42, acx-44) do not fully agree with each other or with GMO/Chancellor's separate estimate (acx-49: ~$300B for four companies in 2025, 1.3% of GDP rising to 1.6% in 2026) -- the scope, company set, and methodology differ enough that these are not the same measurement repeated three times. atoms_against carries acx-49 not because it contradicts the doubling *direction*, but because its absolute figure and its GDP-share framing are materially different from the $660-700B figure this claim states, which matters for anyone treating 'the capex number' as a single settled fact. Decomposes into the Microsoft- and Oracle-specific claims, which carry the per-company detail (and each company's own cash-flow and RPO story) that the aggregate obscures.
