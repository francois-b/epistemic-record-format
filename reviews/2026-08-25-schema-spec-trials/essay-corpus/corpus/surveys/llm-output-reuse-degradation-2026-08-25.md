---
id: "llm-output-reuse-degradation-2026-08-25"
type: "survey"
corpus: "epistemology-llm-era"
title: "Evidence that LLM output degrades when it is reused as input, in training and between calls"
conducted:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
searches:
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "quality degradation when LLM output is reused as context across successive prompts iterative rewriting study"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "9 result links returned; the instrument reports no total and no count"
    timestamp: "2026-08-25"
notable_results:
  - what: "Gurkan, Stonedahl and Wilensky on LLM-driven mutation chains"
    note: "The closest thing found to the essay's claim: repeated LLM rewriting of the same artefact converges, with 93 percent of mutations revisiting a previously seen structural form in 87 percent of chains, and a classical operator not converging comparably. In a domain-specific programming language, without selection pressure."
    atoms:
      - "ell-166"
      - "ell-167"
  - what: "Shumailov and colleagues on model collapse"
    note: "Rigorous, in Nature, and about the wrong mechanism: recursive training on model output, not reuse between inference calls. Recorded because it is the study most likely to be mistaken for support of the essay's sentence."
    atoms:
      - "ell-156"
      - "ell-157"
  - what: "Context rot"
    note: "A near-miss returned by the search and not minted: degradation as input length grows, which is a property of long context rather than of recycled content. A third mechanism again."
---

What was sought: evidence for or against the essay's assertion that loose
AI-flavoured prose, recycled from call to call, degrades quickly.

What was found: three different degradation phenomena, none of which is
exactly the one the essay names. Model collapse concerns training. Context
rot concerns input length. Mutation convergence concerns repeated LLM
rewriting of an artefact, which is the essay's mechanism, measured on
programs rather than prose and under conditions harsher than a working
corpus.

The honest reading: the essay's sentence is plausible, adjacent to three
measured phenomena, and unmeasured for prose in a working corpus. It is an
assertion the author would have to soften or test.

Coverage bounds: one act. No search of the writing, editing or
information-quality literature; no search for the negative result, that is,
for work showing reuse not degrading, which would be the harder and more
valuable search and was not run.
