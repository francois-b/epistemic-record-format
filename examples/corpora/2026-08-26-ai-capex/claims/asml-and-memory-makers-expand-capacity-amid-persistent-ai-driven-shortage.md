---
id: asml-and-memory-makers-expand-capacity-amid-persistent-ai-driven-shortage
type: claim
corpus: ai-capex
title: "ASML's raised 2026 sales guidance and planned 30% EUV and DUV capacity additions for 2027, together with Samsung's and SK hynix's record memory results and Samsung's own projection that the memory market stays undersupplied through the second half of 2026, show demand for lithography equipment and memory chips currently exceeds available capacity"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
families: [demand-signals, capex-figures, supply-chain]
atoms_for: [acx-90, acx-91, acx-131, acx-92, acx-93, acx-127, acx-94, acx-135]
atoms_against: [acx-53]
edges:
  - {to: semiconductor-supply-chain-results-show-real-not-just-announced-demand, relation: supports}
  - {to: capacity-and-power-constraints-signal-undersupplied-real-demand, relation: supports}
semantic_query: "ASML Samsung SK hynix memory HBM capacity shortage lithography 2026"
---
ASML's raised 2026 sales guidance and planned 30% EUV and DUV capacity additions for 2027, together with Samsung's and SK hynix's record memory results and Samsung's own projection that the memory market stays undersupplied through the second half of 2026, show demand for lithography equipment and memory chips currently exceeds available capacity

## Working notes

ASML's raised 2026 sales guidance and planned 30% EUV and DUV capacity additions for 2027, together with Samsung's and SK hynix's record memory results and Samsung's own projection that the memory market stays undersupplied through the second half of 2026, show demand for lithography equipment and memory chips currently exceeds available capacity.

The equipment-and-memory half of semiconductor-supply-chain-results-show-real-not-just-announced-demand, isolated as its own claim for the same reason as tsmc-2026-results-and-advanced-node-mix-confirm-record-ai-driven-wafer-demand: I cannot add a decomposes-into edge to that parent without editing it, so this claim carries supports edges outward instead (see claimsB-friction.md). ASML raised full-year 2026 sales guidance to EUR43-45B and is adding 30% to both its low-NA EUV and DUV immersion capacity for 2027 (acx-90, acx-91, acx-131); Samsung's Device Solutions division posted a record quarter on AI server memory demand despite limited capacity (acx-92), projecting the memory market to stay undersupplied through H2 2026 as server DRAM, eSSD, and HBM demand accelerate (acx-127); SK hynix posted an all-time-high quarter (76% operating margin, acx-93), crossed 100 trillion won in H1 2026 revenue for the first time (acx-135), and began HBM4 mass shipments while still emphasizing capex discipline even as it expands (acx-94). Also carries a supports edge into capacity-and-power-constraints-signal-undersupplied-real-demand, since the same memory-shortage atoms (acx-92, acx-93, acx-127) are part of that claim's own evidentiary base; this claim adds the equipment-maker (ASML) leg that claim does not carry. atoms_against reuses acx-53 (Doomberg's China-competition argument, low source_quality) as the same forward-looking pricing-power risk noted on the TSMC claim, applied here to the equipment and memory layer.
