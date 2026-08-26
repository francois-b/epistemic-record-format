---
id: "deep-blue-was-simpler-than-its-knowledge-based-rivals"
type: "claim"
corpus: "bitter-lesson"
title: "Deep Blue's winning approach was simpler than the human-knowledge approaches it beat."
epistemic_kind: "observation"
created:
  timestamp: "2026-08-26"
  by: "agent/claude-opus-5"
short_name: "Deep Blue was simpler"
families:
  - "chess"
semantic_query: "Deep Blue evaluation function features hand tuned grandmaster opening book expert system"
atoms_for:
  - "bl-009"
atoms_against:
  - "bl-028"
  - "bl-029"
  - "bl-030"
  - "bl-032"
  - "bl-034"
  - "bl-035"
  - "bl-038"
  - "bl-043"
  - "bl-049"
edges:
  - to: "computation-leveraging-methods-win-over-seventy-years"
    relation: "supports"
---
Deep Blue's winning approach was simpler than the human-knowledge approaches it beat.

## Working notes

The weakest link in the essay's first case, and the one the sources contradict hardest. Deep Blue's own builders report that the large majority of the features and weights in its evaluation function were made and tuned by hand; that its opening book was written by four grandmasters; that an extended book summarised a 700,000-game grandmaster database to nudge its play toward human opening theory; and that one hand-crafted rook feature was of critical importance in game two of the match. The AlphaZero authors, describing the field a decade later, call handcrafted evaluation refined by human experts a defining property of the strongest chess programs.

Nothing here disputes that the search was massive. What the evidence disputes is the word 'simpler'. Sutton's own sentence is the only atom on the for side.
