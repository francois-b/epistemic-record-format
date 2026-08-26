---
id: "argument-structure-primitives-2026-08-25"
type: "survey"
corpus: "epistemology-llm-era"
title: "A diff for arguments: tools that represent argument structure in a form a machine can compare"
conducted:
  timestamp: "2026-08-25"
  by: "anthropic/claude-opus-5"
searches:
  - tool: "WebSearch (Claude Code harness; US-only web index, upstream provider and index version not exposed to the caller)"
    query: "\"argument mapping\" software Kialo Argdown structured debate claims premises tool"
    scope: "the open web as the harness's index covers it, no domain filter"
    hits_reported: "8 result links returned; the instrument reports no total and no count"
    timestamp: "2026-08-25"
notable_results:
  - what: "Argdown, a plain-text notation for arguments that compiles to a map"
    note: "The sharpest counterexample. Argument structure written as text, usable inside markdown, with premise-conclusion structure explicit. Text in a file is exactly what a line diff operates on, so a diff for arguments follows from the representation without anyone building one."
    atoms:
      - "ell-130"
      - "ell-131"
  - what: "Kialo"
    note: "A deployed platform whose unit is the claim, with pro and con children and impact ratings on each. Described in the encyclopedia as the most widely adopted argumentation-based deliberation system as of 2020."
    atoms:
      - "ell-128"
      - "ell-129"
  - what: "The argument-mapping literature"
    note: "A named field with a settled vocabulary (conclusion, premise, co-premise, objection, rebuttal, lemma) and a teaching tradition, which is more than the essay's phrasing implies exists."
    atoms:
      - "ell-126"
      - "ell-127"
  - what: "Carneades, DebateGraph, Arguman, Rationale, Araucaria"
    note: "Named in the results and not retrieved. Recorded because a reader weighing this survey should know the field is deep rather than three tools wide, and because the format's own specification cites Carneades in its references."
---

What was sought: anything that would count as a diff for arguments, in the
essay's sense of a mechanical primitive that a working discipline could
form around.

What was found: a field. Argument mapping has a literature, a vocabulary,
at least one plain-text notation (Argdown) whose files a line diff already
handles, and a widely used commercial platform (Kialo) whose unit is the
claim.

What survives, and it is the interesting part: none of it is a diff.
Argdown makes argument structure diffable as a side effect of being text;
nothing found computes or presents a structural difference between two
versions of an argument, which is what diff does for code and what the
essay is asking for. The essay's sentence is false as written and close to
true as meant.

Coverage bounds: one act, English only, phrased around the two tools
already known to the searcher. This is a thin search for a claim about a
whole field, and the near-misses listed above were taken from result titles
rather than retrieved. An absence reading from this survey would be
worthless; it is cited for the presence it found.
