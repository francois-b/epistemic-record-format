---
id: "hmm-entrant-darpa-sur-2026-08-26"
type: "survey"
corpus: "bitter-lesson"
title: "Evidence that a hidden-Markov-model system was the winning statistical side of the 1970s DARPA Speech Understanding Research programme"
conducted:
  timestamp: "2026-08-26"
  by: "agent/claude-opus-5"
searches:
  - tool: "WebSearch tool in Claude Code (claude-opus-5 session, US web index)"
    query: "DARPA Speech Understanding Research 1971 1976 Harpy Hearsay-II Dragon HMM which system won Klatt review"
    scope: "the open web as that index covers it, English, no date restriction"
    hits_reported: "ten links; no total given"
    timestamp: "2026-08-26"
  - tool: "WebSearch tool in Claude Code (claude-opus-5 session, US web index)"
    query: "Harpy won DARPA speech understanding 1976 met goals \"not\" hidden Markov model beam search precompiled network Sutton bitter lesson wrong speech"
    scope: "the open web as that index covers it, English, no date restriction"
    hits_reported: "ten links; no total given"
    timestamp: "2026-08-26"
  - tool: "grep (BSD grep, macOS) over the corpus's normalized texts"
    query: "Markov, case-insensitive, across corpus/normalized/lowerre-1980-harpy.md and corpus/normalized/erman-1980-hearsay-ii.md"
    scope: "the two primary DARPA-programme texts this corpus holds"
    hits_reported: "0 lines in the held excerpts"
    timestamp: "2026-08-26"
notable_results:
  - what: "Harpy, not an HMM system, is the system that met and exceeded the programme's goals"
    note: "The primary source found by these acts and then taken into the corpus states that Harpy met all specifications and beat several. Its own account credits a compiled network of hand-specified knowledge sources and a beam search, and credits Baker's Dragon for the network representation. Dragon, the system nearest to the HMM tradition, is not recorded as having met the goals."
    atoms:
      - "bl-067"
      - "bl-069"
  - what: "HMM dominance is dated to the 1980s, not the 1970s"
    note: "Two independent statements place the CMU adoption of HMMs about a decade after Baum's late-1960s mathematics, and HMM dominance in the 1980s. That is after the programme the essay's sentence describes."
    atoms:
      - "bl-062"
      - "bl-065"
---
What was sought: any source placing an HMM-based system on the winning side of the 1971-1976 DARPA programme, which is what the essay's speech paragraph asserts.

What came back: the opposite, consistently. The system that met the goals was Harpy, whose own authors describe a knowledge compiler turning hand-written grammar, pronunciation and juncture rules into one large network searched by beam search. The statistical turn the essay is describing is real; it is a decade late for the competition it is attached to.

This survey is cited for a density reading rather than an absence one: the ground is well covered and it says something other than what the claim says. Coverage bounds: two general web acts plus a grep of the two primary texts this corpus holds in excerpt. The excerpts are short, so the grep result is evidence about the excerpts and not about the whole papers.
