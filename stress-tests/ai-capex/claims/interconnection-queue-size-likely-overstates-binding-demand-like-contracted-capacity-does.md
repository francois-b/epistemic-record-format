---
id: interconnection-queue-size-likely-overstates-binding-demand-like-contracted-capacity-does
type: claim
corpus: ai-capex
title: "ERCOT's large-load interconnection queue most likely substantially overstates the electricity demand that will ultimately be built and drawn, on the same logic Dominion's own distinction between contracted and forecasted capacity already illustrates: an interconnection request, like a contracted-capacity figure, is comparatively cheap to file relative to the capital commitment of actually building generation and drawing power"
epistemic_kind: argument
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
short_name: "interconnection queue as noisy signal"
families: [demand-signals, power-grid]
atoms_for: [acx-134]
atoms_against: [acx-102]
edges:
  - {to: ercot-interconnection-queue-shows-large-load-requests-far-exceeding-current-grid-scale, relation: assumes}
  - {to: reported-contracted-capacity-figures-overstate-realized-electricity-demand, relation: assumes}
---
ERCOT's large-load interconnection queue most likely substantially overstates the electricity demand that will ultimately be built and drawn, on the same logic Dominion's own distinction between contracted and forecasted capacity already illustrates: an interconnection request, like a contracted-capacity figure, is comparatively cheap to file relative to the capital commitment of actually building generation and drawing power

## Working notes

ERCOT's large-load interconnection queue most likely substantially overstates the electricity demand that will ultimately be built and drawn, on the same logic Dominion's own distinction between contracted and forecasted capacity already illustrates: an interconnection request, like a contracted-capacity figure, is comparatively cheap to file relative to the capital commitment of actually building generation and drawing power.

The inferential companion to ercot-interconnection-queue-shows-large-load-requests-far-exceeding-current-grid-scale, which states the gap as a fact without adjudicating it. This claim takes the further step: reasoned by analogy to reported-contracted-capacity-figures-overstate-realized-electricity-demand's own finding that Dominion's 47 GW of executed/pending contracted capacity already runs nearly 3x its own 16.6 GW 2046 demand forecast, an interconnection-queue submission is an earlier and cheaper stage in the same funnel than a signed contract, so the ~140,000 MW figure should be expected to overstate eventual real demand by at least as much, plausibly more. Assumes both the queue-size claim and the contracted-capacity claim as premises; both are observation-kind and terminate the argument's premise closure cleanly. Illustrative atoms_for: PJM's FRR regions procuring an additional 10,864 MW beyond the base auction, for a total of 149,182 MW at $16.4B (acx-134) -- included to show that even a formal, competitive, price-discovered capacity auction across a major RTO clears at a scale far below ERCOT's queue figure, which is one data point suggesting the queue number is not close to what actually gets built and paid for. atoms_against carries a genuine complication: PJM's base auction alone secured 138,318 MW of unforced capacity (acx-102), which shows grid operators do sometimes translate very large aggregate figures into real, cleared procurement at multi-hundred-gigawatt scale -- so size alone is not proof a figure is mostly noise, and this argument's conclusion has to survive that counter-example rather than treat "large number" as automatically discounted.
