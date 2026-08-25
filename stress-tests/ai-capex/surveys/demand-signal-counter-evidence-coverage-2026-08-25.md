---
id: demand-signal-counter-evidence-coverage-2026-08-25
type: survey
corpus: ai-capex
title: "Coverage of atoms_against counter-evidence specifically across the corpus's BULL demand-signal claims (not the whole demand-signals family, which also contains bear and mixed-qualifier claims)"
conducted: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
searches:
  - tool: "grep -l -E (BSD grep, macOS)"
    query: "families:.*demand-signals"
    scope: "corpus/claims/*.md frontmatter; 53 claim files"
    hits_reported: "20 files"
  - tool: "manual review (edges + title framing)"
    query: "for each of the 20 files, read the title and any edges block to classify: does the claim argue AI demand is real / undersupplied / capacity-constrained (bull), or does it challenge, complicate, or overstate-check a demand signal (bear or mixed-qualifier)?"
    scope: "the 20 demand-signals-family claim files from act 1"
    hits_reported: "14 classified bull, 6 classified bear or mixed-qualifier. The family tag alone does not separate them: 4 of the 6 bear/mixed claims (dominion-demand-forecast-rests-on-granular-per-customer-metering, ercot-interconnection-queue-shows-large-load-requests, interconnection-queue-size-likely-overstates-binding-demand, reported-contracted-capacity-figures-overstate-realized-electricity-demand) carry an explicit conflicts-with or supports edge into the bear side of the argument, and rpo-growth-does-not-establish-monetizable-diversified-demand and semiconductor-results-confirm-physical-buildout-but-not-hyperscaler-return-on-capital likewise read as qualifiers on a bull claim rather than as bull claims themselves."
  - tool: "grep -E ^atoms_against: (BSD grep, macOS, anchored to the frontmatter field)"
    query: "^atoms_against:"
    scope: "the 14 bull-classified claim files from act 2"
    hits_reported: "11 of 14 carry a non-empty atoms_against line; 3 carry none (broadcom-custom-silicon-results-show-ai-chip-demand-extending-beyond-nvidia-gpus, data-center-vacancy-remains-near-zero-despite-record-construction-pipeline, iea-projects-continued-electricity-demand-growth-through-2035-driven-partly-by-data-centers)"
  - tool: "grep -l -E (BSD grep, macOS)"
    query: "acx-53|acx-101 inside an atoms_against line specifically"
    scope: "the 11 bull claims with atoms_against from act 3"
    hits_reported: "acx-53 (Doomberg's China-competition argument, low source_quality) appears in atoms_against on 3 separate bull claims (asml-and-memory-makers-expand-capacity-amid-persistent-ai-driven-shortage, semiconductor-supply-chain-results-show-real-not-just-announced-demand, tsmc-2026-results-and-advanced-node-mix-confirm-record-ai-driven-wafer-demand); acx-101 (ERCOT approved-vs-observed gap) appears on 2 (capacity-and-power-constraints-signal-undersupplied-real-demand, pjm-and-hyperscaler-reports-show-power-not-chips-or-real-estate-as-currently-limiting-the-buildout)"
notable_results:
  - what: "hyperscaler-cloud-revenue-growth-strong-and-broadening carries 3 atoms_against (acx-22, acx-11, acx-8)"
    note: "The most heavily contested bull demand claim in the family by atoms_against count."
  - what: "3 bull claims with no atoms_against: broadcom, data-center-vacancy, iea"
    note: "Only data-center-vacancy's working notes state the negative search explicitly ('I looked for a counter-consideration specific to vacancy... and found none'); broadcom's working notes explain why one specific candidate (acx-53) was judged a weak fit rather than stating a general search was run; iea's working notes carry no statement either way. Per ERF-25/4.5's guidance, an absence of atoms_against inside a closed corpus is itself conclusive for what those atoms could show -- but whether a search for a counter-consideration was actually attempted is a separate fact this survey cannot recover from silence, which is why act 2's finding distinguishes 'stated' from 'silent.'"
  - what: "A methodological near-miss: an unanchored `grep -l acx-53 *.md` (no `^atoms_against:` anchor) falsely flags broadcom-custom-silicon-results-show-ai-chip-demand-extending-beyond-nvidia-gpus.md as carrying acx-53 in atoms_against"
    note: "The match is in the working-notes prose, which discusses and rejects acx-53 as a counter-consideration rather than citing it. Recorded here because it is exactly the kind of false positive ERF-26's 'name the concrete instrument' requirement exists to make legible: two conforming greps on the same corpus, one anchored and one not, disagree, and only the anchored one answers this survey's actual question."
---
Sought: the task brief's framing was "coverage over atoms_against usage" for the corpus's bull demand-signal claims -- how much of the corpus's case that AI demand is real gets stated alongside a named counter-consideration, versus how much stands unchallenged. The corpus tags 20 claims with the `demand-signals` family, but that family is not itself a polarity: it groups everything from `ai-capex-sustainable-given-demand-backing` (the bull central thesis) to `reported-contracted-capacity-figures-overstate-realized-electricity-demand` (a claim that exists specifically to argue demand signals are overstated). A coverage survey that pulled the family tag and stopped there would have reported "15 of 20 carry atoms_against" -- true of the tag, but not an answer to the question asked, because it mixes bull claims' rebuttals in with bear claims' own evidentiary support. Act 2's manual classification is the part of this survey that does the actual work: reading each title against its edges to sort bull from bear/mixed before counting.

The corrected finding -- 11 of 14 bull demand-signal claims carry atoms_against, 3 do not -- is a healthier ratio than "15 of 20" would have suggested, and it is a genuinely different number, which is the point of doing the classification rather than trusting the tag.

What surprised me: the reuse pattern in act 4. Two atoms (acx-53 and acx-101) are each doing counter-evidence duty for multiple bull claims rather than each claim carrying its own independent challenge. This is not necessarily a problem -- acx-53's China-competition argument is a genuinely different kind of consideration from a claim-specific rebuttal, and reusing it across the three chip-demand claims it actually bears on is more honest than inventing three separate rebuttals that don't exist in the corpus -- but a reader leaning on "11 of 14 bull claims have counter-evidence" as a density signal should know that the 11 lean on 2 repeated atoms plus roughly 9 distinct others, not 11 independent challenges.

Where a possible claim could cite this: a claim about the demand-signals family's argumentative balance (e.g., "the corpus's bull demand-signal claims are not one-sided; most carry stated counter-evidence") could cite this survey's coverage rather than re-deriving the bull/bear split by hand. Per this closing pass's brief, no such claim is minted here.

Coverage bounds: acts 1-3 are complete searches of the closed set of 53 claim files, so the 14/6 split and the 11/3 split are conclusive within that set. The classification in act 2 is a reading, not a mechanical fact -- a different author sorting the same 20 titles might place semiconductor-results-confirm-physical-buildout-but-not-hyperscaler-return-on-capital differently (it grants the bull premise and denies the bull conclusion, which is why it is filed as mixed-qualifier here rather than as clean bear) -- so the exact 14/6 boundary is defensible rather than definitive, and a reader should treat it as this survey's judgment call, stated plainly, not as an invariant the corpus itself asserts.
