---
id: "entailment-is-the-cold-reader-test"
type: "claim"
corpus: "epistemology-llm-era"
title: "Entailment, for this document's purposes, is whether a reader holding only the quote and its surrounding context would accept the claim that cites it"
epistemic_kind: "commitment"
short_name: "entailment"
semantic_query: "entailment test does the quotation support the claim for a reader holding only the quotation"
families:
  - "scope"
created:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
atoms_for:
  - "ell-041"
---

Entailment, for this document's purposes, is whether a reader holding only the quote and its surrounding context would accept the claim that cites it

## Working notes

Worth recording separately because it is the operational definition on
which the whole grounding proposal depends, and because the shipped
claim-checking systems this corpus records (Google's check grounding API,
Ragas, TruLens) all implement a version of it with an LLM as the reader.
