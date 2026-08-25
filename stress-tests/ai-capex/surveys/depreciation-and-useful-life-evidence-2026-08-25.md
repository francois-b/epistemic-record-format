---
id: depreciation-and-useful-life-evidence-2026-08-25
type: survey
corpus: ai-capex
title: "What the corpus holds on AI-infrastructure depreciation schedules and useful-life accounting, both the bull (extend useful life, flatter near-term earnings) and bear (hardware ages faster than assumed) sides"
conducted: {timestamp: "2026-08-25", by: "agent/claude-sonnet-5"}
searches:
  - tool: "grep -liE (BSD grep, macOS)"
    query: "depreciat|useful.life"
    scope: "corpus/atoms/*.md, finding field; 151 atom files"
    hits_reported: "5 files: acx-4, acx-29, acx-59, acx-69, acx-77"
  - tool: "grep -l -E (BSD grep, macOS)"
    query: "\\bacx-4\\b|\\bacx-29\\b|\\bacx-59\\b|\\bacx-69\\b|\\bacx-77\\b"
    scope: "corpus/claims/*.md, run once per atom id against the 53 claim files"
    hits_reported: "acx-4: 3 claims (ai-gpu-assets-may-depreciate-faster-than-industry-schedules-assume, msft-datacenter-useful-life-extension-flatters-near-term-earnings, msft-capex-and-rpo-growth-2026); acx-29: 2 claims (ai-gpu-assets-may-depreciate-faster-than-industry-schedules-assume, coreweave-receives-investment-grade-ratings-for-debt-secured-by-hpc-infrastructure); acx-59: 1 claim (msft-datacenter-useful-life-extension-flatters-near-term-earnings); acx-69: 0 claims; acx-77: 1 claim (coreweave-depreciation-growth-2026)"
  - tool: "manual review, read in full"
    query: "read each of the 5 atoms and the claims they feed, to sort the corpus's depreciation evidence into bull-framed (useful-life extension slows depreciation, flatters earnings) versus bear-framed (real-world D&A growth outpaces assumed schedules)"
    scope: "the 5 atoms and their citing claims from acts 1-2"
    hits_reported: "1 company (Microsoft) supplies the bull-framed evidence: acx-4 states the 15-to-25-year useful-life extension and its capex-guidance consequence, acx-59 gives the trend it sits inside (Microsoft D&A: $20.958B to $29.433B to $38.534B across three fiscal years, accelerating even before the extension's FY2027 effect lands). 2 companies supply bear-framed evidence: CoreWeave's own D&A growth (acx-77: $996M to $2.5B in six months, 2.5x) grounds Michael Burry's argument (acx-29) that CoreWeave's infrastructure depreciates faster than dot-com-era Level 3 Communications did. Alphabet's D&A growth (acx-69: $9.5B to $13.6B in six months) is neither bull- nor bear-framed by any claim -- it cites no useful-life change and no short-seller argument, and no claim in the corpus cites it at all."
notable_results:
  - what: "acx-69, Alphabet's H1 2026 depreciation ($9.5B to $13.6B) is not cited by any of the corpus's 53 claims"
    note: "A genuine gap: it is the third hyperscaler-level D&A figure in the corpus (alongside Microsoft's and CoreWeave's) and the only one sitting unused. It would be the natural third data point for a claim comparing D&A growth rates across companies as a check on whether CoreWeave's 2.5x figure is an outlier or part of an industry-wide acceleration -- no such comparative claim exists in the corpus."
  - what: "The bear/bull conflict is thematic, not a strict contradiction over the same asset class"
    note: "ai-gpu-assets-may-depreciate-faster-than-industry-schedules-assume carries a conflicts-with edge against msft-datacenter-useful-life-extension-flatters-near-term-earnings, but the two claims are about different asset classes: Burry's argument is about CoreWeave's GPU-heavy infrastructure specifically, while Microsoft's useful-life extension covers datacenter and office buildings, not GPUs. The corpus's own working notes on the GPU-depreciation claim flag this directly (a caveat already on record, not a new finding by this survey), which is why this survey does not add a third, redundant claim making the same point."
---
Sought: every atom in the corpus bearing on how fast AI-era infrastructure assets lose economic value -- depreciation and amortization figures, and any change to an assumed useful life -- on both sides of the argument about whether current accounting flatters near-term earnings or understates true asset consumption.

The corpus's depreciation evidence is small (5 atoms out of 151) but structurally clean: it splits cleanly by company into one bull-framed thread (Microsoft's useful-life extension) and one bear-framed thread (CoreWeave's D&A growth read through Burry's short thesis), with a third company's figure (Alphabet) sitting orphaned in between, cited by neither side. That third figure is the most useful thing this survey turned up -- not because it changes either argument, but because it is exactly the kind of data point a future author would want before generalizing either side's claim from one company to "the industry."

What surprised me: the corpus does not contain a single atom directly measuring GPU economic life (chip-level resale value, secondary-market pricing, or a vendor's own hardware-refresh cadence) -- everything here is either an accounting-policy change (useful-life years) or an aggregate D&A dollar figure at the company level. Burry's argument (acx-29) is explicitly an inference from CoreWeave's D&A growth rate to a claim about the GPUs themselves, and the claim that carries it (`ai-gpu-assets-may-depreciate-faster-than-industry-schedules-assume`) is graded `epistemic_kind: argument` for exactly this reason -- nobody in this corpus has directly measured GPU economic life. A future author minting a claim narrower than "AI infrastructure" and specifically about GPU hardware would need new source material this corpus does not currently hold.

Where a possible claim could cite this: a claim stating that the corpus's depreciation evidence covers only three companies and no direct GPU-level measurement -- narrower and more defensible than either existing depreciation claim's current framing -- could cite this survey's coverage. Per this closing pass's brief, no such claim is minted here.

Coverage bounds: this is a complete search of the closed set of 151 atoms and 53 claims, so the "5 atoms, 3 companies, 1 uncited" finding is conclusive within the corpus as it stands. It says nothing about depreciation evidence that exists in the world but was never captured into this corpus -- a limitation of the corpus's source selection, not of this survey's search.
