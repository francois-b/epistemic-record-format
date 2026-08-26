---
id: "knowledge-work-has-no-test-that-runs-on-claims"
type: "claim"
corpus: "epistemology-llm-era"
title: "There is no test that runs on claims as a document grows, in the way a test suite runs on code"
epistemic_kind: "observation"
short_name: "no claim test"
semantic_query: "automated check over assertions in a document entailment against sources run continuously"
families:
  - "diagnosis"
created:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
atoms_for:
  - "ell-018"
atoms_against:
  - "ell-109"
  - "ell-110"
  - "ell-111"
  - "ell-112"
  - "ell-113"
  - "ell-114"
  - "ell-115"
  - "ell-116"
surveys:
  - "claim-level-checks-and-provenance-lint-2026-08-25"
---

There is no test that runs on claims as a document grows, in the way a test suite runs on code

## Working notes

False as written. Claim-level entailment checking is a commodity: Google
ships an API that returns per-claim citations and a support score with a
sub-500ms latency budget, and Ragas and TruLens both decompose a response
into claims and check each against retrieved context.

What survives is the phrase "as a document grows". Every instance found
checks a generated answer against retrieved context at inference time.
None runs over a document's own claim graph on every save, which is the
continuous-integration shape the essay is asking for.
