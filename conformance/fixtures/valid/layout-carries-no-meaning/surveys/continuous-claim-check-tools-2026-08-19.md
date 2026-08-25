---
id: continuous-claim-check-tools-2026-08-19
type: survey
corpus: erf-example
title: "Shipped tools running claim-against-source checks continuously over
  maintained documents"
conducted: {timestamp: 2026-08-19, by: "agent/claude-fable-5"}
searches:
  - tool: "Claude Sonnet research subagent (web search plus primary-doc fetch, 30-40 tool calls)"
    query: "AI memory layers and knowledge-graph-in-Markdown tools, graded
      against five epistemic capacities (provenance, check, standing,
      authorship, kinds and lifecycle)"
    hits_reported: "19 tools graded; per-query yields not recorded"
  - tool: "Claude Sonnet research subagent (web search plus primary-doc fetch, 30-40 tool calls)"
    query: "capture-side tools (annotation, archiving, highlight capture) and
      checks shipped since July 2026 (entailment, grounding, cite-check)"
    hits_reported: "25 tools and standards graded; per-query yields not recorded"
  - tool: "Claude Sonnet research subagent (web search plus primary-doc fetch, 30-40 tool calls)"
    query: "judgment capture: dated human standing on claims, in forecasting
      platforms, argument platforms, digital-garden conventions, decision
      registers, verdict systems"
    hits_reported: "15 searches run; ~20 platforms and conventions graded"
  - tool: "Claude Sonnet research subagent (web search plus primary-doc fetch, 30-40 tool calls)"
    query: "lifecycle and ontology standards, document-class governance
      tooling, AI authorship marks in prose tools"
    hits_reported: "~32 standards and tools graded; per-query yields not recorded"
  - tool: "web search (within pass 1; query recorded verbatim in the scan)"
    query: "\"asserted by\" OR \"created_by\" human AI agent field markdown PKM tool"
    hits_reported: "nothing on-point (generic trust-score commentary, no shipped field)"
  - tool: "web search (within pass 1; query recorded verbatim in the scan)"
    query: "\"knowledge graph\" markdown \"human verified\""
    hits_reported: "nothing on-point (academic KG-refinement papers, not personal tools)"
notable_results:
  - what: "Google Vertex Check Grounding API"
    note: "Cleanest per-claim entailment with a support score; explicitly
      per-request, no persistence across calls."
  - what: "Clearbrief Cite Check Report"
    note: "Capture plus semantic quote-support scoring plus an audit-trail
      artifact; runs on demand at review time, not as the document grows."
  - what: "RAGAS faithfulness (with Vectara HHEM, Patronus Lynx)"
    note: "Per-response claim decomposition checked against retrieved
      context; the one-shot evaluation pattern, category-wide."
    atoms: [kwg-146]
  - what: "ChangeDetection.io"
    note: "Genuinely continuous, but watches source drift, not claim
      validity: continuity without entailment."
---

Shipped tools running claim-against-source checks continuously over
maintained documents: sought and not found. Four parallel research passes
graded ~95 tools and standards against five epistemic capacities; the
entailment mechanism is mature and cheap, and every shipped implementation
found runs once per answer, per request, or on demand at review time.
None runs as a standing lint over a document that keeps growing.

**Coverage bounds.** Territory covered by the two earlier scans (2026-06-22
memory axis, 2026-07-02 grounding axis) was deliberately skipped: FActScore
family, Citations API, PaperQA2, Scite/Elicit/Consensus, legal misgrounding.
English-language sources; capabilities read from vendor documentation and
marketing, not trials; several primary pages 403'd or unread and are flagged
UNVERIFIED in the scan. Per-query yields were mostly not recorded: the hit
counts above are tools-graded counts, not search-result counts, and only two
null queries survive verbatim.
