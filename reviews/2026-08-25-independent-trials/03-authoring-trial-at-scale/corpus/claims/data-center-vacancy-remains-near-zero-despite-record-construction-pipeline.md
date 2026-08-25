---
id: data-center-vacancy-remains-near-zero-despite-record-construction-pipeline
type: claim
corpus: ai-capex
title: "North American data-center vacancy has held at 1% for a third consecutive year even as more than 66 gigawatts of capacity, an electricity requirement exceeding Germany's, is under construction"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
families: [demand-signals, power-grid]
atoms_for: [acx-104]
edges:
  - {to: capacity-and-power-constraints-signal-undersupplied-real-demand, relation: supports}
---
North American data-center vacancy has held at 1% for a third consecutive year even as more than 66 gigawatts of capacity, an electricity requirement exceeding Germany's, is under construction

## Working notes

North American data-center vacancy has held at 1% for a third consecutive year even as more than 66 gigawatts of capacity, an electricity requirement exceeding Germany's, is under construction.

The real-estate leg of capacity-and-power-constraints-signal-undersupplied-real-demand, isolated as its own claim for the same reason as the PJM/hyperscaler claim above: JLL's Midyear 2026 North America data-center report states vacancy has remained at 1% for a third consecutive year despite unprecedented construction, with more than 66 GW of data-center capacity under construction in North America -- an electricity requirement JLL says exceeds Germany's (acx-104). This is the single narrowest and most literal of the decomposed pieces: one report, one figure, no adjudication required, which is why it carries only a supports edge into the parent and no further edges of its own. No atoms_against: I looked for a counter-consideration specific to vacancy (for example, evidence that reported vacancy excludes space already leased but not yet built out) and found none in the corpus; forcing one would be inventing a complication the atoms do not carry.
