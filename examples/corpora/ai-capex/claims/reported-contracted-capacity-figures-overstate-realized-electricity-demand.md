---
id: reported-contracted-capacity-figures-overstate-realized-electricity-demand
type: claim
corpus: ai-capex
title: "Reported gigawatt figures for contracted, pending, or approved-to-energize data-center capacity substantially overstate the electricity data centers currently draw, because utility-observed peak consumption and utilities' own long-run demand forecasts run well below those contracted or approved figures"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
short_name: "contracted capacity overstates real draw"
families: [demand-signals]
atoms_for: [acx-100, acx-101]
atoms_against: [acx-104, acx-103, acx-26, acx-27, acx-28]
edges:
  - {to: capacity-and-power-constraints-signal-undersupplied-real-demand, relation: conflicts-with}
---
Reported gigawatt figures for contracted, pending, or approved-to-energize data-center capacity substantially overstate the electricity data centers currently draw, because utility-observed peak consumption and utilities' own long-run demand forecasts run well below those contracted or approved figures

## Working notes

Reported gigawatt figures for contracted, pending, or approved-to-energize data-center capacity substantially overstate the electricity data centers currently draw, because utility-observed peak consumption and utilities' own long-run demand forecasts run well below those contracted or approved figures.

The evidentiary base is narrow but pointed: Dominion Energy -- which serves the largest data-center market in the world -- explicitly distinguishes 47 GW of executed/pending contracted capacity from its own 16.6 GW demand forecast through 2046 (acx-100), and ERCOT's Large Load Integration Team observed only 3,883 MW non-simultaneous peak consumption against 9,042 MW of loads that have received Approval to Energize (acx-101) -- a roughly 43% realization rate against the approved figure. This is only two atoms from two grid operators, and it says something quite specific (contracted capacity is not the same number as drawn demand) rather than the broader claim that AI power demand is overstated in general; the IEA's own historical and forecast electricity-consumption figures (acx-26, acx-27, acx-28) and the persistently near-zero data-center vacancy rate (acx-104) sit in the atoms_against precisely because they show consumption and occupancy actually rising, which is in tension with a broad reading of this claim even as the two narrow utility-level data points hold up on their own terms.
