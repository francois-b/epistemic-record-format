---
id: no-continuous-claim-check
corpus: erf-example
type: claim
title: "No shipped tool runs a claim-against-source check continuously over a maintained document; the check exists only as per-response evaluation"
epistemic_kind: observation
edges:
  - {to: discipline-needs-primitives, relation: supports}
families: [prior-art, checks, pilot]
atoms_for: [kwg-146]
surveys: [continuous-claim-check-tools-2026-08-19]
created: {timestamp: 2026-08-19, by: "agent/claude-fable-5"}
---

No shipped tool runs a claim-against-source check continuously over a
maintained document; the check exists only as per-response evaluation. The
entailment mechanism is mature and cheap (RAGAS faithfulness, Vectara HHEM,
Patronus Lynx, Vertex Check Grounding, Clearbrief's cite-check), but every
shipped implementation runs once per answer, per request, or on demand at
review time. None runs as a standing lint over a document that keeps
growing. Backing beyond kwg-146: the 2026-08-19 epistemic-layer scan (pass 2)
graded ten check products and found the one-shot pattern universal; capture
of the remaining primaries pending.

## Working notes

Scoping note (2026-08-22): kwg-147 (Guru Knowledge Agents) shows CONTINUOUS
automated verification shipping at card granularity with rule-based checks;
it does not check claims against sources, so this claim stands as stated —
but "continuously" alone is no longer the differentiator; "claim-against-
source" is.

Survey wiring (2026-08-22): the universal negative now rests on the survey
record `continuous-claim-check-tools-2026-08-19` (the 8/19 scan given
record form: the search acts, their yields, and the coverage limits),
cited in `surveys:`. kwg-146 stays as the atom evidencing the RAGAS case;
the absence itself is evidenced by the survey, per the survey/atom
asymmetry (absence by surveys, presence by atoms).
