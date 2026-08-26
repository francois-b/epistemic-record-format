---
id: "company-brain-naming-and-products-2026-08-25"
type: "survey"
corpus: "epistemology-llm-era"
title: "The company-brain naming: its origin, who uses it, and what the products under it actually ship"
conducted:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
searches:
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "Y Combinator request for startups Summer 2026 \"company brain\""
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "8 result links returned; the instrument reports no total and no count; none is ycombinator.com itself"
    timestamp: "2026-08-25"
  - tool: "curl 8.7.1 direct retrieval of the live page, then pandoc 3.8.3 extraction and a case-insensitive grep for the word brain"
    query: "the live Requests for Startups page at ycombinator.com/rfs, read in full"
    scope: "one page, the current Requests for Startups list"
    hits_reported: "0 occurrences of the word brain; the page now carries the Fall 2026 list and the Summer 2026 entries are gone"
    timestamp: "2026-08-25"
  - tool: "Internet Archive Wayback availability API, then curl 8.7.1 retrieval of the returned capture"
    query: "ycombinator.com/rfs at timestamp 20260601"
    scope: "the Internet Archive's captures of one URL"
    hits_reported: "1 capture returned, status 200, timestamped 20260529101651; it carries the Summer 2026 list including a Company Brain entry"
    timestamp: "2026-08-25"
notable_results:
  - what: "The primary source has already rotated off the live web"
    note: "The essay's most checkable factual claim was unverifiable at its stated location three months after publication, and required the Internet Archive. That is a fact about how long a claim of this kind stays checkable, and it is the format's own argument for taking the raw file at first reading."
    atoms:
      - "ell-143"
  - what: "The YC entry specifies a mechanism"
    note: "Cuts against the essay's verdict that the word specifies nothing. The entry names a pipeline (pull from fragmented sources, structure, keep current, emit an executable skills file) and explicitly excludes the two things the essay says these products are."
    atoms:
      - "ell-144"
      - "ell-145"
  - what: "Glean"
    note: "Retrieved as the largest product in the category. Its own home page leads on permission-aware access and observability, which corroborates the essay's description of what ships."
    atoms:
      - "ell-136"
      - "ell-137"
---

What was sought: the origin of the phrase company brain, who uses it, and
what the products under it ship.

What was found: the Y Combinator attribution is exact and checks out,
through the Internet Archive rather than through the live page. The essay's
reading of what ships is corroborated by the one vendor page retrieved.

What cuts against the essay: the Y Combinator entry it cites is itself a
specification of a mechanism, and one that explicitly rejects the two
descriptions the essay applies to the category. The word may
anthropomorphize; the request for startups it came from does not specify
nothing.

What could not be established: the essay's claims that a cluster of
startups use the name and that the business press is pitching enterprise
brain at the enterprise vendors. No startup using the name and no
business-press piece using that phrase was retrieved as a primary source in
these acts, and both are recorded in the corpus as unbacked.

Coverage bounds: three acts on one naming question. No product survey was
conducted; one vendor page stands for a category the essay characterizes in
full, which is not coverage and is not claimed as coverage.
