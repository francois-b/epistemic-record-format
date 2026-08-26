---
id: "human-knowledge-efforts-in-go-proved-irrelevant-once-search-scaled"
type: "claim"
corpus: "bitter-lesson"
title: "The human-knowledge and game-specific efforts in computer Go proved irrelevant, or worse, once search was applied effectively at scale."
epistemic_kind: "observation"
created:
  timestamp: "2026-08-26"
  by: "agent/claude-opus-5"
short_name: "Go knowledge irrelevant"
families:
  - "go"
semantic_query: "AlphaGo supervised learning human expert games policy network feature planes AlphaGo Zero tabula rasa"
atoms_for:
  - "bl-012"
  - "bl-050"
  - "bl-056"
  - "bl-057"
  - "bl-059"
atoms_against:
  - "bl-051"
  - "bl-054"
  - "bl-055"
  - "bl-058"
edges:
  - to: "computer-go-repeated-the-chess-pattern-twenty-years-later"
    relation: "supports"
---
The human-knowledge and game-specific efforts in computer Go proved irrelevant, or worse, once search was applied effectively at scale.

## Working notes

The claim is true of AlphaGo Zero and false of AlphaGo. The program that actually broke the twenty-year pattern, the one that beat Fan Hui and then Lee Sedol, was bootstrapped on about thirty million human expert moves and fed Go-specific feature pre-processing before its networks saw the board. Its own authors say so in the abstract. Eighteen months later AlphaGo Zero removed the human data and beat it a hundred games to nil, which is the essay's pattern arriving on schedule but after the sentence that describes it.

Read strictly against the 2016 program the claim fails; read as a statement about where the ceiling was, it holds. The essay does not distinguish the two.
