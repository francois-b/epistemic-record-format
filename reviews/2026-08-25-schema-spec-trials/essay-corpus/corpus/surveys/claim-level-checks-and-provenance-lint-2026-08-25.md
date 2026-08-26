---
id: "claim-level-checks-and-provenance-lint-2026-08-25"
type: "survey"
corpus: "epistemology-llm-era"
title: "A test that runs on claims, and a lint for provenance: shipped mechanical checks over assertions and their citations"
conducted:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
searches:
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "continuous integration lint check citations provenance in documents automated verification tool"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "10 result links returned; the instrument reports no total and no count"
    timestamp: "2026-08-25"
  - tool: "curl 8.7.1 direct retrieval, followed by pandoc 3.8.3 extraction and manual reading"
    query: "manual review of four candidate systems' own documentation: Google's check grounding API, Ragas Faithfulness, TruLens groundedness, sciwrite-lint"
    scope: "the four documentation and abstract pages listed, read end to end"
    hits_reported: "4 pages retrieved; all 4 define a check whose unit is the claim rather than the document"
    timestamp: "2026-08-25"
notable_results:
  - what: "sciwrite-lint"
    note: "Names itself after the linting paradigm and applies it to citation verification, checking reference existence, metadata accuracy, retraction status and claim support, fast enough to re-run between revisions. This is a lint for provenance under the essay's own description of what one would be."
    atoms:
      - "ell-117"
  - what: "Google's check grounding API"
    note: "A shipped, latency-budgeted API that returns a support score and per-claim citations, and defines grounding as every claim being wholly entailed by the given facts. Its limit is that it treats a sentence as a claim."
    atoms:
      - "ell-109"
      - "ell-110"
      - "ell-111"
  - what: "Ragas Faithfulness and TruLens groundedness"
    note: "Two independent open evaluation frameworks that decompose a response into claims and check each against retrieved context. Both are mechanical in their plumbing and LLM-judged in their verdicts, which is the essay's own reading that semantic checks mechanize partially rather than a refutation of it."
    atoms:
      - "ell-112"
      - "ell-113"
      - "ell-114"
---

What was sought: a test that runs on claims as a document grows, and a lint
for provenance. The essay names both as absent.

What was found: both exist and ship. The claim-level check is a commodity
in the retrieval-augmented-generation stack, with at least one hyperscaler
API and two open frameworks implementing the same
decomposition-and-entailment procedure. The provenance lint exists as a
named tool built for the reason the essay gives, that LLM-assisted writing
produces citations nobody checks.

What surprised me: every instance found runs over a generated answer
against retrieved context, not over a document as it grows. The
continuous-integration shape the essay asks for, a check that runs on every
save against a corpus's own claim graph, is what sciwrite-lint comes
closest to and what the RAG evaluators are not. The essay's diagnosis is
better than its assertion.

Coverage bounds: one web act and one manual read of four pages chosen from
it and from prior knowledge. No search of package registries, of the
software-testing literature, or of the fact-checking literature, where more
instances certainly sit.
