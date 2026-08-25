---
id: constellation-crane-nuclear-restart-adds-fixed-price-supply-under-two-decade-offtake
type: claim
corpus: ai-capex
title: "Constellation's restart of the Crane Clean Energy Center adds 835 megawatts of nuclear power to PJM under a 20-year fixed-price off-take agreement, backed by roughly $3.4 billion of capital deployment and projected to create more than 3,400 jobs"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
short_name: "Crane nuclear restart"
families: [demand-signals, capex-figures, power-grid]
atoms_for: [acx-97, acx-98, acx-137]
atoms_against: [acx-104]
edges:
  - {to: capacity-and-power-constraints-signal-undersupplied-real-demand, relation: supports}
---
Constellation's restart of the Crane Clean Energy Center adds 835 megawatts of nuclear power to PJM under a 20-year fixed-price off-take agreement, backed by roughly $3.4 billion of capital deployment and projected to create more than 3,400 jobs

## Working notes

Constellation's restart of the Crane Clean Energy Center adds 835 megawatts of nuclear power to PJM under a 20-year fixed-price off-take agreement, backed by roughly $3.4 billion of capital deployment and projected to create more than 3,400 jobs.

A concrete instance of new physical power supply being built in direct response to the power constraint the capacity-and-power family documents, rather than another instance of a capacity or demand figure. Constellation's investor presentation states the Crane Clean Energy Center restart adds 835 MW of nuclear power to PJM under a 20-year fixed-price off-take agreement for the plant's full output (acx-97), projects more than 3,400 jobs (including 600 permanent), $16 billion in Pennsylvania state GDP, and $3.6 billion in tax revenues (acx-98), with approximately $1.6 billion of capex already deployed and roughly $1.8 billion still to be allocated in 2024-2025 (acx-137). Carries a supports edge into capacity-and-power-constraints-signal-undersupplied-real-demand: a utility restarting a shuttered reactor under a firm, two-decade, fixed-price contract is itself real evidence that the power constraint is treated as genuine and durable enough to justify a multi-billion-dollar capital commitment, not just evidence that customers are asking for more power. atoms_against carries acx-104 (66+ GW of data-center capacity under construction in North America) as a scale check: 835 MW is a rounding error against a buildout measured in tens of gigawatts, so this restart, real as it is, does not on its own resolve the scale of the power gap the rest of the family documents.
