---
id: dominion-demand-forecast-rests-on-granular-per-customer-metering-not-aggregate-figures
type: claim
corpus: ai-capex
title: "Dominion Energy builds its long-run data-center demand forecast from statistical models of its largest individual customers, tracked with metering data collected since 2013, plus a combined segment for the remainder, rather than from aggregated contracted-capacity or interconnection-queue figures"
epistemic_kind: observation
created: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
families: [demand-signals, power-grid]
atoms_for: [acx-132, acx-99]
edges:
  - {to: reported-contracted-capacity-figures-overstate-realized-electricity-demand, relation: supports}
---
Dominion Energy builds its long-run data-center demand forecast from statistical models of its largest individual customers, tracked with metering data collected since 2013, plus a combined segment for the remainder, rather than from aggregated contracted-capacity or interconnection-queue figures

## Working notes

Dominion Energy builds its long-run data-center demand forecast from statistical models of its largest individual customers, tracked with metering data collected since 2013, plus a combined segment for the remainder, rather than from aggregated contracted-capacity or interconnection-queue figures.

Grounds why reported-contracted-capacity-figures-overstate-realized-electricity-demand's Dominion figure (47 GW contracted/pending vs 16.6 GW 2046 demand forecast) deserves to be read as a meaningful gap rather than as an artifact of a weak or aggregate-only forecasting method: Dominion states it has collected detailed metering information on its data-center customers since 2013, and builds its forecast by statistically modeling its seven largest or fastest-growing customers individually while combining the remaining roughly 45 customers into an eighth segment (acx-132); it also states it serves the largest data-center market in the world, with a 2025 coincident peak of 4 GW, greater than the sum of the next five largest U.S. data-center markets combined (acx-99), which establishes the scale and centrality of the utility making this forecast. Carries a supports edge into reported-contracted-capacity-figures-overstate-realized-electricity-demand: this claim does not add a new number to that claim's gap, it strengthens the credibility of the forecast side of the gap by showing it is built bottom-up from real customer data rather than a top-down guess. No atoms_against: the methodology description is not contested by any atom in the corpus, and I did not find a genuine counter-consideration worth forcing.
