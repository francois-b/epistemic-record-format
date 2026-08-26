---
id: pjm-and-hyperscaler-reports-show-power-not-chips-or-real-estate-as-currently-limiting-the-buildout
type: claim
corpus: ai-capex
title: "PJM's 2028/2029 capacity auction shortfall, AWS's reported unserved customer demand despite adding 3.9 gigawatts of power in 2025, and Microsoft's $80 billion backlog of unfulfillable Azure orders attributed to power constraints together show electricity availability, specifically, rather than chips or real estate alone, as the constraint currently limiting the AI buildout"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
families: [demand-signals, power-grid]
atoms_for: [acx-102, acx-103, acx-10, acx-139, acx-134]
atoms_against: [acx-101]
edges:
  - {to: capacity-and-power-constraints-signal-undersupplied-real-demand, relation: supports}
---
PJM's 2028/2029 capacity auction shortfall, AWS's reported unserved customer demand despite adding 3.9 gigawatts of power in 2025, and Microsoft's $80 billion backlog of unfulfillable Azure orders attributed to power constraints together show electricity availability, specifically, rather than chips or real estate alone, as the constraint currently limiting the AI buildout

## Working notes

PJM's 2028/2029 capacity auction shortfall, AWS's reported unserved customer demand despite adding 3.9 gigawatts of power in 2025, and Microsoft's $80 billion backlog of unfulfillable Azure orders attributed to power constraints together show electricity availability, specifically, rather than chips or real estate alone, as the constraint currently limiting the AI buildout.

Isolates the power-grid leg of capacity-and-power-constraints-signal-undersupplied-real-demand, whose title spans vacancy, PJM, memory chips, and AWS's unserved demand together; this claim carries a supports edge into that parent rather than a decomposes-into edge for the reason recorded in claimsB-friction.md (I cannot edit the parent to add the reverse relation myself). PJM's 2028/2029 Base Residual Auction cleared at the FERC-approved price cap and still fell 6,831 MW short of the reliability requirement, the first RTO-wide shortfall in PJM's history alongside the prior auction (acx-102, acx-103); FRR regions added a further 10,864 MW, bringing total procured unforced capacity to 149,182 MW at a total cost of $16.4 billion (acx-134), context showing the shortfall persists even after a large, well-funded procurement effort; AWS reports capacity constraints yielding unserved customer demand even after adding 3.9 GW of new power capacity in 2025 (acx-10); Microsoft reports an $80 billion backlog of unfulfillable Azure orders attributed specifically to power constraints (acx-139). atoms_against carries ERCOT's approved-vs-observed gap (acx-101: 3,883 MW observed against 9,042 MW approved to energize) as a genuine complication: if a large share of already-approved large loads are not yet drawing anywhere near their approved capacity, that undercuts a reading in which power scarcity is the immediate bottleneck everywhere, even while PJM's own reliability-requirement shortfall shows it clearly is in at least that footprint.
