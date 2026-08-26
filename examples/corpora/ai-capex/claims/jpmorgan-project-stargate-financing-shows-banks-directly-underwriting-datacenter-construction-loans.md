---
id: jpmorgan-project-stargate-financing-shows-banks-directly-underwriting-datacenter-construction-loans
type: claim
corpus: ai-capex
title: "J.P. Morgan originated $9.6 billion across two construction loans for Project Stargate's Abilene, Texas campus, acting as lead left, sole underwriter, and sole structuring agent, showing traditional bank underwriting directly financing large-scale AI data-center construction rather than only vendor-guaranteed or public-market debt"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
short_name: "JPMorgan underwrites Stargate"
families: [financing-risk, financing-structure]
atoms_for: [acx-144]
atoms_against: [acx-138]
edges:
  - {to: ai-infrastructure-financing-shifting-toward-debt-and-off-balance-sheet, relation: supports}
---
J.P. Morgan originated $9.6 billion across two construction loans for Project Stargate's Abilene, Texas campus, acting as lead left, sole underwriter, and sole structuring agent, showing traditional bank underwriting directly financing large-scale AI data-center construction rather than only vendor-guaranteed or public-market debt

## Working notes

J.P. Morgan originated $9.6 billion across two construction loans for Project Stargate's Abilene, Texas campus, acting as lead left, sole underwriter, and sole structuring agent, showing traditional bank underwriting directly financing large-scale AI data-center construction rather than only vendor-guaranteed or public-market debt.

The existing financing claims document vendor guarantees (NVIDIA-CoreWeave, NVIDIA-OpenAI), corporate bond issuance, and Oracle's own debt raise; this claim adds the traditional-bank-construction-loan layer, which is a structurally different financing instrument (secured project-finance lending against a specific site, not a corporate guarantee or unsecured bond). J.P. Morgan states Project Stargate plans to invest up to $500 billion in U.S. data centers and energy infrastructure over four years, and that J.P. Morgan itself originated $9.6 billion across two construction loans for the initiative's Abilene, Texas campus, acting as lead left, sole underwriter, and sole structuring agent on both transactions (acx-144). Carries a supports edge into ai-infrastructure-financing-shifting-toward-debt-and-off-balance-sheet: a large commercial bank directly underwriting site-specific construction debt at this scale is a further, bank-originated instance of the same shift toward debt financing that claim's aggregate figures already document. atoms_against carries S&P's credit-market-fatigue signal (acx-138, reused from the parent claim): if credit markets are showing fatigue absorbing the broader flood of hyperscaler debt, that is a relevant caveat on whether banks will keep originating construction loans of this scale at the same pace, even though this particular transaction has already closed.
