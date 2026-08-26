---
id: "deep-learning-speech-systems-rely-less-on-human-knowledge"
type: "claim"
corpus: "bitter-lesson"
title: "Deep learning speech systems rely less on human knowledge than the systems they replaced."
epistemic_kind: "observation"
created:
  timestamp: "2026-08-26"
  by: "agent/claude-opus-5"
short_name: "less knowledge in speech"
families:
  - "speech"
semantic_query: "feature engineering HLDA VTLN triphone states language model deep neural network learned features"
atoms_for:
  - "bl-020"
  - "bl-077"
atoms_against:
  - "bl-078"
edges:
  - to: "statistical-methods-beat-human-knowledge-methods-in-speech"
    relation: "supports"
---
Deep learning speech systems rely less on human knowledge than the systems they replaced.

## Working notes

Partly. The same paper that reports deep networks learning their own features also records that the network replaced only the acoustic model, inside a pipeline that kept tied triphone states, a trigram language model and engineered input features. Less human knowledge, not none, and the reduction is local to one component.
