---
id: "provenance-and-claim-primitives-2026-08-25"
type: "survey"
corpus: "epistemology-llm-era"
title: "Tools and standards that add a primitive for checked provenance, for checking claims, or for recording what someone stands behind"
conducted:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
searches:
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "nanopublication verifiable provenance primitive claim assertion Kuhn Dumontier"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "10 result links returned; the instrument reports no total and no count"
    timestamp: "2026-08-25"
  - tool: "curl 8.7.1 direct retrieval, followed by pandoc 3.8.3 extraction and manual reading"
    query: "manual review of the retrieved pages for eight candidate systems: nanopublications, SEPIO, W3C PROV, C2PA, Discourse Graphs, Hypothesis, Schema.org ClaimReview, Scite"
    scope: "the eight project, standard and vendor pages listed, read end to end"
    hits_reported: "8 pages retrieved; 7 carry a primitive at the grain of a claim or an assertion, 1 (Hypothesis) at the grain of an anchored annotation"
    timestamp: "2026-08-25"
notable_results:
  - what: "Nanopublications, defined in the literature by 2012"
    note: "A claim-grain unit carrying its own assertion, provenance and publication metadata, with cryptographic identity. This is the counterexample the essay's universal negative most needs to answer, and it predates the LLM era by a decade."
    atoms:
      - "ell-118"
      - "ell-119"
  - what: "SEPIO, an OWL ontology for the evidence and provenance behind scientific assertions"
    note: "Directly names the pairing the essay says nothing adds. Its own README warns that the repository's model is out of date, which is evidence about maintenance cost rather than about absence."
    atoms:
      - "ell-120"
      - "ell-121"
  - what: "W3C PROV"
    note: "A W3C recommendation for interchanging provenance information, predating the LLM era. Retrieved at one hop through an encyclopedia because the W3C site served a bot challenge to the fetch."
    atoms:
      - "ell-122"
  - what: "C2PA Content Credentials"
    note: "An open standard for the origin and edits of digital content. It covers media provenance and not the provenance of a quotation, which is why it is a near-neighbour rather than a direct hit."
    atoms:
      - "ell-108"
  - what: "Discourse Graphs"
    note: "Represents research as connected claims, evidence and questions, and separates observations from interpretations. Closest in shape to the essay's own proposal, and it is a protocol with implementations rather than a product."
    atoms:
      - "ell-123"
      - "ell-124"
  - what: "Hypothesis"
    note: "A near-miss. Anchored annotation over arbitrary web pages, widely deployed, but nothing in its own description claims that an annotation's quotation is checked against its source, which is the property the essay's atom adds."
    atoms:
      - "ell-125"
  - what: "Schema.org ClaimReview and Scite Smart Citations"
    note: "Two shipped systems whose unit is the claim: one an interchange vocabulary for fact-check verdicts, the other a commercial product classifying later citations as supporting, contrasting or mentioning."
    atoms:
      - "ell-115"
      - "ell-116"
---

What was sought: any tool, standard or protocol that adds a primitive for
checked provenance, for checking claims, or for recording what a person or
an organization stands behind. The essay asserts that none of the memory,
context and knowledge-graph tools it surveyed adds any of the three.

What was found: the third property, a dated per-person record of standing,
was not found anywhere. The first two were found repeatedly, in systems
that mostly predate the LLM era: nanopublications, SEPIO, W3C PROV,
Schema.org ClaimReview, Scite, and Discourse Graphs. The essay's own note
that most of these tools "do a fairly old thing" cuts the other way here:
these primitives are old, which makes the claim that nothing adds them
harder rather than easier to sustain.

What surprised me: the gap the essay names is real but is not the gap it
states. Checked provenance and claim checking exist and are not adopted
inside general knowledge work. Standing, in the essay's sense of a dated,
per-person, withdrawable position on a claim, was not found in any system
reached by these acts.

Coverage bounds. Two acts only, one of them a manual read of eight pages
chosen from the first act's results and from prior knowledge of the field,
which is a biased frame: it finds what is already famous. No patent
database, no preprint server, no vendor-documentation corpus, and no
non-English source was searched. Hits were inspected to the depth of one
page each, not to the depth of a specification. An absence reading taken
from this survey would be weak; a presence reading is what it supports,
and presence is what it found.
