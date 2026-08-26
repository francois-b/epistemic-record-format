---
id: "memory-and-graph-tools-have-not-moved-beyond-pre-llm-work"
type: "claim"
corpus: "epistemology-llm-era"
title: "Most of the memory, context and knowledge-graph tools available do the pre-LLM thing of storing, linking and retrieving text, and few have moved beyond it"
epistemic_kind: "observation"
short_name: "old wine"
semantic_query: "LLM memory context knowledge graph tools novelty beyond storage linking retrieval"
families:
  - "diagnosis"
created:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
atoms_for:
  - "ell-022"
atoms_against:
  - "ell-138"
  - "ell-139"
  - "ell-140"
surveys:
  - "provenance-and-claim-primitives-2026-08-25"
---

Most of the memory, context and knowledge-graph tools available do the pre-LLM thing of storing, linking and retrieving text, and few have moved beyond it

## Working notes

Two counterexamples, both partial. GraphRAG has the LLM build the graph
and the community summaries rather than storing what it was given, which
is not a pre-LLM operation. Graphiti attaches a validity window and
provenance to each fact, which is more than storing and linking.

Neither checks anything, so the essay's stronger claim, that none of them
adds a checking primitive, is untouched by these two.
