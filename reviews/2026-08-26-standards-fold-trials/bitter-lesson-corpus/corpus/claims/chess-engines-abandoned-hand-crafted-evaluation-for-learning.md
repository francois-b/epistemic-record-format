---
id: "chess-engines-abandoned-hand-crafted-evaluation-for-learning"
type: "claim"
corpus: "bitter-lesson"
title: "The strongest conventional chess engine replaced its hand-crafted evaluation function with a learned one and then removed the hand-crafted evaluation entirely."
epistemic_kind: "observation"
created:
  timestamp: "2026-08-26"
  by: "agent/claude-opus-5"
short_name: "Stockfish went neural"
families:
  - "chess"
  - "lesson"
semantic_query: "Stockfish NNUE efficiently updatable neural network hand-crafted evaluation removed 2023"
atoms_for:
  - "bl-047"
  - "bl-049"
  - "bl-050"
atoms_against:
  - "bl-048"
edges:
  - to: "built-in-knowledge-plateaus-and-inhibits-progress-in-the-long-run"
    relation: "supports"
---
The strongest conventional chess engine replaced its hand-crafted evaluation function with a learned one and then removed the hand-crafted evaluation entirely.

## Working notes

Evidence the essay could not have had in 2019 and which runs its way: the hand-tuned evaluation function, the thing Deep Blue's builders spent years on, was removed from the leading engine in 2023 in favour of a network. The search around it is still alpha-beta with hand-designed heuristics, so the substitution is of evaluation and not of search.
