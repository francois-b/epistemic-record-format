---
id: coreweave-receives-investment-grade-ratings-for-debt-secured-by-hpc-infrastructure
type: claim
corpus: ai-capex
title: "CoreWeave's $8.5 billion delayed-draw term loan facility received investment-grade ratings of A3 from Moody's and A(low) from DBRS, which CoreWeave describes as the first investment-grade-rated financing secured by HPC infrastructure and an associated customer contract"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
short_name: "CoreWeave's investment-grade debt"
families: [financing-risk, financing-structure]
atoms_for: [acx-95, acx-96]
atoms_against: [acx-29]
edges:
  - {to: ai-infrastructure-financing-shifting-toward-debt-and-off-balance-sheet, relation: supports}
semantic_query: "CoreWeave DDTL investment grade Moody's DBRS HPC infrastructure financing"
---
CoreWeave's $8.5 billion delayed-draw term loan facility received investment-grade ratings of A3 from Moody's and A(low) from DBRS, which CoreWeave describes as the first investment-grade-rated financing secured by HPC infrastructure and an associated customer contract

## Working notes

CoreWeave's $8.5 billion delayed-draw term loan facility received investment-grade ratings of A3 from Moody's and A(low) from DBRS, which CoreWeave describes as the first investment-grade-rated financing secured by HPC infrastructure and an associated customer contract.

The rating-agency evidence the task brief asked for, previously present in the corpus only as raw deal terms (acx-95, acx-96 already sit in ai-infrastructure-financing-shifting-toward-debt-and-off-balance-sheet's atoms_for) without a claim naming the ratings angle specifically. CoreWeave announced it closed an $8.5 billion delayed-draw term loan facility that received ratings of A3 from Moody's and A(low) from DBRS, describing it as the first investment-grade-rated financing secured by HPC infrastructure and an associated customer contract (acx-95); the facility lets CoreWeave initially borrow approximately $7.5 billion, rising to $8.5 billion as underlying assets stabilize, at SOFR + 2.25% or approximately 5.9% fixed, building on roughly $28 billion of equity and debt financing commitments over the prior 12 months (acx-96). Carries a supports edge into ai-infrastructure-financing-shifting-toward-debt-and-off-balance-sheet, giving that claim's debt-financing pattern a rating-agency-specific data point distinct from the bond-issuance and lease-commitment evidence it already carries. atoms_against carries Michael Burry's argument that CoreWeave functions as an off-balance-sheet vehicle "designed to lose money" whose infrastructure depreciates faster than dot-com-era Level 3 Communications' did (acx-29, reused from ai-gpu-assets-may-depreciate-faster-than-industry-schedules-assume): a named short-seller's direct dispute of CoreWeave's underlying economics sits in real tension with two rating agencies independently assigning investment-grade status to debt secured by that same company's infrastructure and contracts, and this claim states that tension rather than resolving it.
